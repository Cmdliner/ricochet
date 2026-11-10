import { InjectQueue } from "@nestjs/bullmq";
import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { attachments, messages, reactions } from "@ricochet/db";
import {
  EVENTS,
  MEDIA_JOBS,
  QUEUES,
  type ListMessagesQuery,
  type MediaUpload,
  type MediaView,
  type MessagePage,
  type MessageView,
  type RequestUploadInput,
  type SendMessageInput,
} from "@ricochet/shared";
import type { Queue } from "bullmq";
import { and, desc, eq, lt } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ActivityService } from "../activity/activity.service.js";
import { ChatsService } from "../chats/chats.service.js";
import { DRIZZLE, type Database } from "../db/db.module.js";
import { MediaService } from "../media/media.service.js";
import { PushService } from "../push/push.service.js";
import { RealtimeBus } from "../realtime/realtime-bus.js";
import { ConversationAccessService } from "./conversation-access.service.js";
import { mediaPrefix, VIDEO_RULE, VOICE_RULE } from "./media-rules.js";
import { MessageViewService } from "./message-view.service.js";
import { takePage } from "./pagination.js";
import { ReadStateService } from "./read-state.service.js";

@Injectable()
export class MessagesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly access: ConversationAccessService,
    private readonly readState: ReadStateService,
    private readonly activity: ActivityService,
    private readonly chats: ChatsService,
    private readonly bus: RealtimeBus,
    private readonly views: MessageViewService,
    private readonly media: MediaService,
    private readonly push: PushService,
    @InjectQueue(QUEUES.media) private readonly mediaQueue: Queue,
  ) {}

  async list(userId: string, conversationId: string, query: ListMessagesQuery): Promise<MessagePage> {
    await this.access.require(userId, conversationId);
    const rows = await this.db
      .select()
      .from(messages)
      .where(
        and(eq(messages.conversationId, conversationId), query.before ? lt(messages.id, query.before) : undefined),
      )
      .orderBy(desc(messages.id))
      .limit(query.limit + 1);

    const page = takePage(rows, query.limit);
    return { items: await this.views.views(page.items), nextCursor: page.nextCursor };
  }

  /** Step one of sending a recording: where to upload it. Step two is `send` with the key. */
  async requestMediaUpload(userId: string, conversationId: string, input: RequestUploadInput): Promise<MediaUpload> {
    await this.access.require(userId, conversationId);
    const rule = input.kind === "voice" ? VOICE_RULE : VIDEO_RULE;
    return this.media.requestUpload(rule, mediaPrefix(userId), { contentType: input.contentType, size: input.sizeBytes, id: randomUUID() });
  }

  /** Fresh links for a recording whose earlier ones have expired. */
  async mediaFor(userId: string, messageId: string): Promise<MediaView> {
    const [message] = await this.db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
    if (!message) throw new NotFoundException("Message not found.");
    await this.access.require(userId, message.conversationId);
    const [attachment] = await this.db.select().from(attachments).where(eq(attachments.messageId, messageId)).limit(1);
    if (!attachment) throw new NotFoundException("This message has no recording.");
    return this.views.mediaView(attachment);
  }

  /** The upload went straight to storage, so check the key is this person's and the file is what they said it was. */
  private async checkRecording(userId: string, kind: "voice" | "video", mediaKey: string): Promise<void> {
    if (!mediaKey.startsWith(mediaPrefix(userId))) throw new BadRequestException("That recording does not belong to you.");
    await this.media.verifyUpload(mediaKey, kind === "voice" ? VOICE_RULE : VIDEO_RULE);
  }

  /** A reply can only quote a message in the same conversation, so nobody can pull text out of a room they were never in. */
  private async requireReplyTarget(conversationId: string, messageId: string): Promise<void> {
    const [parent] = await this.db
      .select({ id: messages.id })
      .from(messages)
      .where(and(eq(messages.id, messageId), eq(messages.conversationId, conversationId)))
      .limit(1);
    if (!parent) throw new BadRequestException("The message you are replying to is not in this conversation.");
  }

  async send(userId: string, input: SendMessageInput): Promise<{ message: MessageView; created: boolean }> {
    const conversation = await this.access.require(userId, input.conversationId);
    // The schema already insists on these for recordings. Repeating it here is what lets the compiler know.
    const recording =
      input.type === "text"
        ? null
        : { kind: input.type, key: input.mediaKey, durationMs: input.durationMs, waveform: input.waveform ?? null };
    if (recording && (!recording.key || !recording.durationMs)) throw new BadRequestException("Upload the recording first.");
    if (recording?.key) await this.checkRecording(userId, recording.kind, recording.key);
    if (input.replyToId) await this.requireReplyTarget(input.conversationId, input.replyToId);

    const inserted = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(messages)
        .values({
          conversationId: input.conversationId,
          senderId: userId,
          type: input.type,
          body: input.type === "text" ? input.body : null,
          clientId: input.clientId,
          replyToId: input.replyToId ?? null,
        })
        .onConflictDoNothing({ target: [messages.senderId, messages.clientId] })
        .returning();
      if (row && recording?.key) {
        await tx.insert(attachments).values({
          messageId: row.id,
          storageKey: recording.key,
          durationMs: recording.durationMs,
          waveform: recording.kind === "voice" ? recording.waveform : null,
          // A voice note is playable as uploaded. A video still needs its poster frame and a length check.
          status: recording.kind === "voice" ? "ready" : "processing",
        });
      }
      return row;
    });

    if (inserted) {
      const [message] = await this.views.views([inserted]);
      if (!message) throw new Error("Could not read the saved message.");
      if (input.type === "video") {
        await this.mediaQueue.add(MEDIA_JOBS.processVideo, { messageId: inserted.id }, { attempts: 2, backoff: { type: "fixed", delay: 3000 } });
      }
      this.bus.toConversation(message.conversationId, EVENTS.messageNew, message);
      this.readState.announceInBackground(conversation.id, userId);
      this.activity.inBackground(this.activity.recordForMessage(conversation, message, userId));
      this.activity.inBackground(this.activity.recordReply(conversation, message, userId));
      this.chats.announceInBackground(conversation, inserted);
      this.push.inBackground(this.push.notifyMessage(conversation, message, userId));
      return { message, created: true };
    }

    const [existing] = await this.db
      .select()
      .from(messages)
      .where(and(eq(messages.senderId, userId), eq(messages.clientId, input.clientId)))
      .limit(1);
    if (!existing) throw new Error("A message with this client id vanished mid-request.");
    const [view] = await this.views.views([existing]);
    if (!view) throw new Error("Could not read the existing message.");
    return { message: view, created: false };
  }

  async react(userId: string, messageId: string, emoji: string, on: boolean): Promise<MessageView> {
    const [message] = await this.db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
    if (!message) throw new NotFoundException("Message not found.");
    const conversation = await this.access.require(userId, message.conversationId);

    if (on) {
      await this.db.insert(reactions).values({ messageId, userId, emoji }).onConflictDoNothing();
      this.activity.inBackground(this.activity.recordReaction(conversation, message, userId, emoji));
    } else {
      await this.db
        .delete(reactions)
        .where(and(eq(reactions.messageId, messageId), eq(reactions.userId, userId), eq(reactions.emoji, emoji)));
    }
    const [view] = await this.views.views([message]);
    if (!view) throw new Error("Could not read the message.");
    return view;
  }
}
