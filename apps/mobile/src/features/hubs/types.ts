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

/** The message a reply answers, with just enough to draw the quote. */
export type ReplyRef = {
  id: string;
  authorId: string;
  authorName: string;
  kind: "text" | "voice" | "video";
  /** Only for text. Recordings are labelled by their kind. */
  text: string | null;
};

type MessageBase = {
  id: string;
  podId: string;
  sentAt: number;
  reactions: Reaction[];
  reply?: ReplyRef;
  /** Set on messages this phone sent. The server echoes it back, which is how a draft is matched to its saved copy. */
  clientId?: string;
  /** Only while the message has not been saved yet. */
  status?: "sending" | "failed";
};

/** A recording. `mediaUrl` expires, so it is refreshed when someone presses play. `localUri` is the file on this phone before it has been uploaded. */
type MediaFields = {
  mediaUrl?: string | null;
  localUri?: string;
  mediaStatus?: "processing" | "ready" | "failed";
};

export type TextMessage = MessageBase & { kind: "text"; authorId: string; text: string };
export type VoiceMessage = MessageBase & MediaFields & { kind: "voice"; authorId: string; durationMs: number; waveform: number[] };
export type VideoMessage = MessageBase & MediaFields & { kind: "video"; authorId: string; durationMs: number; posterUrl?: string | null };
export type SystemMessage = MessageBase & { kind: "system"; text: string };

export type Message = TextMessage | VoiceMessage | VideoMessage | SystemMessage;

export type ChatItem =
  | { type: "day"; id: string; label: string }
  | { type: "message"; id: string; message: Message; mine: boolean; startsGroup: boolean; endsGroup: boolean };
