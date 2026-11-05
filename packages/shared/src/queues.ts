import { z } from "zod";

/** Background queue names (BullMQ). */
export const QUEUES = {
  media: "media",
  push: "push",
  maintenance: "maintenance",
} as const;

export const MEDIA_JOBS = {
  processVoice: "process-voice",
  processVideo: "process-video",
} as const;

export const mediaJobSchema = z.object({ messageId: z.string().min(1) });
export type MediaJob = z.infer<typeof mediaJobSchema>;
