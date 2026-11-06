import { defaultHubIcon, HUB_COLORS, type CreateHubInput, type CreatePodInput, type HubColor, type UpdateHubInput } from "@ricochet/shared";
import { create } from "zustand";
import { DISCOVERABLE_HUBS, HUBS, INITIAL_UNREAD, MEMBERS, MESSAGES, PODS } from "./mock-data";
import { CHATS, CHAT_MESSAGES, CHAT_UNREAD } from "./mock-chats";
import { ME_ID, type Chat, type Hub, type Member, type Message, type Pod, type Role } from "./types";

// Mock data. The actions become API calls when the API is wired in.

type SendPayload =
  | { kind: "text"; text: string }
  | { kind: "voice"; durationMs: number; waveform: number[] }
  | { kind: "video"; durationMs: number };

type HubsState = {
  hubs: Hub[];
  pods: Pod[];
  chats: Chat[];
  members: Record<string, Member>;
  messages: Record<string, Message[]>;
  unread: Record<string, number>;
  typing: Record<string, string | null>;

  markPodRead: (podId: string) => void;
  togglePodMute: (podId: string) => void;
  updatePod: (podId: string, patch: Partial<Pick<Pod, "name" | "description" | "isPrivate" | "mentionsOnly" | "muted">>) => void;
  deletePod: (podId: string) => void;
  createPod: (hubId: string, input: CreatePodInput) => string;
  updateHub: (hubId: string, input: UpdateHubInput) => void;
  regenerateInviteCode: (hubId: string) => string;
  deleteHub: (hubId: string) => void;
  setMemberRole: (hubId: string, memberId: string, role: Role) => void;
  removeMember: (hubId: string, memberId: string) => void;
  leaveHub: (hubId: string) => void;
  toggleChatMute: (chatId: string) => void;
  togglePin: (chatId: string) => void;
  sendMessage: (podId: string, payload: SendPayload) => void;
  toggleReaction: (podId: string, messageId: string, emoji: string) => void;
  createHub: (input: CreateHubInput) => string;
  joinHub: (code: string) => Hub | null;
};

let nextId = 1000;
const newId = (prefix: string) => `${prefix}${++nextId}`;

const REPLIES = ["Got it, thanks.", "Nice, looking good.", "On it.", "Ha, same.", "Can you say more about that?", "Love it."];

