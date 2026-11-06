import {
  chatSchema,
  HUB_COLORS,
  hubMemberSchema,
  hubSchema,
  messagePageSchema,
  mediaViewSchema,
  messageSchema,
  podSchema,
  unreadSummarySchema,
  type ChatUpdated,
  type CreateHubInput,
  type CreatePodInput,
  type HubColor,
  type HubView,
  type MessageView,
  type PresenceUpdate,
  type TypingNotice,
  type UnreadUpdate,
  type UpdateHubInput,
} from "@ricochet/shared";
import { z } from "zod";
import { create } from "zustand";
import { api, errorMessage } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { realtime } from "@/lib/realtime";
import { uuid } from "@/lib/uuid";
import { showError } from "@/lib/notify";
import { useAuthStore } from "@/stores/auth-store";
import { sendRecording } from "./media";
import { asLocalId, mergeMessages, toChat, toHub, toLastMessage, toMember, toMessage, toPod } from "./adapters";
import { ME_ID, type Chat, type Hub, type Member, type Message, type Pod, type Role } from "./types";

type SendPayload =
  | { kind: "text"; text: string }
  | { kind: "voice"; uri: string; durationMs: number; waveform: number[] }
  | { kind: "video"; uri: string; durationMs: number };

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
  /** Where each conversation's history stands. `cursor` is the id to ask for older messages from, and null means there are none. */
  paging: Record<string, { loaded: boolean; cursor: string | null; loadingOlder: boolean }>;

  load: () => Promise<void>;
  openConversation: (id: string) => Promise<void>;
  closeConversation: (id: string) => void;
  loadOlder: (id: string) => Promise<void>;
  retryMessage: (id: string, clientId: string) => Promise<void>;
  /** Fresh playback links for a recording. Resolves to null when there is nothing to play. */
  refreshMedia: (id: string, messageId: string) => Promise<string | null>;
  receiveMessage: (message: MessageView) => void;
  receiveUnread: (update: UnreadUpdate) => void;
  receiveTyping: (notice: TypingNotice, on: boolean) => void;
  receivePresence: (update: PresenceUpdate) => void;
  receiveChatUpdate: (update: ChatUpdated) => void;
  catchUp: (openConversations: string[]) => Promise<void>;
  refreshHub: (hubId: string) => Promise<void>;
  reset: () => void;
  /** Call after the profile changes, so this person's own name and photo update wherever they appear. */
  refreshSelf: () => void;
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
  const [pods, members, presence] = await Promise.all([
    api(`/hubs/${view.id}/pods`, { ...auth, schema: z.array(podSchema) }),
    api(`/hubs/${view.id}/members`, { ...auth, schema: z.array(hubMemberSchema) }),
    api(`/hubs/${view.id}/presence`, { ...auth, schema: z.object({ online: z.array(z.string()) }) }).catch(() => ({ online: [] as string[] })),
  ]);
  const me = myId();
  const online = new Set(presence.online);
  return {
    hub: toHub(view, members, me),
    pods: pods.map(toPod),
    people: members.map((member) => toMember({ id: member.userId, ...member }, me, online.has(member.userId))),
  };
}

