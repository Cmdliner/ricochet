import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { conversations, messages, participants, reactions, type Message } from "@ricochet/db";
import type { ListMessagesQuery, MessagePage, MessageView, SendMessageInput } from "@ricochet/shared";
import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { DRIZZLE, type Database } from "../db/db.module.js";
import { PodsService } from "../pods/pods.service.js";
import { takePage } from "./pagination.js";
import { groupReactions } from "./reactions.js";

@Injectable()
export class MessagesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly pods: PodsService,
  ) {}

  private async requireAccess(userId: string, conversationId: string): Promise<void> {
    const [conversation] = await this.db
      .select({ type: conversations.type })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    if (!conversation) throw new NotFoundException("Conversation not found.");

    if (conversation.type === "pod") {
      await this.pods.access(userId, conversationId);
      return;
    }
    const [member] = await this.db
      .select({ userId: participants.userId })
      .from(participants)
      .where(and(eq(participants.conversationId, conversationId), eq(participants.userId, userId)))
      .limit(1);
    if (!member) throw new NotFoundException("Conversation not found.");
  }

  private toView(row: Message, reactionsByMessage: Map<string, MessageView["reactions"]>): MessageView {
    return {
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      type: row.type,
      body: row.body,
      clientId: row.clientId,
      createdAt: row.createdAt.toISOString(),
      reactions: reactionsByMessage.get(row.id) ?? [],
    };
  }

  private async withReactions(rows: Message[]): Promise<MessageView[]> {
    if (rows.length === 0) return [];
    const reactionRows = await this.db
      .select()
      .from(reactions)
      .where(inArray(reactions.messageId, rows.map((row) => row.id)));
    const grouped = groupReactions(reactionRows);
    return rows.map((row) => this.toView(row, grouped));
  }

  async list(userId: string, conversationId: string, query: ListMessagesQuery): Promise<MessagePage> {
    await this.requireAccess(userId, conversationId);
    const rows = await this.db
      .select()
      .from(messages)
      .where(
        and(eq(messages.conversationId, conversationId), query.before ? lt(messages.id, query.before) : undefined),
      )
      .orderBy(desc(messages.id))
      .limit(query.limit + 1);

    const page = takePage(rows, query.limit);
    return { items: await this.withReactions(page.items), nextCursor: page.nextCursor };
  }

  async send(userId: string, input: SendMessageInput): Promise<{ message: MessageView; created: boolean }> {
    if (input.type !== "text") throw new BadRequestException("Voice and video notes are not supported yet.");
    await this.requireAccess(userId, input.conversationId);

    const [inserted] = await this.db
      .insert(messages)
      .values({
        conversationId: input.conversationId,
        senderId: userId,
        type: "text",
        body: input.body,
        clientId: input.clientId,
      })
      .onConflictDoNothing({ target: [messages.senderId, messages.clientId] })
      .returning();
    if (inserted) return { message: this.toView(inserted, new Map()), created: true };

    const [existing] = await this.db
      .select()
      .from(messages)
      .where(and(eq(messages.senderId, userId), eq(messages.clientId, input.clientId)))
      .limit(1);
    if (!existing) throw new Error("A message with this client id vanished mid-request.");
    const [view] = await this.withReactions([existing]);
    if (!view) throw new Error("Could not read the existing message.");
    return { message: view, created: false };
  }

  async react(userId: string, messageId: string, emoji: string, on: boolean): Promise<MessageView> {
    const [message] = await this.db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
    if (!message) throw new NotFoundException("Message not found.");
    await this.requireAccess(userId, message.conversationId);

    if (on) {
      await this.db.insert(reactions).values({ messageId, userId, emoji }).onConflictDoNothing();
    } else {
      await this.db
        .delete(reactions)
        .where(and(eq(reactions.messageId, messageId), eq(reactions.userId, userId), eq(reactions.emoji, emoji)));
    }
    const [view] = await this.withReactions([message]);
    if (!view) throw new Error("Could not read the message.");
    return view;
  }
}
