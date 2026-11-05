import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

// ---------------------------------------------------------------- enums
export const conversationType = pgEnum("conversation_type", ["pod", "direct", "group"]);
export const messageType = pgEnum("message_type", ["text", "voice", "video", "system"]);
export const mediaStatus = pgEnum("media_status", ["uploading", "processing", "ready", "failed"]);
export const hubRole = pgEnum("hub_role", ["owner", "admin", "member"]);
export const activityKind = pgEnum("activity_kind", ["mention", "reply", "invite", "announcement"]);
export const devicePlatform = pgEnum("device_platform", ["ios", "android"]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ---------------------------------------------------------------- people and sign in
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  handle: text("handle").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarKey: text("avatar_key"),
  createdAt: createdAt(),
});

/** One row per sign-in request. The code is stored hashed, never in plain text. */
export const loginCodes = pgTable(
  "login_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("login_codes_by_email").on(t.email, t.createdAt)],
);

/** A signed-in phone. The refresh token is stored hashed and rotated on use. */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refreshTokenHash: text("refresh_token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const devices = pgTable("devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pushToken: text("push_token").notNull().unique(),
  platform: devicePlatform("platform").notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------- hubs
export const hubs = pgTable("hubs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: createdAt(),
});

export const hubMembers = pgTable(
  "hub_members",
  {
    hubId: uuid("hub_id").notNull().references(() => hubs.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: hubRole("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.hubId, t.userId] })],
);

// ---------------------------------------------------------------- conversations
/** A pod and a chat are the same table. `hub_id` is set for pods and empty for chats. */
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: conversationType("type").notNull(),
  hubId: uuid("hub_id").references(() => hubs.id, { onDelete: "cascade" }),
  name: text("name"),
  createdAt: createdAt(),
});

/** Direct and group chat members, plus per-person settings (read pointer, mute) for any conversation. */
export const participants = pgTable(
  "participants",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    /** Newest message this person has read. Unread count is "messages after this". */
    lastReadId: uuid("last_read_id"),
    muted: boolean("muted").notNull().default(false),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.conversationId, t.userId] })],
);

// ---------------------------------------------------------------- messages
export const messages = pgTable(
  "messages",
  {
    // UUIDv7 is time-ordered, so "everything after this id" is a cheap range query.
    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").notNull().references(() => users.id),
    type: messageType("type").notNull(),
    body: text("body"),
    clientId: uuid("client_id").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("messages_by_conversation").on(t.conversationId, t.id),
    // A retried send with the same client id lands on the same row.
    uniqueIndex("messages_idempotency").on(t.senderId, t.clientId),
  ],
);

export const attachments = pgTable("attachments", {
  messageId: uuid("message_id")
    .primaryKey()
    .references(() => messages.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  durationMs: integer("duration_ms"),
  waveform: jsonb("waveform").$type<number[]>(),
  posterKey: text("poster_key"),
  status: mediaStatus("status").notNull().default("uploading"),
});

export const reactions = pgTable(
  "reactions",
  {
    messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.userId, t.emoji] })],
);

// ---------------------------------------------------------------- activity feed
export const activity = pgTable(
  "activity",
  {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: activityKind("kind").notNull(),
    messageId: uuid("message_id").references(() => messages.id, { onDelete: "cascade" }),
    hubId: uuid("hub_id").references(() => hubs.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("activity_by_user").on(t.userId, t.id)],
);

// ---------------------------------------------------------------- relations
// These power `db.query.*` lookups. The foreign keys above are what the database enforces.
export const hubsRelations = relations(hubs, ({ many }) => ({
  members: many(hubMembers),
  pods: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  hub: one(hubs, { fields: [conversations.hubId], references: [hubs.id] }),
  participants: many(participants),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  attachment: one(attachments, { fields: [messages.id], references: [attachments.messageId] }),
  reactions: many(reactions),
}));

export type User = typeof users.$inferSelect;
export type Hub = typeof hubs.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