export const useHubsStore = create<HubsState>((set, get) => ({
  hubs: HUBS,
  pods: PODS,
  chats: CHATS,
  members: MEMBERS,
  messages: { ...MESSAGES, ...CHAT_MESSAGES },
  unread: { ...INITIAL_UNREAD, ...CHAT_UNREAD },
  typing: {},

  markPodRead(podId) {
    if (!get().unread[podId]) return;
    set((state) => ({ unread: { ...state.unread, [podId]: 0 } }));
  },

  togglePodMute(podId) {
    set((state) => ({ pods: state.pods.map((pod) => (pod.id === podId ? { ...pod, muted: !pod.muted } : pod)) }));
  },

  updatePod(podId, patch) {
    set((state) => ({ pods: state.pods.map((pod) => (pod.id === podId ? { ...pod, ...patch } : pod)) }));
  },

  deletePod(podId) {
    set((state) => {
      const { [podId]: _messages, ...messages } = state.messages;
      const { [podId]: _unread, ...unread } = state.unread;
      return { pods: state.pods.filter((pod) => pod.id !== podId), messages, unread };
    });
  },

  createPod(hubId, input) {
    const podId = `${hubId}-${input.name}-${newId("p")}`;
    const pod: Pod = {
      id: podId,
      hubId,
      name: input.name,
      category: input.category,
      description: input.description,
      muted: false,
      isPrivate: input.isPrivate,
    };
    const welcome: Message = { id: newId("m"), podId, kind: "system", sentAt: Date.now(), text: `You created the pod #${input.name}`, reactions: [] };
    set((state) => ({
      pods: [...state.pods, pod],
      messages: { ...state.messages, [podId]: [welcome] },
    }));
    return podId;
  },

  updateHub(hubId, input) {
    set((state) => ({ hubs: state.hubs.map((hub) => (hub.id === hubId ? { ...hub, ...input } : hub)) }));
  },

  regenerateInviteCode(hubId) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 7 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    set((state) => ({ hubs: state.hubs.map((hub) => (hub.id === hubId ? { ...hub, inviteCode: code } : hub)) }));
    return code;
  },

  deleteHub(hubId) {
    set((state) => {
      const podIds = state.pods.filter((pod) => pod.hubId === hubId).map((pod) => pod.id);
      const messages = { ...state.messages };
      const unread = { ...state.unread };
      for (const id of podIds) {
        delete messages[id];
        delete unread[id];
      }
      return {
        hubs: state.hubs.filter((hub) => hub.id !== hubId),
        pods: state.pods.filter((pod) => pod.hubId !== hubId),
        messages,
        unread,
      };
    });
  },

  setMemberRole(hubId, memberId, role) {
    set((state) => ({
      hubs: state.hubs.map((hub) =>
        hub.id === hubId ? { ...hub, members: hub.members.map((m) => (m.id === memberId ? { ...m, role } : m)) } : hub,
      ),
    }));
  },

  removeMember(hubId, memberId) {
    set((state) => ({
      hubs: state.hubs.map((hub) => (hub.id === hubId ? { ...hub, members: hub.members.filter((m) => m.id !== memberId) } : hub)),
    }));
  },

  leaveHub(hubId) {
    set((state) => ({
      hubs: state.hubs.filter((hub) => hub.id !== hubId),
      pods: state.pods.filter((pod) => pod.hubId !== hubId),
    }));
  },

  toggleChatMute(chatId) {
    set((state) => ({ chats: state.chats.map((chat) => (chat.id === chatId ? { ...chat, muted: !chat.muted } : chat)) }));
  },

  togglePin(chatId) {
    set((state) => ({ chats: state.chats.map((chat) => (chat.id === chatId ? { ...chat, pinned: !chat.pinned } : chat)) }));
  },

  sendMessage(podId, payload) {
    const base = { id: newId("m"), podId, authorId: ME_ID, sentAt: Date.now(), reactions: [] };
    const message: Message = { ...base, ...payload } as Message;
    set((state) => ({ messages: { ...state.messages, [podId]: [...(state.messages[podId] ?? []), message] } }));

    const chat = get().chats.find((c) => c.id === podId);
    const hub = get().hubs.find((h) => h.id === get().pods.find((p) => p.id === podId)?.hubId);
    const others = chat ? [{ id: chat.personId }] : (hub?.members.filter((m) => m.id !== ME_ID) ?? []);
    const replier = others[Math.floor(Math.random() * others.length)];
    if (!replier) return;
    setTimeout(() => set((state) => ({ typing: { ...state.typing, [podId]: replier.id } })), 600);
    setTimeout(() => {
      const reply: Message = {
        id: newId("m"),
        podId,
        kind: "text",
        authorId: replier.id,
        sentAt: Date.now(),
        text: REPLIES[Math.floor(Math.random() * REPLIES.length)]!,
        reactions: [],
      };
      set((state) => ({
        typing: { ...state.typing, [podId]: null },
        messages: { ...state.messages, [podId]: [...(state.messages[podId] ?? []), reply] },
      }));
    }, 2200);
  },

  toggleReaction(podId, messageId, emoji) {
    set((state) => ({
      messages: {
        ...state.messages,
        [podId]: (state.messages[podId] ?? []).map((message) => {
          if (message.id !== messageId) return message;
          const existing = message.reactions.find((r) => r.emoji === emoji);
          let reactions = message.reactions;
          if (!existing) reactions = [...reactions, { emoji, userIds: [ME_ID] }];
          else if (existing.userIds.includes(ME_ID)) {
            const remaining = existing.userIds.filter((u) => u !== ME_ID);
            reactions = remaining.length
              ? reactions.map((r) => (r.emoji === emoji ? { ...r, userIds: remaining } : r))
              : reactions.filter((r) => r.emoji !== emoji);
          } else {
            reactions = reactions.map((r) => (r.emoji === emoji ? { ...r, userIds: [...r.userIds, ME_ID] } : r));
          }
          return { ...message, reactions };
        }),
      },
    }));
  },

  createHub(input) {
    const hubId = `hub-${newId("h")}`;
    const hub: Hub = {
      id: hubId,
      name: input.name,
      color: input.color,
      icon: input.icon ?? defaultHubIcon(input.name),
      description: "A new hub. Say hello in #general.",
      inviteCode: input.name.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 8).padEnd(4, "X"),
      members: [{ id: ME_ID, role: "owner" }],
    };
    const pods: Pod[] = input.starterPods.map((name) => ({
      id: `${hubId}-${name}`,
      hubId,
      name,
      category: name === "announcements" ? "Start here" : "Social",
      description: name === "announcements" ? "News from the hub team" : name === "general" ? "Everything else" : "Memes, music and the weather",
      muted: false,
      isPrivate: false,
    }));
    const welcome: Record<string, Message[]> = Object.fromEntries(
      pods.map((pod) => [
        pod.id,
        [{ id: newId("m"), podId: pod.id, kind: "system", sentAt: Date.now(), text: `You created ${input.name}`, reactions: [] } as Message],
      ]),
    );
    set((state) => ({
      hubs: [hub, ...state.hubs],
      pods: [...state.pods, ...pods],
      messages: { ...state.messages, ...welcome },
    }));
    return hubId;
  },

  joinHub(code) {
    const { hubs } = get();
    const found = DISCOVERABLE_HUBS.find((hub) => hub.inviteCode === code);
    if (!found) return null;
    if (hubs.some((hub) => hub.id === found.id)) return hubs.find((hub) => hub.id === found.id) ?? null;
    const joined: Hub = { ...found, members: [...found.members, { id: ME_ID, role: "member" }] };
    set((state) => ({
      hubs: [joined, ...state.hubs],
      pods: [...state.pods, ...PODS.filter((pod) => pod.hubId === found.id && !state.pods.some((p) => p.id === pod.id))],
    }));
    return joined;
  },
}));

export function useHub(hubId: string | undefined): Hub | undefined {
  return useHubsStore((s) => s.hubs.find((hub) => hub.id === hubId));
}

export function usePod(podId: string | undefined): Pod | undefined {
  return useHubsStore((s) => s.pods.find((pod) => pod.id === podId));
}

export const HUB_COLOR_OPTIONS: readonly HubColor[] = HUB_COLORS;
