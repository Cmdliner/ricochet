import { Inject, Injectable, Logger } from "@nestjs/common";
import { activity, conversations, hubMembers, hubs, messages, participants, users } from "@ricochet/db";
import { EVENTS, type ActivityItem, type ActivityNew, type ActivityPage, type ListActivityQuery, type MarkActivityReadInput } from "@ricochet/shared";
import { and, count, desc, eq, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import { DRIZZLE, type Database } from "../db/db.module.js";
import type { ConversationAccess } from "../messages/conversation-access.service.js";
import { takePage } from "../messages/pagination.js";
import { RealtimeBus } from "../realtime/realtime-bus.js";
import { extractMentions, previewOf } from "./mentions.js";

const ANNOUNCEMENT_POD = "announcements";

type MessageRef = { id: string; body: string | null };

/**
 * A notification is only shown while the person could still open the place it points to. That rule lives in
 * the query rather than in cleanup code, so leaving a hub or being removed from a private pod hides them
 * without anyone having to remember to delete rows.
 */
const visible = or(
  eq(activity.kind, "invite"),
  and(
    isNotNull(hubMembers.userId),
    or(eq(conversations.isPrivate, false), isNotNull(participants.userId), eq(hubMembers.role, "owner")),
  ),
);

@Injectable()
export class ActivityService {
  private readonly log = new Logger(ActivityService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly bus: RealtimeBus,
  ) {}

  async list(userId: string, query: ListActivityQuery): Promise<ActivityPage> {
    const rows = await this.db
      .select({
        id: activity.id,
        kind: activity.kind,
        readAt: activity.readAt,
        createdAt: activity.createdAt,
        emoji: activity.emoji,
        messageId: activity.messageId,
        body: messages.body,
        actorId: users.id,
        actorName: users.displayName,
        actorColor: users.avatarColor,
        hubId: activity.hubId,
        hubName: hubs.name,
        conversationId: activity.conversationId,
        podName: conversations.name,
      })
      .from(activity)
      .leftJoin(users, eq(users.id, activity.actorId))
      .leftJoin(messages, eq(messages.id, activity.messageId))
      .leftJoin(conversations, eq(conversations.id, activity.conversationId))
      .leftJoin(hubs, eq(hubs.id, activity.hubId))
      .leftJoin(hubMembers, and(eq(hubMembers.hubId, activity.hubId), eq(hubMembers.userId, activity.userId)))
      .leftJoin(participants, and(eq(participants.conversationId, activity.conversationId), eq(participants.userId, activity.userId)))
      .where(and(eq(activity.userId, userId), visible, query.before ? lt(activity.id, query.before) : undefined))
      .orderBy(desc(activity.id))
      .limit(query.limit + 1);

    const items: ActivityItem[] = rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      actor: row.actorId && row.actorName && row.actorColor ? { id: row.actorId, displayName: row.actorName, avatarColor: row.actorColor } : null,
      hubId: row.hubId,
      hubName: row.hubName,
      conversationId: row.conversationId,
      podName: row.podName,
      messageId: row.messageId,
      preview: previewOf(row.body),
      emoji: row.emoji || null,
      read: row.readAt !== null,
      createdAt: row.createdAt.toISOString(),
    }));
    return takePage(items, query.limit);
  }

  async unreadFor(userId: string): Promise<number> {
    return (await this.unreadForMany([userId])).get(userId) ?? 0;
  }

  private async unreadForMany(userIds: string[]): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();
    const rows = await this.db
      .select({ userId: activity.userId, unread: count() })
      .from(activity)
      .leftJoin(conversations, eq(conversations.id, activity.conversationId))
      .leftJoin(hubMembers, and(eq(hubMembers.hubId, activity.hubId), eq(hubMembers.userId, activity.userId)))
      .leftJoin(participants, and(eq(participants.conversationId, activity.conversationId), eq(participants.userId, activity.userId)))
      .where(and(inArray(activity.userId, userIds), isNull(activity.readAt), visible))
      .groupBy(activity.userId);
    return new Map(rows.map((row) => [row.userId, row.unread]));
  }

  async markRead(userId: string, input: MarkActivityReadInput): Promise<{ unread: number }> {
    await this.db
      .update(activity)
      .set({ readAt: new Date() })
      .where(and(eq(activity.userId, userId), isNull(activity.readAt), input.ids ? inArray(activity.id, input.ids) : undefined));
    const unread = await this.unreadFor(userId);
    this.bus.toUser(userId, EVENTS.activityUnread, { unread });
    return { unread };
  }

  /** Mentions, and announcements from the hub's owner or admins. Runs after the message is saved. */
  async recordForMessage(conversation: ConversationAccess, message: MessageRef, senderId: string): Promise<void> {
    if (conversation.type !== "pod" || !conversation.hubId) return;
    const hubId = conversation.hubId;
    const handles = extractMentions(message.body ?? "");

    const [sender] = await this.db
      .select({ role: hubMembers.role })
      .from(hubMembers)
      .where(and(eq(hubMembers.hubId, hubId), eq(hubMembers.userId, senderId)))
      .limit(1);
    const announces = conversation.name === ANNOUNCEMENT_POD && (sender?.role === "owner" || sender?.role === "admin");
    if (handles.length === 0 && !announces) return;

    const audience = await this.db
      .select({ userId: users.id, handle: users.handle })
      .from(hubMembers)
      .innerJoin(users, eq(users.id, hubMembers.userId))
      .leftJoin(participants, and(eq(participants.conversationId, conversation.id), eq(participants.userId, users.id)))
      .where(
        and(
          eq(hubMembers.hubId, hubId),
          conversation.isPrivate ? or(isNotNull(participants.userId), eq(hubMembers.role, "owner")) : undefined,
          announces ? undefined : inArray(users.handle, handles),
        ),
      );

    const mentioned = new Set(handles);
    const rows = audience
      .filter((person) => person.userId !== senderId)
      .map((person) => ({
        userId: person.userId,
        kind: mentioned.has(person.handle) ? ("mention" as const) : ("announcement" as const),
      }));
    await this.insertAndAnnounce(
      rows.map((row) => ({ ...row, actorId: senderId, messageId: message.id, conversationId: conversation.id, hubId })),
      { preview: previewOf(message.body), podName: conversation.name, emoji: null },
    );
  }

  async recordReaction(conversation: ConversationAccess, message: MessageRef & { senderId: string }, reactorId: string, emoji: string): Promise<void> {
    if (message.senderId === reactorId) return;
    await this.insertAndAnnounce(
      [{ userId: message.senderId, kind: "reaction", actorId: reactorId, messageId: message.id, conversationId: conversation.id, hubId: conversation.hubId, emoji }],
      { preview: previewOf(message.body), podName: conversation.name, emoji },
    );
  }

  private async insertAndAnnounce(
    rows: { userId: string; kind: ActivityItem["kind"]; actorId: string; messageId: string; conversationId: string; hubId: string | null; emoji?: string }[],
    shared: { preview: string | null; podName: string | null; emoji: string | null },
  ): Promise<void> {
    if (rows.length === 0) return;
    const inserted = await this.db.insert(activity).values(rows).onConflictDoNothing().returning();
    if (inserted.length === 0) return;

    const first = rows[0];
    if (!first) return;
    const [actor] = await this.db
      .select({ id: users.id, displayName: users.displayName, avatarColor: users.avatarColor })
      .from(users)
      .where(eq(users.id, first.actorId))
      .limit(1);
    const [hub] = first.hubId ? await this.db.select({ name: hubs.name }).from(hubs).where(eq(hubs.id, first.hubId)).limit(1) : [];
    const unread = await this.unreadForMany(inserted.map((row) => row.userId));

    for (const row of inserted) {
      const item: ActivityItem = {
        id: row.id,
        kind: row.kind,
        actor: actor ?? null,
        hubId: row.hubId,
        hubName: hub?.name ?? null,
        conversationId: row.conversationId,
        podName: shared.podName,
        messageId: row.messageId,
        preview: shared.preview,
        emoji: shared.emoji,
        read: false,
        createdAt: row.createdAt.toISOString(),
      };
      const payload: ActivityNew = { item, unread: unread.get(row.userId) ?? 0 };
      this.bus.toUser(row.userId, EVENTS.activityNew, payload);
    }
  }

  /** The message is already saved, so a failure here is logged and must not fail the request. */
  inBackground(work: Promise<void>): void {
    work.catch((error: unknown) => this.log.error(`Could not record activity: ${String(error)}`));
  }
}
