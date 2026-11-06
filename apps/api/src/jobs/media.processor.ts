import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { attachments, messages } from "@ricochet/db";
import { EVENTS, LIMITS, MEDIA_JOBS, type MediaJob, QUEUES } from "@ricochet/shared";
import type { Job } from "bullmq";
import { eq } from "drizzle-orm";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Env } from "../config/env.js";
import { DRIZZLE, type Database } from "../db/db.module.js";
import { MediaService } from "../media/media.service.js";
import { MessageViewService } from "../messages/message-view.service.js";
import { RealtimeBus } from "../realtime/realtime-bus.js";
import { makePoster, MissingBinaryError, probeDurationMs } from "./ffmpeg.js";

/** A little slack over the limit, since the phone's own timer and the file's real length rarely agree to the millisecond. */
const LENGTH_SLACK_MS = 2000;

@Processor(QUEUES.media)
export class MediaProcessor extends WorkerHost {
  private readonly log = new Logger(MediaProcessor.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly media: MediaService,
    private readonly views: MessageViewService,
    private readonly bus: RealtimeBus,
    private readonly config: ConfigService<Env, true>,
  ) {
    super();
  }

  async process(job: Job<MediaJob>) {
    if (job.name !== MEDIA_JOBS.processVideo) {
      this.log.warn(`unknown media job ${job.name}`);
      return;
    }
    await this.processVideo(job.data.messageId);
  }

  private async processVideo(messageId: string): Promise<void> {
    const [attachment] = await this.db.select().from(attachments).where(eq(attachments.messageId, messageId)).limit(1);
    if (!attachment || attachment.status === "ready") return;

    const folder = await mkdtemp(join(tmpdir(), "ricochet-media-"));
    try {
      const source = join(folder, "source");
      await this.media.download(attachment.storageKey, source);

      const durationMs = await probeDurationMs(this.config.get("FFPROBE_PATH", { infer: true }), source);
      if (durationMs > LIMITS.videoNoteMaxMs + LENGTH_SLACK_MS) throw new Error("The video is longer than allowed.");

      const posterKey = await this.makePosterFor(attachment.storageKey, source, folder, durationMs);
      await this.db.update(attachments).set({ status: "ready", durationMs, posterKey }).where(eq(attachments.messageId, messageId));
    } catch (error) {
      if (error instanceof MissingBinaryError) {
        // Without ffmpeg there is nothing to check or to make, and the video still plays as uploaded.
        this.log.warn(`${error.message} Sending video ${messageId} without a poster frame.`);
        await this.db.update(attachments).set({ status: "ready" }).where(eq(attachments.messageId, messageId));
      } else {
        this.log.error(`Video ${messageId} failed: ${String(error)}`);
        await this.db.update(attachments).set({ status: "failed" }).where(eq(attachments.messageId, messageId));
      }
    } finally {
      await rm(folder, { recursive: true, force: true });
      await this.announce(messageId);
    }
  }

  private async makePosterFor(videoKey: string, source: string, folder: string, durationMs: number): Promise<string | null> {
    const poster = join(folder, "poster.jpg");
    try {
      await makePoster(this.config.get("FFMPEG_PATH", { infer: true }), source, poster, Math.min(0.3, durationMs / 2000));
    } catch (error) {
      if (error instanceof MissingBinaryError) throw error;
      this.log.warn(`No poster frame for ${videoKey}: ${String(error)}`);
      return null;
    }
    const posterKey = `${videoKey.replace(/\.[a-z0-9]+$/, "")}-poster.jpg`;
    await this.media.uploadFile(posterKey, poster, "image/jpeg");
    return posterKey;
  }

  /** Tells everyone looking at the conversation that the video is ready, or that it failed. */
  private async announce(messageId: string): Promise<void> {
    const [row] = await this.db.select({ conversationId: messages.conversationId }).from(messages).where(eq(messages.id, messageId)).limit(1);
    const view = await this.views.viewOf(messageId);
    if (row && view) this.bus.toConversation(row.conversationId, EVENTS.messageUpdated, view);
  }
}
