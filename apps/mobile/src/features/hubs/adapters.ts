import type { ChatView, HubMember, HubView, Person, PodView } from "@ricochet/shared";
import { ME_ID, type Chat, type Hub, type Member, type Pod } from "./types";

/**
 * Screens compare ids with ME_ID to decide what is "mine", so the signed-in person is called "me" inside the
 * app. Everyone else keeps their real id. This is the only place the real id is swapped out.
 */
export const asLocalId = (id: string, myId: string | undefined) => (id === myId ? ME_ID : id);

export function toMember(person: Pick<Person, "id" | "displayName" | "handle" | "avatarColor">, myId: string | undefined, online = false): Member {
  return {
    id: asLocalId(person.id, myId),
    name: person.displayName,
    handle: person.handle,
    color: person.avatarColor,
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
