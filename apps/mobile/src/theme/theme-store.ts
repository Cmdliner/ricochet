import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type { Preference } from "./themes";

const KEY = "ricochet.theme";
const VALID: Preference[] = ["system", "light", "dark"];

type ThemeState = {
  preference: Preference;
  /** False until the saved choice has been read, so the app never flashes the wrong theme. */
  loaded: boolean;
  load: () => Promise<void>;
  setPreference: (preference: Preference) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",
  loaded: false,

  async load() {
    try {
      const saved = await AsyncStorage.getItem(KEY);
      if (saved && VALID.includes(saved as Preference)) set({ preference: saved as Preference });
    } catch {
      // A failed read just means we use the default.
    }
    set({ loaded: true });
  },

  setPreference(preference) {
    set({ preference });
    void AsyncStorage.setItem(KEY, preference).catch(() => undefined);
  },
}));
