import type { HubColor } from "@ricochet/shared";

/** The id used for the signed-in person in mock data. The API will return the real one. */
export const ME_ID = "me";

export type Role = "owner" | "admin" | "member";

export type Member = {
  id: string;
  name: string;
  handle: string;
  color: HubColor;
  online: boolean;
};

export type Hub = {
  id: string;
  name: string;
  color: HubColor;
  description: string;
  inviteCode: string;
  /** Member ids with their role in this hub. */
  members: { id: string; role: Role }[];
};

export type Pod = {
  id: string;
  hubId: string;
  name: string;
  /** Pods are grouped by category on the hub screen. */
  category: string;
  description: string;
  muted: boolean;
  isPrivate: boolean;
};

/** A private one-to-one conversation. Its id is used wherever a pod id would be, for messages and unread counts. */
export type Chat = {
  id: string;
  personId: string;
  pinned: boolean;
  muted: boolean;
};

export type Reaction = { emoji: string; userIds: string[] };

type MessageBase = {
  id: string;
  podId: string;
  sentAt: number;
  reactions: Reaction[];
};

export type TextMessage = MessageBase & { kind: "text"; authorId: string; text: string };
export type VoiceMessage = MessageBase & { kind: "voice"; authorId: string; durationMs: number; waveform: number[] };
export type VideoMessage = MessageBase & { kind: "video"; authorId: string; durationMs: number };
export type SystemMessage = MessageBase & { kind: "system"; text: string };

export type Message = TextMessage | VoiceMessage | VideoMessage | SystemMessage;

/** One row of the chat list: a day label or a message with its grouping flags. */
export type ChatItem =
  | { type: "day"; id: string; label: string }
  | { type: "message"; id: string; message: Message; mine: boolean; startsGroup: boolean; endsGroup: boolean };
