import {
  chatSchema,
  HUB_COLORS,
  hubMemberSchema,
  hubSchema,
  podSchema,
  unreadSummarySchema,
  type CreateHubInput,
  type CreatePodInput,
  type HubColor,
  type HubView,
  type UpdateHubInput,
} from "@ricochet/shared";
import { z } from "zod";
import { create } from "zustand";
import { api, errorMessage } from "@/lib/api";
import { showError } from "@/lib/notify";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/features/profile/store";
import { asLocalId, toChat, toHub, toMember, toPod } from "./adapters";
import { ME_ID, type Chat, type Hub, type Member, type Message, type Pod, type Role } from "./types";

type SendPayload =
  | { kind: "text"; text: string }
  | { kind: "voice"; durationMs: number; waveform: number[] }
  | { kind: "video"; durationMs: number };

type Status = "idle" | "loading" | "ready" | "error";

type HubsState = {
  status: Status;
  loadError: string | null;
  hubs: Hub[];
  pods: Pod[];
  chats: Chat[];
  members: Record<string, Member>;
  messages: Record<string, Message[]>;
  unread: Record<string, number>;
  typing: Record<string, string | null>;

  load: () => Promise<void>;
  reset: () => void;
  markPodRead: (podId: string) => void;
  togglePodMute: (podId: string) => Promise<void>;
  updatePod: (podId: string, patch: Partial<Pick<Pod, "name" | "description" | "isPrivate" | "mentionsOnly" | "muted">>) => Promise<void>;
  deletePod: (podId: string) => Promise<void>;
  createPod: (hubId: string, input: CreatePodInput) => Promise<string>;
  updateHub: (hubId: string, input: UpdateHubInput) => Promise<void>;
  regenerateInviteCode: (hubId: string) => Promise<string>;
  deleteHub: (hubId: string) => Promise<void>;
  setMemberRole: (hubId: string, memberId: string, role: Role) => Promise<void>;
  removeMember: (hubId: string, memberId: string) => Promise<void>;
  leaveHub: (hubId: string) => Promise<void>;
  toggleChatMute: (chatId: string) => Promise<void>;
  togglePin: (chatId: string) => Promise<void>;
  sendMessage: (podId: string, payload: SendPayload) => void;
  toggleReaction: (podId: string, messageId: string, emoji: string) => void;
  createHub: (input: CreateHubInput) => Promise<string>;
  joinHub: (code: string) => Promise<Hub>;
  forgetHub: (hubId: string) => void;
};

const myId = () => useAuthStore.getState().user?.id;
const auth = { auth: true } as const;

/** A hub's pods and member list live behind separate routes, so a hub is only complete once both are in. */
async function fetchHubDetails(view: HubView) {
  const [pods, members] = await Promise.all([
    api(`/hubs/${view.id}/pods`, { ...auth, schema: z.array(podSchema) }),
    api(`/hubs/${view.id}/members`, { ...auth, schema: z.array(hubMemberSchema) }),
  ]);
  const me = myId();
  return {
    hub: toHub(view, members, me),
    pods: pods.map(toPod),
    people: members.map((member) => toMember({ id: member.userId, ...member }, me)),
  };
}

function selfMember(): Member {
  const user = useAuthStore.getState().user;
  return {
    id: ME_ID,
    name: user?.displayName ?? "You",
    handle: user?.handle ?? "",
    color: useProfileStore.getState().avatarColor,
    online: true,
  };
}

const EMPTY = {
  status: "idle" as Status,
  loadError: null,
  hubs: [] as Hub[],
  pods: [] as Pod[],
  chats: [] as Chat[],
  members: {} as Record<string, Member>,
  messages: {} as Record<string, Message[]>,
  unread: {} as Record<string, number>,
  typing: {} as Record<string, string | null>,
};

let nextLocalId = 1000;

