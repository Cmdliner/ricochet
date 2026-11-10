import { personSchema, type CreateReportInput } from "@ricochet/shared";
import { z } from "zod";
import { create } from "zustand";
import { api } from "@/lib/api";
import { toMember } from "@/features/hubs/adapters";
import { useHubsStore } from "@/features/hubs/store";
import type { Member } from "@/features/hubs/types";
import { useAuthStore } from "@/stores/auth-store";

type SafetyState = {
  /** People this person has blocked. Their messages are hidden, and they cannot be written to until unblocked. */
  blocked: Member[];
  loaded: boolean;
  load: () => Promise<void>;
  block: (member: Member) => Promise<void>;
  unblock: (member: Member) => Promise<void>;
  report: (input: CreateReportInput) => Promise<void>;
  reset: () => void;
};

const auth = { auth: true } as const;

export const useSafetyStore = create<SafetyState>((set, get) => ({
  blocked: [],
  loaded: false,

  async load() {
    const people = await api("/blocks", { ...auth, schema: z.array(personSchema) });
    const me = useAuthStore.getState().user?.id;
    set({ blocked: people.map((person) => toMember(person, me)), loaded: true });
  },

  async block(member) {
    await api(`/blocks/${member.id}`, { ...auth, method: "PUT" });
    set((state) => ({ blocked: [member, ...state.blocked.filter((m) => m.id !== member.id)] }));
    // The server already hides everything from them. Reloading drops the chat from the list, and the purge
    // removes what was already on screen, which the reload would otherwise keep.
    await useHubsStore.getState().load();
    useHubsStore.getState().hideFrom(member.id);
  },

  async unblock(member) {
    await api(`/blocks/${member.id}`, { ...auth, method: "DELETE" });
    set((state) => ({ blocked: state.blocked.filter((m) => m.id !== member.id) }));
    const hubs = useHubsStore.getState();
    await hubs.load();
    // Whatever they wrote while blocked is visible again, so conversations already open fetch it.
    await hubs.catchUp(Object.keys(hubs.paging));
  },

  async report(input) {
    await api("/reports", { ...auth, method: "POST", body: input });
  },

  reset: () => set({ blocked: [], loaded: false }),
}));

export const useIsBlocked = (personId: string | undefined) => useSafetyStore((s) => !!personId && s.blocked.some((m) => m.id === personId));
