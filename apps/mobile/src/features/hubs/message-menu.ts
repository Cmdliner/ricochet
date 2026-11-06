import { create } from "zustand";

type MenuState = {
  target: { podId: string; messageId: string } | null;
  open: (podId: string, messageId: string) => void;
  close: () => void;
};

/** Which message the long-press menu is open for. Only one at a time, and none until someone holds a message. */
export const useMessageMenu = create<MenuState>((set) => ({
  target: null,
  open: (podId, messageId) => set({ target: { podId, messageId } }),
  close: () => set({ target: null }),
}));
