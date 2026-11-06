import { z } from "zod";

export const EVENTS = {
  // app -> server
  messageSend: "message:send",
  conversationOpen: "conversation:open",
  conversationClose: "conversation:close",
  conversationRead: "conversation:read",
  typingStart: "typing:start",
  typingStop: "typing:stop",
  // server -> app
  messageNew: "message:new",
  messageUpdated: "message:updated",
  messageDeleted: "message:deleted",
  unreadUpdate: "unread:update",
  presenceUpdate: "presence:update",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export const conversationRefSchema = z.object({ conversationId: z.uuid() });
export type ConversationRef = z.infer<typeof conversationRefSchema>;

export const typingNoticeSchema = z.object({ conversationId: z.uuid(), userId: z.uuid() });
export type TypingNotice = z.infer<typeof typingNoticeSchema>;

export const conversationReadSchema = z.object({
  conversationId: z.uuid(),
  lastReadId: z.uuid(),
});
export type ConversationRead = z.infer<typeof conversationReadSchema>;

export const unreadUpdateSchema = z.object({ conversationId: z.uuid(), unread: z.number().int().min(0) });
export type UnreadUpdate = z.infer<typeof unreadUpdateSchema>;

export const rooms = {
  user: (userId: string) => `user:${userId}`,
  conversation: (conversationId: string) => `conversation:${conversationId}`,
} as const;
