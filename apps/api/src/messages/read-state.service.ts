import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { messages, participants } from "@ricochet/db";
import { EVENTS, type UnreadUpdate } from "@ricochet/shared";
import { and, count, eq, gt, isNull, lt, ne, or, sql } from "drizzle-orm";
import { DRIZZLE, type Database } from "../db/db.module.js";
import { RealtimeBus } from "../realtime/realtime-bus.js";
import { ConversationAccessService, type ConversationAccess } from "./conversation-access.service.js";

@Injectable()
export class ReadStateService {
  private readonly log = new Logger(ReadStateService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly access: ConversationAccessService,
    private readonly bus: RealtimeBus,
  ) {}

  async markRead(userId: string, conversationId: string, lastReadId: string): Promise<UnreadUpdate> {
    const conversation = await this.access.require(userId, conversationId);
    const [message] = await this.db
      .select({ id: messages.id })
      .from(messages)
      .where(and(eq(messages.id, lastReadId), eq(messages.conversationId, conversationId)))
      .limit(1);
    if (!message) throw new NotFoundException("Message not found.");

    // Only ever moves forward, so a slow device reporting an older message cannot bring the badge back.
    const moved = await this.db
      .update(participants)
      .set({ lastReadId })
      .where(
        and(
          eq(participants.conversationId, conversationId),
          eq(participants.userId, userId),
          or(isNull(participants.lastReadId), lt(participants.lastReadId, lastReadId)),
        ),
      )
      .returning({ userId: participants.userId });

    // On a private pod a row means "on the guest list", so an owner who is only looking must not get one.
    if (moved.length === 0 && conversation.type === "pod" && !conversation.isPrivate) {
      await this.db
        .insert(participants)
        .values({ conversationId, userId, lastReadId })
        .onConflictDoNothing();
    }

    const update = { conversationId, unread: await this.unreadFor(userId, conversationId) };
    this.bus.toUser(userId, EVENTS.unreadUpdate, update);
    return update;
  }

  async unreadFor(userId: string, conversationId: string): Promise<number> {
    const [row] = await this.db
      .select({ lastReadId: participants.lastReadId })
      .from(participants)
      .where(and(eq(participants.conversationId, conversationId), eq(participants.userId, userId)))
      .limit(1);
    const [result] = await this.db
      .select({ unread: count() })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, userId),
          row?.lastReadId ? gt(messages.id, row.lastReadId) : undefined,
        ),
      );
    return result?.unread ?? 0;
  }

  /** Tells everyone who can see the conversation, except the sender, their new unread count. */
  async announceNewMessage(conversation: ConversationAccess, senderId: string): Promise<void> {
    const recipients = conversation.hubId
      ? sql`
          select hm.user_id as "userId" from hub_members hm
          left join participants p on p.conversation_id = ${conversation.id} and p.user_id = hm.user_id
          where hm.hub_id = ${conversation.hubId}
            ${conversation.isPrivate ? sql`and p.user_id is not null` : sql``}`
      : sql`select user_id as "userId" from participants where conversation_id = ${conversation.id}`;

    const result = await this.db.execute<{ userId: string; unread: number }>(sql`
      select r."userId", (
        select count(*)::int from messages m
        where m.conversation_id = ${conversation.id}
          and m.sender_id <> r."userId"
          and (p.last_read_id is null or m.id > p.last_read_id)
      ) as unread
      from (${recipients}) r
      left join participants p on p.conversation_id = ${conversation.id} and p.user_id = r."userId"
      where r."userId" <> ${senderId}`);

    for (const row of result.rows) {
      this.bus.toUser(row.userId, EVENTS.unreadUpdate, { conversationId: conversation.id, unread: row.unread });
    }
  }

  /** The message is already saved, so a failure here is logged and must not turn the send into an error. */
  announceInBackground(conversation: ConversationAccess, senderId: string): void {
    this.announceNewMessage(conversation, senderId).catch((error: unknown) => {
      this.log.error(`Could not announce unread counts: ${String(error)}`);
    });
  }
}
