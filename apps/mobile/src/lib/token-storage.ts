import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "ricochet.refreshToken";

/**
 * The refresh token lives in the iOS keychain or Android keystore, never in plain storage.
 * The browser has no keychain, so the web build (development only) uses localStorage.
 */
export const tokenStorage =
  Platform.OS === "web"
    ? {
        get: async () => globalThis.localStorage?.getItem(KEY) ?? null,
        set: async (token: string) => globalThis.localStorage?.setItem(KEY, token),
        clear: async () => globalThis.localStorage?.removeItem(KEY),
      }
    : {
        get: () => SecureStore.getItemAsync(KEY),
        set: (token: string) => SecureStore.setItemAsync(KEY, token),
        clear: () => SecureStore.deleteItemAsync(KEY),
      };
