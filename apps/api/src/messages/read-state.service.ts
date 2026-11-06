import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { messages, participants } from "@ricochet/db";
import { EVENTS, type UnreadUpdate } from "@ricochet/shared";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { DRIZZLE, type Database } from "../db/db.module.js";
import { RealtimeBus } from "../realtime/realtime-bus.js";
import { ConversationAccessService } from "./conversation-access.service.js";
import { unreadCounts, type UnreadRow } from "./unread-sql.js";

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
      await this.db.insert(participants).values({ conversationId, userId, lastReadId }).onConflictDoNothing();
    }

    const update = { conversationId, unread: await this.unreadFor(userId, conversationId) };
    this.bus.toUser(userId, EVENTS.unreadUpdate, update);
    return update;
  }

  async unreadFor(userId: string, conversationId: string): Promise<number> {
    const result = await this.db.execute<UnreadRow>(unreadCounts({ userId, conversationId }));
    return result.rows[0]?.unread ?? 0;
  }

  /** Every conversation this person has something unread in. Conversations with nothing unread are left out. */
  async listUnread(userId: string): Promise<UnreadUpdate[]> {
    const result = await this.db.execute<UnreadRow>(unreadCounts({ userId }));
    return result.rows.filter((row) => row.unread > 0).map((row) => ({ conversationId: row.conversationId, unread: row.unread }));
  }

  /** Tells everyone who can see the conversation, except the sender, their new unread count. */
  async announceNewMessage(conversationId: string, senderId: string): Promise<void> {
    const result = await this.db.execute<UnreadRow>(unreadCounts({ conversationId, exceptUserId: senderId }));
    for (const row of result.rows) {
      this.bus.toUser(row.userId, EVENTS.unreadUpdate, { conversationId, unread: row.unread });
    }
  }

  /** The message is already saved, so a failure here is logged and must not turn the send into an error. */
  announceInBackground(conversationId: string, senderId: string): void {
    this.announceNewMessage(conversationId, senderId).catch((error: unknown) => {
      this.log.error(`Could not announce unread counts: ${String(error)}`);
    });
  }
}
