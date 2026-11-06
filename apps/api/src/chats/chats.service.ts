import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { conversations, participants, users, type Message } from "@ricochet/db";
import { EVENTS, type ChatSettingsInput, type ChatUpdated, type ChatView, type MessageType } from "@ricochet/shared";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { DRIZZLE, type Database } from "../db/db.module.js";
import type { ConversationAccess } from "../messages/conversation-access.service.js";
import { unreadCounts, type UnreadRow } from "../messages/unread-sql.js";
import { MediaService } from "../media/media.service.js";
import { RealtimeBus } from "../realtime/realtime-bus.js";
import { dmKeyFor } from "./dm-key.js";

type ChatRow = {
  id: string;
  created_at: Date;
  pinned: boolean;
  muted: boolean;
  person_id: string;
  display_name: string;
  handle: string;
  avatar_color: ChatView["person"]["avatarColor"];
  avatar_key: string | null;
  last_id: string | null;
  last_type: MessageType;
  last_body: string | null;
  last_sender: string | null;
  last_at: Date | null;
};

@Injectable()
export class ChatsService {
  private readonly log = new Logger(ChatsService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly bus: RealtimeBus,
    private readonly media: MediaService,
  ) {}

  /** Finds the chat between two people, or creates it. Safe to call twice, or from both people at once. */
  async open(userId: string, targetId: string): Promise<ChatView> {
    if (targetId === userId) throw new BadRequestException("You cannot start a chat with yourself.");
    const [target] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, targetId), isNotNull(users.profileCompletedAt)))
      .limit(1);
    if (!target) throw new NotFoundException("Person not found.");

    const dmKey = dmKeyFor(userId, targetId);
    const chatId = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(conversations)
        .values({ type: "direct", dmKey })
        .onConflictDoNothing()
        .returning({ id: conversations.id });
      const id =
        created?.id ??
        (await tx.select({ id: conversations.id }).from(conversations).where(eq(conversations.dmKey, dmKey)).limit(1))[0]?.id;
      if (!id) throw new Error("Could not open the chat.");
      await tx
        .insert(participants)
        .values([
          { conversationId: id, userId },
          { conversationId: id, userId: targetId },
        ])
        .onConflictDoNothing();
      return id;
    });
    return this.get(userId, chatId);
  }

  async get(userId: string, chatId: string): Promise<ChatView> {
    const [chat] = await this.query(userId, chatId);
    if (!chat) throw new NotFoundException("Chat not found.");
    return chat;
  }

  /** Chats appear here once someone has written in them. Pinned first, then most recent. */
  async list(userId: string): Promise<ChatView[]> {
    const chats = (await this.query(userId)).filter((chat) => chat.lastMessage !== null);
    return chats.sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        (b.lastMessage?.createdAt ?? b.createdAt).localeCompare(a.lastMessage?.createdAt ?? a.createdAt),
    );
  }

  async updateSettings(userId: string, chatId: string, input: ChatSettingsInput): Promise<ChatView> {
    const updated = await this.db
      .update(participants)
      .set(input)
      .where(
        and(
          eq(participants.conversationId, chatId),
          eq(participants.userId, userId),
          inArray(participants.conversationId, this.db.select({ id: conversations.id }).from(conversations).where(eq(conversations.type, "direct"))),
        ),
      )
      .returning({ userId: participants.userId });
    if (updated.length === 0) throw new NotFoundException("Chat not found.");
    return this.get(userId, chatId);
  }

  /** Lets both people's chat lists update live, including a list that has never heard of this chat. */
  announceInBackground(conversation: ConversationAccess, message: Message): void {
    if (conversation.type !== "direct") return;
    this.announce(conversation.id, message).catch((error: unknown) => {
      this.log.error(`Could not announce chat update: ${String(error)}`);
    });
  }

  private async announce(conversationId: string, message: Message): Promise<void> {
    const members = await this.db
      .select({ userId: participants.userId })
      .from(participants)
      .where(eq(participants.conversationId, conversationId));
    const payload: ChatUpdated = {
      conversationId,
      lastMessage: {
        id: message.id,
        type: message.type,
        body: message.body,
        senderId: message.senderId,
        createdAt: message.createdAt.toISOString(),
      },
    };
    for (const member of members) this.bus.toUser(member.userId, EVENTS.chatUpdated, payload);
  }

  private async query(userId: string, chatId?: string): Promise<ChatView[]> {
    const result = await this.db.execute<ChatRow>(sql`
      select c.id, c.created_at, p.pinned, p.muted,
        u.id as person_id, u.display_name, u.handle, u.avatar_color, u.avatar_key,
        lm.id as last_id, lm.type as last_type, lm.body as last_body, lm.sender_id as last_sender, lm.created_at as last_at
      from participants p
      join conversations c on c.id = p.conversation_id and c.type = 'direct'
      join participants other on other.conversation_id = c.id and other.user_id <> p.user_id
      join users u on u.id = other.user_id
      left join lateral (
        select m.id, m.type, m.body, m.sender_id, m.created_at from messages m
        where m.conversation_id = c.id order by m.id desc limit 1
      ) lm on true
      where p.user_id = ${userId} ${chatId ? sql`and c.id = ${chatId}` : sql``}`);

    const unread = new Map(
      (await this.db.execute<UnreadRow>(unreadCounts({ userId }))).rows.map((row) => [row.conversationId, row.unread]),
    );
    return result.rows.map((row) => ({
      id: row.id,
      person: {
        id: row.person_id,
        displayName: row.display_name,
        handle: row.handle,
        avatarColor: row.avatar_color,
        avatarUrl: this.media.publicUrl(row.avatar_key),
      },
      pinned: row.pinned,
      muted: row.muted,
      unread: unread.get(row.id) ?? 0,
      lastMessage:
        row.last_id && row.last_sender && row.last_at
          ? { id: row.last_id, type: row.last_type, body: row.last_body, senderId: row.last_sender, createdAt: new Date(row.last_at).toISOString() }
          : null,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }
}
