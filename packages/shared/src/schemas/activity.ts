import { z } from "zod";
import { hubColorSchema } from "./hub";
import { unreadUpdateSchema } from "../events";

export const activityKindSchema = z.enum(["mention", "reply", "reaction", "invite", "announcement"]);
export type ActivityKind = z.infer<typeof activityKindSchema>;

export const activityItemSchema = z.object({
  id: z.uuid(),
  kind: activityKindSchema,
  actor: z.object({ id: z.uuid(), displayName: z.string(), avatarColor: hubColorSchema }).nullable(),
  hubId: z.uuid().nullable(),
  hubName: z.string().nullable(),
  conversationId: z.uuid().nullable(),
  podName: z.string().nullable(),
  messageId: z.uuid().nullable(),
  preview: z.string().nullable(),
  emoji: z.string().nullable(),
  read: z.boolean(),
  createdAt: z.string(),
});
export type ActivityItem = z.infer<typeof activityItemSchema>;

export const listActivityQuerySchema = z.object({
  before: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
export type ListActivityQuery = z.infer<typeof listActivityQuerySchema>;

export const activityPageSchema = z.object({ items: z.array(activityItemSchema), nextCursor: z.string().nullable() });
export type ActivityPage = z.infer<typeof activityPageSchema>;

export const markActivityReadSchema = z
  .object({ ids: z.array(z.uuid()).min(1).max(100).optional(), all: z.literal(true).optional() })
  .refine((body) => body.ids !== undefined || body.all === true, "Say which notifications to mark, or send all: true.");
export type MarkActivityReadInput = z.infer<typeof markActivityReadSchema>;

export const activityNewSchema = z.object({ item: activityItemSchema, unread: z.number().int().min(0) });
export type ActivityNew = z.infer<typeof activityNewSchema>;

export const activityUnreadSchema = z.object({ unread: z.number().int().min(0) });
export type ActivityUnread = z.infer<typeof activityUnreadSchema>;

export const unreadSummarySchema = z.object({
  conversations: z.array(unreadUpdateSchema),
  activity: z.number().int().min(0),
});
export type UnreadSummary = z.infer<typeof unreadSummarySchema>;
