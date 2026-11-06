import { activityItemSchema, activityPageSchema, unreadSummarySchema, type ActivityItem, type ActivityNew } from "@ricochet/shared";
import { z } from "zod";
import { create } from "zustand";
import { useHubsStore } from "@/features/hubs/store";
import { api, errorMessage } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { showError } from "@/lib/notify";

export type NotificationKind = ActivityItem["kind"];

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  actor?: { id: string; name: string; color: NonNullable<ActivityItem["actor"]>["avatarColor"]; avatarUrl: string | null };
  hubId?: string;
  podId?: string;
  hubName?: string;
  podName?: string;
  preview?: string;
  emoji?: string;
  at: number;
  read: boolean;
  invite?: "pending" | "accepted" | "declined";
};

const PAGE_SIZE = 30;
const auth = { auth: true } as const;

function toNotification(item: ActivityItem): AppNotification {
  return {
    id: item.id,
    kind: item.kind,
    actor: item.actor ? { id: item.actor.id, name: item.actor.displayName, color: item.actor.avatarColor, avatarUrl: mediaUrl(item.actor.avatarUrl) } : undefined,
    hubId: item.hubId ?? undefined,
    podId: item.conversationId ?? undefined,
    hubName: item.hubName ?? undefined,
    podName: item.podName ?? undefined,
    preview: item.preview ?? undefined,
    emoji: item.emoji ?? undefined,
    at: Date.parse(item.createdAt),
    read: item.read,
    invite: item.invite ?? undefined,
  };
}

type Status = "idle" | "loading" | "ready" | "error";

type ActivityState = {
  status: Status;
  items: AppNotification[];
  /** The server's count, which can be higher than what is loaded here. */
  unread: number;
  cursor: string | null;
  loadingMore: boolean;

  load: () => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  respondToInvite: (id: string, accept: boolean) => Promise<void>;
  receiveNew: (event: ActivityNew) => void;
  receiveUnread: (unread: number) => void;
};

const EMPTY = { status: "idle" as Status, items: [] as AppNotification[], unread: 0, cursor: null as string | null, loadingMore: false };

export const useActivityStore = create<ActivityState>((set, get) => ({
  ...EMPTY,

  async load() {
    set({ status: get().status === "ready" ? "ready" : "loading" });
    try {
      const [page, summary] = await Promise.all([
        api(`/activity?limit=${PAGE_SIZE}`, { ...auth, schema: activityPageSchema }),
        api("/unread", { ...auth, schema: unreadSummarySchema }),
      ]);
      set({ status: "ready", items: page.items.map(toNotification), cursor: page.nextCursor, unread: summary.activity });
    } catch {
      set({ status: "error" });
    }
  },

  async loadMore() {
    const { cursor, loadingMore } = get();
    if (!cursor || loadingMore) return;
    set({ loadingMore: true });
    try {
      const page = await api(`/activity?limit=${PAGE_SIZE}&before=${cursor}`, { ...auth, schema: activityPageSchema });
      set((state) => ({ items: [...state.items, ...page.items.map(toNotification)], cursor: page.nextCursor, loadingMore: false }));
    } catch {
      set({ loadingMore: false });
    }
  },

  reset: () => set({ ...EMPTY }),

  markRead(id) {
    const note = get().items.find((n) => n.id === id);
    if (!note || note.read) return;
    set((state) => ({ items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)), unread: Math.max(0, state.unread - 1) }));
    api("/activity/read", { ...auth, method: "POST", body: { ids: [id] }, schema: z.object({ unread: z.number() }) })
      .then((result) => set({ unread: result.unread }))
      .catch(() => get().receiveUnread(get().unread + 1));
  },

  markAllRead() {
    const previous = get();
    set((state) => ({ items: state.items.map((n) => ({ ...n, read: true })), unread: 0 }));
    api("/activity/read", { ...auth, method: "POST", body: { all: true } }).catch((error: unknown) => {
      set({ items: previous.items, unread: previous.unread });
      showError(error);
    });
  },

  async respondToInvite(id, accept) {
    try {
      const item = await api(`/activity/${id}/respond`, { ...auth, method: "POST", body: { accept }, schema: activityItemSchema });
      set((state) => ({ items: state.items.map((n) => (n.id === id ? toNotification(item) : n)) }));
      if (accept) await useHubsStore.getState().load();
    } catch (error) {
      showError(error, errorMessage(error).includes("already") ? "Already answered" : undefined);
    }
  },

  receiveNew({ item, unread }) {
    set((state) => ({ items: [toNotification(item), ...state.items.filter((n) => n.id !== item.id)], unread }));
  },

  receiveUnread: (unread) => set({ unread }),
}));

export function useUnreadActivity(): number {
  return useActivityStore((s) => s.unread);
}
