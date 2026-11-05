import { HUB_COLORS, type CreateHubInput, type HubColor } from "@ricochet/shared";
import { create } from "zustand";
import { DISCOVERABLE_HUBS, HUBS, INITIAL_UNREAD, MEMBERS, MESSAGES, PODS } from "./mock-data";
import { ME_ID, type Hub, type Member, type Message, type Pod } from "./types";

/**
 * Everything the hubs screens read, held in memory with mock data.
 * When the API is ready, this store keeps its shape and its actions become API calls.
 */

type SendPayload =
  | { kind: "text"; text: string }
  | { kind: "voice"; durationMs: number; waveform: number[] }
  | { kind: "video"; durationMs: number };

type HubsState = {
  hubs: Hub[];
  pods: Pod[];
  members: Record<string, Member>;
  messages: Record<string, Message[]>;
  unread: Record<string, number>;
  /** Who is typing in each pod right now. */
  typing: Record<string, string | null>;

  markPodRead: (podId: string) => void;
  togglePodMute: (podId: string) => void;
  sendMessage: (podId: string, payload: SendPayload) => void;
  toggleReaction: (podId: string, messageId: string, emoji: string) => void;
  createHub: (input: CreateHubInput) => string;
  /** Returns the joined hub, or null when the code matches nothing. */
  joinHub: (code: string) => Hub | null;
};

let nextId = 1000;
const newId = (prefix: string) => `${prefix}${++nextId}`;

const REPLIES = ["Got it, thanks.", "Nice, looking good.", "On it.", "Ha, same.", "Can you say more about that?", "Love it."];

export const useHubsStore = create<HubsState>((set, get) => ({
  hubs: HUBS,
  pods: PODS,
  members: MEMBERS,
  messages: MESSAGES,
  unread: INITIAL_UNREAD,
  typing: {},

  markPodRead(podId) {
    if (!get().unread[podId]) return;
    set((state) => ({ unread: { ...state.unread, [podId]: 0 } }));
  },

  togglePodMute(podId) {
    set((state) => ({ pods: state.pods.map((pod) => (pod.id === podId ? { ...pod, muted: !pod.muted } : pod)) }));
  },

  sendMessage(podId, payload) {
    const base = { id: newId("m"), podId, authorId: ME_ID, sentAt: Date.now(), reactions: [] };
    const message: Message = { ...base, ...payload } as Message;
    set((state) => ({ messages: { ...state.messages, [podId]: [...(state.messages[podId] ?? []), message] } }));

    // Pretend someone is on the other end, so the screen feels alive.
    const hub = get().hubs.find((h) => h.id === get().pods.find((p) => p.id === podId)?.hubId);
    const others = hub?.members.filter((m) => m.id !== ME_ID) ?? [];
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

// ---------------------------------------------------------------- selectors
export function useHub(hubId: string | undefined): Hub | undefined {
  return useHubsStore((s) => s.hubs.find((hub) => hub.id === hubId));
}

export function usePod(podId: string | undefined): Pod | undefined {
  return useHubsStore((s) => s.pods.find((pod) => pod.id === podId));
}

export const HUB_COLOR_OPTIONS: readonly HubColor[] = HUB_COLORS;
