import { ConflictException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { activity, conversations, hubMembers, hubs, messages, participants, users } from "@ricochet/db";
import { EVENTS, type ActivityItem, type ActivityNew, type ActivityPage, type ListActivityQuery, type MarkActivityReadInput } from "@ricochet/shared";
import { and, count, desc, eq, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import { DRIZZLE, type Database } from "../db/db.module.js";
import { HubsService } from "../hubs/hubs.service.js";
import { canEditHub } from "../hubs/permissions.js";
import type { ConversationAccess } from "../messages/conversation-access.service.js";
import { takePage } from "../messages/pagination.js";
import { MediaService } from "../media/media.service.js";
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
    private readonly hubs: HubsService,
    private readonly media: MediaService,
  ) {}

  private select() {
    return this.db
      .select({
        id: activity.id,
        kind: activity.kind,
        readAt: activity.readAt,
        createdAt: activity.createdAt,
        emoji: activity.emoji,
        response: activity.response,
        messageId: activity.messageId,
        body: messages.body,
        actorId: users.id,
        actorName: users.displayName,
        actorColor: users.avatarColor,
        actorKey: users.avatarKey,
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
;
  }

  private toItem(row: Awaited<ReturnType<ActivityService["select"]>>[number]): ActivityItem {
    return {
      id: row.id,
      kind: row.kind,
      actor: row.actorId && row.actorName && row.actorColor ? { id: row.actorId, displayName: row.actorName, avatarColor: row.actorColor, avatarUrl: this.media.publicUrl(row.actorKey) } : null,
      hubId: row.hubId,
      hubName: row.hubName,
      conversationId: row.conversationId,
      podName: row.podName,
      messageId: row.messageId,
      preview: previewOf(row.body),
      emoji: row.emoji || null,
      invite: row.kind === "invite" ? (row.response === "accepted" || row.response === "declined" ? row.response : "pending") : null,
      read: row.readAt !== null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async list(userId: string, query: ListActivityQuery): Promise<ActivityPage> {
    const rows = await this.select()
      .where(and(eq(activity.userId, userId), visible, query.before ? lt(activity.id, query.before) : undefined))
      .orderBy(desc(activity.id))
      .limit(query.limit + 1);
    return takePage(rows.map((row) => this.toItem(row)), query.limit);
  }

  private async get(userId: string, id: string): Promise<ActivityItem> {
    const [row] = await this.select().where(and(eq(activity.userId, userId), eq(activity.id, id), visible)).limit(1);
    if (!row) throw new NotFoundException("Notification not found.");
    return this.toItem(row);
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
    rows: { userId: string; kind: ActivityItem["kind"]; actorId: string; messageId?: string; conversationId?: string; hubId: string | null; emoji?: string }[],
    shared: { preview: string | null; podName: string | null; emoji: string | null },
  ): Promise<void> {
    if (rows.length === 0) return;
    const inserted = await this.db.insert(activity).values(rows).onConflictDoNothing().returning();
    if (inserted.length === 0) return;

    const first = rows[0];
    if (!first) return;
    const [actor] = await this.db
      .select({ id: users.id, displayName: users.displayName, avatarColor: users.avatarColor, avatarKey: users.avatarKey })
      .from(users)
      .where(eq(users.id, first.actorId))
      .limit(1);
    const [hub] = first.hubId ? await this.db.select({ name: hubs.name }).from(hubs).where(eq(hubs.id, first.hubId)).limit(1) : [];
    const unread = await this.unreadForMany(inserted.map((row) => row.userId));

    for (const row of inserted) {
      const item: ActivityItem = {
        id: row.id,
        kind: row.kind,
        actor: actor ? { id: actor.id, displayName: actor.displayName, avatarColor: actor.avatarColor, avatarUrl: this.media.publicUrl(actor.avatarKey) } : null,
        hubId: row.hubId,
        hubName: hub?.name ?? null,
        conversationId: row.conversationId,
        podName: shared.podName,
        messageId: row.messageId,
        preview: shared.preview,
        emoji: shared.emoji,
        invite: row.kind === "invite" ? "pending" : null,
        read: false,
        createdAt: row.createdAt.toISOString(),
      };
      const payload: ActivityNew = { item, unread: unread.get(row.userId) ?? 0 };
      this.bus.toUser(row.userId, EVENTS.activityNew, payload);
    }
  }

  /** Owners and admins can invite anyone who has a profile. Asking again while an invite is waiting does nothing. */
  async invite(actorId: string, hubId: string, targetId: string): Promise<void> {
    await this.hubs.requireRole(hubId, actorId, canEditHub);
    if (await this.hubs.roleOf(hubId, targetId)) throw new ConflictException("That person is already in this hub.");
    const [target] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, targetId), isNotNull(users.profileCompletedAt)))
      .limit(1);
    if (!target) throw new NotFoundException("Person not found.");

    const [waiting] = await this.db
      .select({ id: activity.id })
      .from(activity)
      .where(and(eq(activity.userId, targetId), eq(activity.kind, "invite"), eq(activity.hubId, hubId), isNull(activity.response)))
      .limit(1);
    if (waiting) return;

    await this.insertAndAnnounce(
      [{ userId: targetId, kind: "invite", actorId, hubId }],
      { preview: null, podName: null, emoji: null },
    );
  }

  async respond(userId: string, activityId: string, accept: boolean): Promise<ActivityItem> {
    const current = await this.get(userId, activityId);
    if (current.kind !== "invite") throw new ConflictException("Only invites can be answered.");
    if (current.invite !== "pending") throw new ConflictException("You already answered this invite.");
    if (accept && current.hubId) await this.hubs.joinHub(userId, current.hubId);

    await this.db
      .update(activity)
      .set({ response: accept ? "accepted" : "declined", readAt: new Date() })
      .where(and(eq(activity.id, activityId), eq(activity.userId, userId)));
    this.bus.toUser(userId, EVENTS.activityUnread, { unread: await this.unreadFor(userId) });
    return this.get(userId, activityId);
  }

  /** The message is already saved, so a failure here is logged and must not fail the request. */
  inBackground(work: Promise<void>): void {
    work.catch((error: unknown) => this.log.error(`Could not record activity: ${String(error)}`));
  }
}
