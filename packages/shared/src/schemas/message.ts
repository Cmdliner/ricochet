import { z } from "zod";
import { LIMITS } from "../limits";

export const messageTypeSchema = z.enum(["text", "voice", "video", "system"]);
export type MessageType = z.infer<typeof messageTypeSchema>;

export const conversationTypeSchema = z.enum(["pod", "direct", "group"]);
export type ConversationType = z.infer<typeof conversationTypeSchema>;

export const mediaStatusSchema = z.enum(["uploading", "processing", "ready", "failed"]);
export type MediaStatus = z.infer<typeof mediaStatusSchema>;

export const sendMessageSchema = z
  .object({
    /** Made on the phone. A retry with the same id can never create a second message. */
    clientId: z.uuid(),
    conversationId: z.uuid(),
    type: z.enum(["text", "voice", "video"]),
    body: z.string().trim().max(LIMITS.messageBodyMax).optional(),
    mediaKey: z.string().min(1).optional(),
    durationMs: z.number().int().positive().optional(),
    waveform: z.array(z.number().min(0).max(100)).max(128).optional(),
  })
  .superRefine((msg, ctx) => {
    if (msg.type === "text") {
      if (!msg.body) ctx.addIssue({ code: "custom", path: ["body"], message: "A text message needs a body." });
      return;
    }
    if (!msg.mediaKey) {
      ctx.addIssue({ code: "custom", path: ["mediaKey"], message: "Upload the recording first." });
    }
    if (!msg.durationMs) {
      ctx.addIssue({ code: "custom", path: ["durationMs"], message: "A recording needs a duration." });
      return;
    }
    const max = msg.type === "voice" ? LIMITS.voiceNoteMaxMs : LIMITS.videoNoteMaxMs;
    if (msg.durationMs > max) {
      ctx.addIssue({ code: "custom", path: ["durationMs"], message: "That recording is too long." });
    }
    if (msg.durationMs < LIMITS.minRecordingMs) {
      ctx.addIssue({ code: "custom", path: ["durationMs"], message: "That recording is too short." });
    }
  });
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const requestUploadSchema = z.object({
  kind: z.enum(["voice", "video"]),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});
export type RequestUploadInput = z.infer<typeof requestUploadSchema>;

export const reactionEmojiSchema = z.string().min(1).max(16);

export const reactionSchema = z.object({ emoji: z.string(), userIds: z.array(z.uuid()) });
export type ReactionView = z.infer<typeof reactionSchema>;

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.uuid(),
  senderId: z.uuid(),
  type: messageTypeSchema,
  body: z.string().nullable(),
  clientId: z.uuid(),
  createdAt: z.string(),
  reactions: z.array(reactionSchema),
});
export type MessageView = z.infer<typeof messageSchema>;

export const listMessagesQuerySchema = z.object({
  before: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;

export const messagePageSchema = z.object({
  items: z.array(messageSchema),
  nextCursor: z.string().nullable(),
});
export type MessagePage = z.infer<typeof messagePageSchema>;
