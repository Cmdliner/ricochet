import { authResponseSchema, type AuthResponse, type AuthUser } from "@ricochet/shared";
import { create } from "zustand";
import { api, ApiError, configureApi } from "@/lib/api";
import { tokenStorage } from "@/lib/token-storage";

type Status = "loading" | "signedOut" | "signedIn";

type AuthState = {
  status: Status;
  user: AuthUser | null;
  accessToken: string | null;
  restore: () => Promise<void>;
  signIn: (session: AuthResponse) => Promise<void>;
  setUser: (user: AuthUser) => void;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
};

// Only one refresh may run at a time, otherwise two requests would race with one token.
let refreshing: Promise<string | null> | null = null;
let restoring = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "loading",
  user: null,
  accessToken: null,

  async restore() {
    if (restoring) return;
    restoring = true;
    const token = await tokenStorage.get();
    if (!token) {
      set({ status: "signedOut" });
      return;
    }
    const accessToken = await get().refreshSession();
    if (!accessToken) set({ status: "signedOut" });
  },

  async signIn(session) {
    await tokenStorage.set(session.refreshToken);
    set({ status: "signedIn", user: session.user, accessToken: session.accessToken });
  },

  setUser: (user) => set({ user }),

  async signOut() {
    const token = await tokenStorage.get();
    set({ status: "signedOut", user: null, accessToken: null });
    await tokenStorage.clear();
    if (token) await api("/auth/logout", { method: "POST", body: { refreshToken: token } }).catch(() => undefined);
  },

  refreshSession() {
    refreshing ??= (async () => {
      try {
        const token = await tokenStorage.get();
        if (!token) return null;
        const session = await api("/auth/refresh", {
          method: "POST",
          body: { refreshToken: token },
          schema: authResponseSchema,
        });
        await get().signIn(session);
        return session.accessToken;
      } catch (error) {
        // A rejected token means the session is over. A network error should not sign anyone out.
        if (error instanceof ApiError && error.status === 401) {
          await tokenStorage.clear();
          set({ status: "signedOut", user: null, accessToken: null });
        }
        return null;
      } finally {
        refreshing = null;
      }
    })();
    return refreshing;
  },
}));

configureApi({
  getAccessToken: () => useAuthStore.getState().accessToken,
  refresh: () => useAuthStore.getState().refreshSession(),
});
