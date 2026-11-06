import type { ChatLastMessage, ChatView, HubMember, HubView, MessageView, Person, PodView } from "@ricochet/shared";
import { mediaUrl } from "@/lib/media";
import { ME_ID, type Chat, type Hub, type Member, type Message, type Pod } from "./types";

/**
 * Screens compare ids with ME_ID to decide what is "mine", so the signed-in person is called "me" inside the
 * app. Everyone else keeps their real id. This is the only place the real id is swapped out.
 */
export const asLocalId = (id: string, myId: string | undefined) => (id === myId ? ME_ID : id);

export function toMember(person: Pick<Person, "id" | "displayName" | "handle" | "avatarColor" | "avatarUrl">, myId: string | undefined, online = false): Member {
  return {
    id: asLocalId(person.id, myId),
    name: person.displayName,
    handle: person.handle,
    color: person.avatarColor,
    avatarUrl: mediaUrl(person.avatarUrl),
    online,
  };
}

export function toHub(view: HubView, members: HubMember[], myId: string | undefined): Hub {
  return {
    id: view.id,
    name: view.name,
    color: view.color,
    icon: view.icon,
    description: view.description,
    inviteCode: view.inviteCode,
    members: members.map((member) => ({ id: asLocalId(member.userId, myId), role: member.role })),
  };
}

export function toPod(view: PodView): Pod {
  return {
    id: view.id,
    hubId: view.hubId,
    name: view.name,
    category: view.category,
    description: view.description,
    muted: view.muted,
    mentionsOnly: view.mentionsOnly,
    isPrivate: view.isPrivate,
  };
}

export function toChat(view: ChatView, myId: string | undefined): Chat {
  return { id: view.id, personId: asLocalId(view.person.id, myId), pinned: view.pinned, muted: view.muted };
}

type MessageLike = Pick<MessageView, "id" | "type" | "body" | "senderId" | "createdAt"> & Partial<Pick<MessageView, "clientId" | "reactions" | "media">>;

export function toMessage(view: MessageLike, conversationId: string, myId: string | undefined): Message {
  const base = {
    id: view.id,
    podId: conversationId,
    sentAt: Date.parse(view.createdAt),
    clientId: view.clientId,
    reactions: (view.reactions ?? []).map((r) => ({ emoji: r.emoji, userIds: r.userIds.map((id) => asLocalId(id, myId)) })),
  };
  if (view.type === "text") return { ...base, kind: "text", authorId: asLocalId(view.senderId, myId), text: view.body ?? "" };
  if (view.type === "system") return { ...base, kind: "system", text: view.body ?? "" };
  if (view.type === "voice" || view.type === "video") {
    const media = view.media;
    const recording = {
      ...base,
      authorId: asLocalId(view.senderId, myId),
      durationMs: media?.durationMs ?? 0,
      mediaUrl: mediaUrl(media?.url),
      mediaStatus: media && media.status !== "uploading" ? media.status : undefined,
    };
    return view.type === "voice"
      ? { ...recording, kind: "voice", waveform: media?.waveform ?? [] }
      : { ...recording, kind: "video", posterUrl: mediaUrl(media?.posterUrl) };
  }
  return { ...base, kind: "system", text: view.body ?? "" };
}

export const toLastMessage = (last: ChatLastMessage, conversationId: string, myId: string | undefined) =>
  toMessage(last, conversationId, myId);

/** A saved message replaces the draft the phone made for it, matched by the id the phone invented. Order follows the time written. */
export function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const result = [...existing];
  for (const message of incoming) {
    const same = (other: Message) =>
      other.id === message.id ||
      (!!message.clientId && (other.clientId === message.clientId || other.id === message.clientId));
    const at = result.findIndex(same);
    if (at === -1) result.push(message);
    else result[at] = { ...message, status: undefined };
  }
  return result.sort((a, b) => a.sentAt - b.sentAt || a.id.localeCompare(b.id));
}
