import { z } from "zod";
import { hubColorSchema } from "./hub";
import { messageTypeSchema } from "./message";

export const personSchema = z.object({
  id: z.uuid(),
  displayName: z.string(),
  handle: z.string(),
  avatarColor: hubColorSchema,
  avatarUrl: z.string().nullable(),
});
export type Person = z.infer<typeof personSchema>;

/** `hub` means they share a hub with you. `handle` means you typed their exact handle. */
export const personResultSchema = personSchema.extend({ via: z.enum(["hub", "handle"]) });
export type PersonResult = z.infer<typeof personResultSchema>;

export const searchPeopleQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .transform((value) => value.replace(/^@/, ""))
    .pipe(z.string().min(2, "Type at least 2 characters.").max(40, "Keep the search under 40 characters.")),
});
export type SearchPeopleQuery = z.infer<typeof searchPeopleQuerySchema>;

export const createChatSchema = z.object({ userId: z.uuid() });
export type CreateChatInput = z.infer<typeof createChatSchema>;

export const chatSettingsSchema = z
  .object({ pinned: z.boolean().optional(), muted: z.boolean().optional() })
  .refine((body) => body.pinned !== undefined || body.muted !== undefined, "Send pinned, muted, or both.");
export type ChatSettingsInput = z.infer<typeof chatSettingsSchema>;

export const chatLastMessageSchema = z.object({
  id: z.string(),
  type: messageTypeSchema,
  body: z.string().nullable(),
  senderId: z.uuid(),
  createdAt: z.string(),
});
export type ChatLastMessage = z.infer<typeof chatLastMessageSchema>;

export const chatSchema = z.object({
  id: z.uuid(),
  person: personSchema,
  pinned: z.boolean(),
  muted: z.boolean(),
  unread: z.number().int().min(0),
  lastMessage: chatLastMessageSchema.nullable(),
  createdAt: z.string(),
});
export type ChatView = z.infer<typeof chatSchema>;

export const chatUpdatedSchema = z.object({ conversationId: z.uuid(), lastMessage: chatLastMessageSchema });
export type ChatUpdated = z.infer<typeof chatUpdatedSchema>;
