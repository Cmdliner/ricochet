import { create } from "zustand";

export type DialogButton = {
  text: string;
  /** `cancel` closes quietly, `destructive` is drawn as a warning. Anything else is a normal action. */
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

export type DialogContent = { id: number; title: string; message?: string; buttons: DialogButton[] };

type DialogState = {
  current: DialogContent | null;
  queue: DialogContent[];
  open: (content: DialogContent) => void;
  close: () => void;
};

export const useDialogStore = create<DialogState>((set, get) => ({
  current: null,
  queue: [],
  // A second dialog waits its turn rather than replacing the one someone is reading.
  open: (content) => (get().current ? set((state) => ({ queue: [...state.queue, content] })) : set({ current: content })),
  close: () => set((state) => ({ current: state.queue[0] ?? null, queue: state.queue.slice(1) })),
}));

let nextId = 1;

/** Shows the app's own dialog. Takes the same arguments as `Alert.alert`, so it is a drop-in replacement. */
export function showDialog(title: string, message?: string, buttons?: DialogButton[]): void {
  useDialogStore.getState().open({ id: nextId++, title, message, buttons: buttons?.length ? buttons : [{ text: "OK" }] });
}
