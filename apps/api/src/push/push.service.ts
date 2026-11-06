import { Inject, Injectable, Logger } from "@nestjs/common";
import { devices, users } from "@ricochet/db";
import { rooms, type MessageView, type PushData, type RegisterDeviceInput } from "@ricochet/shared";
import { and, eq, inArray, sql } from "drizzle-orm";
import { extractMentions } from "../activity/mentions.js";
import { DRIZZLE, type Database } from "../db/db.module.js";
import type { ConversationAccess } from "../messages/conversation-access.service.js";
import { RealtimeBus } from "../realtime/realtime-bus.js";
import { describeMessagePush } from "./push-format.js";
import { PUSH_PROVIDER, type PushMessage, type PushProvider } from "./push-provider.js";

type AudienceRow = { userId: string; muted: boolean; mentionsOnly: boolean };

const toData = (data: PushData): Record<string, string> => data;

@Injectable()
export class PushService {
  private readonly log = new Logger(PushService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(PUSH_PROVIDER) private readonly provider: PushProvider,
    private readonly bus: RealtimeBus,
  ) {}

  /** A token belongs to one phone. If someone else signs in on it, it moves to them. */
  async registerDevice(userId: string, input: RegisterDeviceInput): Promise<void> {
    await this.db
      .insert(devices)
      .values({ userId, pushToken: input.pushToken, platform: input.platform })
      .onConflictDoUpdate({ target: devices.pushToken, set: { userId, platform: input.platform, lastSeenAt: new Date() } });
  }

  async unregisterDevice(userId: string, pushToken: string): Promise<void> {
    await this.db.delete(devices).where(and(eq(devices.userId, userId), eq(devices.pushToken, pushToken)));
  }

  /** Everyone who can see the conversation except the sender, with their own mute and mentions-only choices. */
  private async audience(conversationId: string, senderId: string): Promise<AudienceRow[]> {
    const result = await this.db.execute<AudienceRow>(sql`
      select hm.user_id as "userId", coalesce(p.muted, false) as muted, coalesce(p.mentions_only, false) as "mentionsOnly"
      from conversations c
      join hub_members hm on hm.hub_id = c.hub_id
      left join participants p on p.conversation_id = c.id and p.user_id = hm.user_id
      where c.id = ${conversationId} and c.type = 'pod' and (not c.is_private or p.user_id is not null) and hm.user_id <> ${senderId}
      union all
      select p.user_id, p.muted, p.mentions_only
      from conversations c
      join participants p on p.conversation_id = c.id
      where c.id = ${conversationId} and c.type <> 'pod' and p.user_id <> ${senderId}`);
    return result.rows;
  }

  /**
   * Notifies the people who are not already looking at the conversation. Anyone with it open on screen has the
   * message live over the socket, so a banner on top of that would only be noise.
   */
  async notifyMessage(conversation: ConversationAccess, message: MessageView, senderId: string): Promise<void> {
    const audience = await this.audience(conversation.id, senderId);
    if (audience.length === 0) return;

    const handles = extractMentions(message.body ?? "");
    const mentioned = new Set<string>();
    if (handles.length > 0) {
      const rows = await this.db
        .select({ id: users.id })
        .from(users)
        .where(and(inArray(users.handle, handles), inArray(users.id, audience.map((row) => row.userId))));
      for (const row of rows) mentioned.add(row.id);
    }

    const viewing = new Set((await this.bus.socketsIn(rooms.conversation(conversation.id))).map((socket) => socket.data.userId));
    const targets = audience.filter(
      (row) => !row.muted && (!row.mentionsOnly || mentioned.has(row.userId)) && !viewing.has(row.userId),
    );
    if (targets.length === 0) return;

    const [sender] = await this.db.select({ name: users.displayName }).from(users).where(eq(users.id, senderId)).limit(1);
    const hub = conversation.hubId ? await this.hubName(conversation.hubId) : null;
    const tokens = await this.db
      .select({ userId: devices.userId, token: devices.pushToken })
      .from(devices)
      .where(inArray(devices.userId, targets.map((row) => row.userId)));

    const data = toData({ type: "message", conversationId: conversation.id, kind: conversation.type === "pod" ? "pod" : "chat" });
    const messages: PushMessage[] = tokens.map(({ userId, token }) => ({
      to: token,
      data,
      ...describeMessagePush({
        sender: sender?.name ?? "Someone",
        type: message.type,
        body: message.body,
        pod: conversation.type === "pod" ? conversation.name : null,
        hub,
        mentioned: mentioned.has(userId),
      }),
    }));
    await this.deliver(messages);
  }

  async notifyInvite(targetUserId: string, inviterName: string, hubName: string): Promise<void> {
    const tokens = await this.db.select({ token: devices.pushToken }).from(devices).where(eq(devices.userId, targetUserId));
    await this.deliver(
      tokens.map(({ token }) => ({
        to: token,
        title: "Hub invitation",
        body: `${inviterName} invited you to join ${hubName}`,
        data: toData({ type: "invite" }),
      })),
    );
  }

  private async hubName(hubId: string): Promise<string | null> {
    const result = await this.db.execute<{ name: string }>(sql`select name from hubs where id = ${hubId} limit 1`);
    return result.rows[0]?.name ?? null;
  }

  private async deliver(messages: PushMessage[]): Promise<void> {
    if (messages.length === 0) return;
    const outcomes = await this.provider.send(messages);
    const gone = outcomes.filter((outcome) => outcome.status === "invalid-token").map((outcome) => outcome.to);
    if (gone.length > 0) await this.db.delete(devices).where(inArray(devices.pushToken, gone));
  }

  /** The message is already saved, so a failure here is logged and must not fail the request. */
  inBackground(work: Promise<void>): void {
    work.catch((error: unknown) => this.log.error(`Could not send push notifications: ${String(error)}`));
  }
}
