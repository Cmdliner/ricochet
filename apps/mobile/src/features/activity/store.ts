import { create } from "zustand";
import { day, ago } from "@/features/hubs/mock-data";
import { useHubsStore } from "@/features/hubs/store";

// Mock data. The actions become API calls when the API is wired in.

export type NotificationKind = "mention" | "reply" | "reaction" | "invite" | "announcement";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  actorId?: string;
  hubId?: string;
  podId?: string;
  hubName?: string;
  inviteCode?: string;
  preview?: string;
  emoji?: string;
  at: number;
  read: boolean;
  invite?: "pending" | "accepted" | "declined";
};

const SEED: AppNotification[] = [
  { id: "n1", kind: "mention", actorId: "mira", hubId: "ship-it", podId: "ship-launch", preview: "@you can you look at the pricing copy before we freeze it?", at: ago(6), read: false },
  { id: "n2", kind: "invite", actorId: "leo", hubName: "Pixel Lab", inviteCode: "BOUNCE", preview: "Game jams, pixel art and procedural everything.", at: ago(38), read: false, invite: "pending" },
  { id: "n3", kind: "reaction", actorId: "jonah", hubId: "ship-it", podId: "ship-launch", emoji: "🔥", preview: "Landing page is live. Go break it.", at: ago(95), read: false },
  { id: "n4", kind: "reply", actorId: "tola", hubId: "design-club", podId: "design-crits", preview: "Agree on the spacing, but the icon weight feels heavy next to the type.", at: ago(210), read: true },
  { id: "n5", kind: "announcement", hubId: "ship-it", podId: "ship-announce", preview: "Friday launch call moved to 4pm. Bring your checklists.", at: ago(day - 40), read: true },
  { id: "n6", kind: "mention", actorId: "priya", hubId: "design-club", podId: "design-inspo", preview: "@you this is exactly the vibe you described last week", at: ago(day + 120), read: true },
  { id: "n7", kind: "reaction", actorId: "noor", hubId: "book-circle", podId: "book-current", emoji: "❤️", preview: "Chapter 7 wrecked me in the best way.", at: ago(2 * day + 60), read: true },
  { id: "n8", kind: "reply", actorId: "zara", hubId: "book-circle", podId: "book-next", preview: "I voted for the memoir too. Finally someone with taste.", at: ago(4 * day), read: true },
];

type ActivityState = {
  items: AppNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  respondToInvite: (id: string, accept: boolean) => void;
};

export const useActivityStore = create<ActivityState>((set, get) => ({
  items: SEED,

  markRead(id) {
    set((state) => ({ items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  },

  markAllRead() {
    set((state) => ({ items: state.items.map((n) => ({ ...n, read: true })) }));
  },

  respondToInvite(id, accept) {
    const note = get().items.find((n) => n.id === id);
    if (accept && note?.inviteCode) useHubsStore.getState().joinHub(note.inviteCode);
    set((state) => ({
      items: state.items.map((n) => (n.id === id ? { ...n, read: true, invite: accept ? "accepted" : "declined" } : n)),
    }));
  },
}));

export function useUnreadActivity(): number {
  return useActivityStore((s) => s.items.filter((n) => !n.read).length);
}
