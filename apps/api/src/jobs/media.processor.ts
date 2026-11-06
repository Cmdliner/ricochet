import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { MEDIA_JOBS, QUEUES, type MediaJob } from "@ricochet/shared";
import type { Job } from "bullmq";

@Processor(QUEUES.media)
export class MediaProcessor extends WorkerHost {
  private readonly log = new Logger(MediaProcessor.name);

  async process(job: Job<MediaJob>) {
    switch (job.name) {
      case MEDIA_JOBS.processVoice:
        // TODO: probe the file, normalise loudness, then emit message:updated.
        this.log.log(`voice note ${job.data.messageId}`);
        return;
      case MEDIA_JOBS.processVideo:
        // TODO: ffmpeg to one H.264 mp4 plus a poster frame, then emit message:updated.
        this.log.log(`video note ${job.data.messageId}`);
        return;
      default:
        this.log.warn(`unknown media job ${job.name}`);
    }
  }
}