export const useHubsStore = create<HubsState>((set, get) => {
  /** Applies a change now and undoes it if the server says no. */
  async function optimistic(apply: () => void, undo: () => void, request: () => Promise<unknown>) {
    apply();
    try {
      await request();
    } catch (error) {
      undo();
      showError(error);
    }
  }

  function addHub(hub: Hub, pods: Pod[], people: Member[]) {
    set((state) => ({
      hubs: [hub, ...state.hubs.filter((h) => h.id !== hub.id)],
      pods: [...state.pods.filter((p) => p.hubId !== hub.id), ...pods],
      members: { ...state.members, ...Object.fromEntries(people.map((p) => [p.id, p])) },
    }));
  }

  const patchPod = (podId: string, patch: Partial<Pod>) =>
    set((state) => ({ pods: state.pods.map((pod) => (pod.id === podId ? { ...pod, ...patch } : pod)) }));
  const patchChat = (chatId: string, patch: Partial<Chat>) =>
    set((state) => ({ chats: state.chats.map((chat) => (chat.id === chatId ? { ...chat, ...patch } : chat)) }));

  return {
    ...EMPTY,

    async load() {
      if (get().status === "loading") return;
      set({ status: get().status === "ready" ? "ready" : "loading", loadError: null });
      try {
        const [hubViews, chatViews, summary] = await Promise.all([
          api("/hubs", { ...auth, schema: z.array(hubSchema) }),
          api("/chats", { ...auth, schema: z.array(chatSchema) }),
          api("/unread", { ...auth, schema: unreadSummarySchema }),
        ]);
        const details = await Promise.all(hubViews.map(fetchHubDetails));
        const me = myId();

        const members: Record<string, Member> = { [ME_ID]: selfMember() };
        for (const detail of details) for (const person of detail.people) members[person.id] = person;
        for (const chat of chatViews) members[asLocalId(chat.person.id, me)] = toMember(chat.person, me);

        set({
          status: "ready",
          hubs: details.map((d) => d.hub),
          pods: details.flatMap((d) => d.pods),
          chats: chatViews.map((chat) => toChat(chat, me)),
          members,
          unread: Object.fromEntries(summary.conversations.map((c) => [c.conversationId, c.unread])),
        });
      } catch (error) {
        set({ status: "error", loadError: errorMessage(error) });
      }
    },

    reset: () => set({ ...EMPTY }),

    markPodRead(podId) {
      if (!get().unread[podId]) return;
      set((state) => ({ unread: { ...state.unread, [podId]: 0 } }));
    },

    async togglePodMute(podId) {
      const pod = get().pods.find((p) => p.id === podId);
      if (!pod) return;
      await get().updatePod(podId, { muted: !pod.muted });
    },

    async updatePod(podId, patch) {
      const pod = get().pods.find((p) => p.id === podId);
      if (!pod) return;
      const { name, description, isPrivate, ...settings } = patch;
      const details = { name, description, isPrivate };
      const hasDetails = Object.values(details).some((value) => value !== undefined);
      const hasSettings = Object.values(settings).some((value) => value !== undefined);

      const previous = { ...pod };
      patchPod(podId, patch);
      try {
        if (hasDetails) {
          const body = Object.fromEntries(Object.entries(details).filter(([, value]) => value !== undefined));
          const view = await api(`/pods/${podId}`, { ...auth, method: "PATCH", body, schema: podSchema });
          patchPod(podId, toPod(view));
        }
        if (hasSettings) {
          const view = await api(`/pods/${podId}/me`, { ...auth, method: "PATCH", body: settings, schema: podSchema });
          patchPod(podId, toPod(view));
        }
      } catch (error) {
        patchPod(podId, previous);
        throw error;
      }
    },

    async deletePod(podId) {
      await api(`/pods/${podId}`, { ...auth, method: "DELETE" });
      set((state) => {
        const { [podId]: _messages, ...messages } = state.messages;
        const { [podId]: _unread, ...unread } = state.unread;
        return { pods: state.pods.filter((pod) => pod.id !== podId), messages, unread };
      });
    },

    async createPod(hubId, input) {
      const view = await api(`/hubs/${hubId}/pods`, { ...auth, method: "POST", body: input, schema: podSchema });
      set((state) => ({ pods: [...state.pods, toPod(view)] }));
      return view.id;
    },

    async updateHub(hubId, input) {
      const view = await api(`/hubs/${hubId}`, { ...auth, method: "PATCH", body: input, schema: hubSchema });
      set((state) => ({
        hubs: state.hubs.map((hub) =>
          hub.id === hubId ? { ...hub, name: view.name, description: view.description, color: view.color, icon: view.icon } : hub,
        ),
      }));
    },

    async regenerateInviteCode(hubId) {
      const view = await api(`/hubs/${hubId}/invite-code`, { ...auth, method: "POST", schema: hubSchema });
      set((state) => ({ hubs: state.hubs.map((hub) => (hub.id === hubId ? { ...hub, inviteCode: view.inviteCode } : hub)) }));
      return view.inviteCode;
    },

    async deleteHub(hubId) {
      await api(`/hubs/${hubId}`, { ...auth, method: "DELETE" });
      get().forgetHub(hubId);
    },

    async setMemberRole(hubId, memberId, role) {
      await api(`/hubs/${hubId}/members/${memberId}`, { ...auth, method: "PATCH", body: { role } });
      set((state) => ({
        hubs: state.hubs.map((hub) =>
          hub.id === hubId ? { ...hub, members: hub.members.map((m) => (m.id === memberId ? { ...m, role } : m)) } : hub,
        ),
      }));
    },

    async removeMember(hubId, memberId) {
      await api(`/hubs/${hubId}/members/${memberId}`, { ...auth, method: "DELETE" });
      set((state) => ({
        hubs: state.hubs.map((hub) => (hub.id === hubId ? { ...hub, members: hub.members.filter((m) => m.id !== memberId) } : hub)),
      }));
    },

    async leaveHub(hubId) {
      await api(`/hubs/${hubId}/leave`, { ...auth, method: "POST" });
      get().forgetHub(hubId);
    },

    forgetHub(hubId) {
      set((state) => {
        const podIds = new Set(state.pods.filter((pod) => pod.hubId === hubId).map((pod) => pod.id));
        const messages = { ...state.messages };
        const unread = { ...state.unread };
        for (const id of podIds) {
          delete messages[id];
          delete unread[id];
        }
        return { hubs: state.hubs.filter((hub) => hub.id !== hubId), pods: state.pods.filter((pod) => pod.hubId !== hubId), messages, unread };
      });
    },

    toggleChatMute(chatId) {
      const chat = get().chats.find((c) => c.id === chatId);
      if (!chat) return Promise.resolve();
      return optimistic(
        () => patchChat(chatId, { muted: !chat.muted }),
        () => patchChat(chatId, { muted: chat.muted }),
        () => api(`/chats/${chatId}/me`, { ...auth, method: "PATCH", body: { muted: !chat.muted } }),
      );
    },

    togglePin(chatId) {
      const chat = get().chats.find((c) => c.id === chatId);
      if (!chat) return Promise.resolve();
      return optimistic(
        () => patchChat(chatId, { pinned: !chat.pinned }),
        () => patchChat(chatId, { pinned: chat.pinned }),
        () => api(`/chats/${chatId}/me`, { ...auth, method: "PATCH", body: { pinned: !chat.pinned } }),
      );
    },

    // Messages are still local until the message routes are wired in.
    sendMessage(podId, payload) {
      const message = { id: `m${++nextLocalId}`, podId, authorId: ME_ID, sentAt: Date.now(), reactions: [], ...payload } as Message;
      set((state) => ({ messages: { ...state.messages, [podId]: [...(state.messages[podId] ?? []), message] } }));
    },

    toggleReaction() {},

    async createHub(input) {
      const view = await api("/hubs", { ...auth, method: "POST", body: input, schema: hubSchema });
      const { hub, pods, people } = await fetchHubDetails(view);
      addHub(hub, pods, people);
      return hub.id;
    },

    async joinHub(code) {
      const view = await api("/hubs/join", { ...auth, method: "POST", body: { code }, schema: hubSchema });
      const { hub, pods, people } = await fetchHubDetails(view);
      addHub(hub, pods, people);
      return hub;
    },
  };
});

export function useHub(hubId: string | undefined): Hub | undefined {
  return useHubsStore((s) => s.hubs.find((hub) => hub.id === hubId));
}

export function usePod(podId: string | undefined): Pod | undefined {
  return useHubsStore((s) => s.pods.find((pod) => pod.id === podId));
}

export const HUB_COLOR_OPTIONS: readonly HubColor[] = HUB_COLORS;