function selfMember(): Member {
  const user = useAuthStore.getState().user;
  return {
    id: ME_ID,
    name: user?.displayName ?? "You",
    handle: user?.handle ?? "",
    color: user?.avatarColor ?? "coral",
    avatarUrl: mediaUrl(user?.avatarUrl),
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
  paging: {} as Record<string, { loaded: boolean; cursor: string | null; loadingOlder: boolean }>,
};

const PAGE_SIZE = 30;
/** The newest message already reported as read for each conversation, so opening a screen twice sends one request. */
const reportedRead = new Map<string, string>();
const refreshingHubs = new Set<string>();

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

  const setPaging = (id: string, patch: Partial<HubsState["paging"][string]>) =>
    set((state) => ({
      paging: { ...state.paging, [id]: { ...(state.paging[id] ?? { loaded: false, cursor: null, loadingOlder: false }), ...patch } },
    }));

  const setStatus = (id: string, clientId: string, status: "sending" | "failed" | undefined) =>
    set((state) => ({
      messages: { ...state.messages, [id]: (state.messages[id] ?? []).map((m) => (m.clientId === clientId ? { ...m, status } : m)) },
    }));

  /** The newest page, merged over what is already there. Used on first open and again to catch up after a gap. */
  async function fetchLatest(id: string) {
    try {
      const page = await api(`/conversations/${id}/messages?limit=${PAGE_SIZE}`, { ...auth, schema: messagePageSchema });
      const me = myId();
      const incoming = page.items.map((m) => toMessage(m, id, me));
      const first = !get().paging[id]?.loaded;
      set((state) => ({ messages: { ...state.messages, [id]: mergeMessages(state.messages[id] ?? [], incoming) } }));
      setPaging(id, first ? { loaded: true, cursor: page.nextCursor } : { loaded: true });
    } catch (error) {
      if (!get().paging[id]?.loaded) showError(error, "Could not load messages");
    }
  }

  async function postRecording(id: string, clientId: string, kind: "voice" | "video", uri: string, durationMs: number, waveform?: number[]) {
    try {
      get().receiveMessage(await sendRecording({ conversationId: id, clientId, kind, uri, durationMs, waveform }));
    } catch {
      setStatus(id, clientId, "failed");
    }
  }

  async function postText(id: string, clientId: string, text: string) {
    try {
      const saved = await api("/messages", { ...auth, method: "POST", body: { conversationId: id, type: "text", body: text, clientId }, schema: messageSchema });
      get().receiveMessage(saved);
    } catch {
      setStatus(id, clientId, "failed");
    }
  }

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

        // The chat list shows each chat's last line, so that one message is in place before a chat is ever opened.
        const lastLines = Object.fromEntries(
          chatViews.filter((chat) => chat.lastMessage).map((chat) => [chat.id, [toLastMessage(chat.lastMessage!, chat.id, me)]]),
        );

        set((state) => ({
          status: "ready",
          hubs: details.map((d) => d.hub),
          pods: details.flatMap((d) => d.pods),
          chats: chatViews.map((chat) => toChat(chat, me)),
          members,
          messages: { ...lastLines, ...state.messages },
          unread: Object.fromEntries(summary.conversations.map((c) => [c.conversationId, c.unread])),
        }));
      } catch (error) {
        set({ status: "error", loadError: errorMessage(error) });
      }
    },

    reset: () => set({ ...EMPTY }),

    refreshSelf: () => set((state) => ({ members: { ...state.members, [ME_ID]: selfMember() } })),

    markPodRead(podId) {
      if (get().unread[podId]) set((state) => ({ unread: { ...state.unread, [podId]: 0 } }));
      const newest = [...(get().messages[podId] ?? [])].reverse().find((m) => !m.status && m.id.length === 36);
      if (!newest || reportedRead.get(podId) === newest.id) return;
      reportedRead.set(podId, newest.id);
      api(`/conversations/${podId}/read`, { ...auth, method: "POST", body: { lastReadId: newest.id } }).catch(() => reportedRead.delete(podId));
    },

    async openConversation(id) {
      realtime.open(id);
      const paging = get().paging[id];
      if (paging?.loaded) return get().catchUp([id]);
      await fetchLatest(id);
    },

    closeConversation(id) {
      realtime.close(id);
    },

    async loadOlder(id) {
      const paging = get().paging[id];
      if (!paging?.loaded || paging.cursor === null || paging.loadingOlder) return;
      setPaging(id, { loadingOlder: true });
      try {
        const page = await api(`/conversations/${id}/messages?limit=${PAGE_SIZE}&before=${paging.cursor}`, { ...auth, schema: messagePageSchema });
        const me = myId();
        set((state) => ({
          messages: { ...state.messages, [id]: mergeMessages(state.messages[id] ?? [], page.items.map((m) => toMessage(m, id, me))) },
        }));
        setPaging(id, { cursor: page.nextCursor, loadingOlder: false });
      } catch {
        setPaging(id, { loadingOlder: false });
      }
    },

    async catchUp(openConversations) {
      await Promise.all(openConversations.filter((id) => get().paging[id]?.loaded).map((id) => fetchLatest(id)));
    },

    receiveMessage(view) {
      const message = toMessage(view, view.conversationId, myId());
      set((state) => ({
        messages: { ...state.messages, [view.conversationId]: mergeMessages(state.messages[view.conversationId] ?? [], [message]) },
      }));

      // Someone who joined after this phone loaded the hub has no name or avatar here yet.
      if (message.kind !== "system" && !get().members[message.authorId]) {
        const pod = get().pods.find((p) => p.id === view.conversationId);
        if (pod) void get().refreshHub(pod.hubId);
      }
    },

    async refreshHub(hubId) {
      if (refreshingHubs.has(hubId)) return;
      refreshingHubs.add(hubId);
      try {
        const view = await api(`/hubs/${hubId}`, { ...auth, schema: hubSchema });
        const { hub, pods, people } = await fetchHubDetails(view);
        set((state) => ({
          hubs: state.hubs.map((h) => (h.id === hubId ? hub : h)),
          pods: [...state.pods.filter((p) => p.hubId !== hubId), ...pods],
          members: { ...state.members, ...Object.fromEntries(people.map((p) => [p.id, p])) },
        }));
      } catch {
        // The next message from this person tries again.
      } finally {
        refreshingHubs.delete(hubId);
      }
    },

    receiveUnread(update) {
      set((state) => ({ unread: { ...state.unread, [update.conversationId]: update.unread } }));
    },

    receiveTyping(notice, on) {
      const who = asLocalId(notice.userId, myId());
      set((state) => {
        const current = state.typing[notice.conversationId];
        if (on) return { typing: { ...state.typing, [notice.conversationId]: who } };
        return current === who ? { typing: { ...state.typing, [notice.conversationId]: null } } : state;
      });
    },

    receivePresence(update) {
      const who = asLocalId(update.userId, myId());
      set((state) => {
        const member = state.members[who];
        return member ? { members: { ...state.members, [who]: { ...member, online: update.online } } } : state;
      });
    },

    receiveChatUpdate(update) {
      if (!get().chats.some((chat) => chat.id === update.conversationId)) {
        // A chat this phone has never heard of, started by someone else. The list route knows about it.
        void get().load();
        return;
      }
      const message = toMessage(update.lastMessage, update.conversationId, myId());
      set((state) => ({
        messages: { ...state.messages, [update.conversationId]: mergeMessages(state.messages[update.conversationId] ?? [], [message]) },
      }));
    },

    async retryMessage(id, clientId) {
      const draft = get().messages[id]?.find((m) => m.clientId === clientId);
      if (!draft || draft.kind === "system") return;
      setStatus(id, clientId, "sending");
      if (draft.kind === "text") await postText(id, clientId, draft.text);
      else if (draft.localUri) await postRecording(id, clientId, draft.kind, draft.localUri, draft.durationMs, draft.kind === "voice" ? draft.waveform : undefined);
      else setStatus(id, clientId, "failed");
    },

    async refreshMedia(id, messageId) {
      const message = get().messages[id]?.find((m) => m.id === messageId);
      if (!message || message.kind === "system" || message.kind === "text") return null;
      if (message.status || message.id === message.clientId) return message.localUri ?? null;
      try {
        const view = await api(`/messages/${messageId}/media`, { ...auth, schema: mediaViewSchema });
        const url = mediaUrl(view.url);
        set((state) => ({
          messages: {
            ...state.messages,
            [id]: (state.messages[id] ?? []).map((m) =>
              m.id === messageId && (m.kind === "voice" || m.kind === "video")
                ? { ...m, mediaUrl: url, mediaStatus: view.status === "uploading" ? undefined : view.status, ...(m.kind === "video" && { posterUrl: mediaUrl(view.posterUrl) }) }
                : m,
            ),
          },
        }));
        return url;
      } catch {
        return null;
      }
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

    sendMessage(podId, payload) {
      const clientId = uuid();
      if (payload.kind !== "text") {
        const base = { id: clientId, clientId, podId, authorId: ME_ID, sentAt: Date.now(), reactions: [], status: "sending" as const, localUri: payload.uri, mediaStatus: "ready" as const, durationMs: payload.durationMs };
        const draft: Message = payload.kind === "voice" ? { ...base, kind: "voice", waveform: payload.waveform } : { ...base, kind: "video" };
        set((state) => ({ messages: { ...state.messages, [podId]: mergeMessages(state.messages[podId] ?? [], [draft]) } }));
        void postRecording(podId, clientId, payload.kind, payload.uri, payload.durationMs, payload.kind === "voice" ? payload.waveform : undefined);
        return;
      }
      const draft: Message = { id: clientId, clientId, podId, kind: "text", authorId: ME_ID, text: payload.text, sentAt: Date.now(), reactions: [], status: "sending" };
      set((state) => ({ messages: { ...state.messages, [podId]: mergeMessages(state.messages[podId] ?? [], [draft]) } }));
      void postText(podId, clientId, payload.text);
    },

    async toggleReaction(podId, messageId, emoji) {
      const message = get().messages[podId]?.find((m) => m.id === messageId);
      if (!message || message.status) return;
      const mine = message.reactions.find((r) => r.emoji === emoji)?.userIds.includes(ME_ID) ?? false;
      const previous = message.reactions;

      const apply = (reactions: Message["reactions"]) =>
        set((state) => ({
          messages: { ...state.messages, [podId]: (state.messages[podId] ?? []).map((m) => (m.id === messageId ? { ...m, reactions } : m)) },
        }));
      const without = previous.map((r) => (r.emoji === emoji ? { ...r, userIds: r.userIds.filter((u) => u !== ME_ID) } : r)).filter((r) => r.userIds.length > 0);
      const withMine = previous.some((r) => r.emoji === emoji)
        ? previous.map((r) => (r.emoji === emoji ? { ...r, userIds: [...r.userIds, ME_ID] } : r))
        : [...previous, { emoji, userIds: [ME_ID] }];

      apply(mine ? without : withMine);
      try {
        const saved = await api(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {
          ...auth,
          method: mine ? "DELETE" : "PUT",
          schema: messageSchema,
        });
        get().receiveMessage(saved);
      } catch (error) {
        apply(previous);
        showError(error);
      }
    },

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
