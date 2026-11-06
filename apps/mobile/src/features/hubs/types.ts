import type { HubColor, HubIcon } from "@ricochet/shared";

/** The id used for the signed-in person in mock data. The API will return the real one. */
export const ME_ID = "me";

export type Role = "owner" | "admin" | "member";

export type Member = {
  id: string;
  name: string;
  handle: string;
  color: HubColor;
  avatarUrl: string | null;
  online: boolean;
};

export type Hub = {
  id: string;
  name: string;
  color: HubColor;
  icon: HubIcon;
  description: string;
  inviteCode: string;
  members: { id: string; role: Role }[];
};

export type Pod = {
  id: string;
  hubId: string;
  name: string;
  category: string;
  description: string;
  muted: boolean;
  mentionsOnly?: boolean;
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
  /** Set on messages this phone sent. The server echoes it back, which is how a draft is matched to its saved copy. */
  clientId?: string;
  /** Only while the message has not been saved yet. */
  status?: "sending" | "failed";
};

export type TextMessage = MessageBase & { kind: "text"; authorId: string; text: string };
export type VoiceMessage = MessageBase & { kind: "voice"; authorId: string; durationMs: number; waveform: number[] };
export type VideoMessage = MessageBase & { kind: "video"; authorId: string; durationMs: number };
export type SystemMessage = MessageBase & { kind: "system"; text: string };

export type Message = TextMessage | VoiceMessage | VideoMessage | SystemMessage;

export type ChatItem =
  | { type: "day"; id: string; label: string }
  | { type: "message"; id: string; message: Message; mine: boolean; startsGroup: boolean; endsGroup: boolean };
