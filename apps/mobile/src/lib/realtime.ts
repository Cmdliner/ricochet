import {
  EVENTS,
  type ActivityNew,
  type ActivityUnread,
  type ChatUpdated,
  type MessageView,
  type PresenceUpdate,
  type TypingNotice,
  type UnreadUpdate,
} from "@ricochet/shared";
import { AppState } from "react-native";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth-store";
import { API_URL } from "./config";

export type RealtimeHandlers = {
  /** Fires on every connect, including reconnects, so the app can catch up on what it missed while offline. */
  connected: (openConversations: string[]) => void;
  messageNew: (message: MessageView) => void;
  unread: (update: UnreadUpdate) => void;
  typing: (notice: TypingNotice, on: boolean) => void;
  presence: (update: PresenceUpdate) => void;
  chatUpdated: (update: ChatUpdated) => void;
  activityNew: (event: ActivityNew) => void;
  activityUnread: (event: ActivityUnread) => void;
};

const REFRESH_MARGIN_MS = 30_000;
const RETRY_AFTER_REFUSAL_MS = 3_000;

function expiresSoon(jwt: string): boolean {
  try {
    const payload = JSON.parse(atob((jwt.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return !payload.exp || payload.exp * 1000 - Date.now() < REFRESH_MARGIN_MS;
  } catch {
    return true;
  }
}

/** The server only checks the token while connecting, so every (re)connect needs one that is still good. */
async function freshToken(): Promise<string | null> {
  const { accessToken, refreshSession } = useAuthStore.getState();
  if (accessToken && !expiresSoon(accessToken)) return accessToken;
  return refreshSession();
}

let socket: Socket | null = null;
let appStateSubscription: { remove: () => void } | null = null;
/** Rooms are lost when a connection drops, so the ones the screens asked for are remembered and rejoined. */
const openRooms = new Set<string>();

export const realtime = {
  start(handlers: RealtimeHandlers) {
    if (socket) return;
    const next = io(API_URL, {
      transports: ["websocket"],
      reconnectionDelayMax: 10_000,
      auth: (done) => {
        void freshToken().then((token) => done({ token }));
      },
    });
    socket = next;

    next.on("connect", () => {
      for (const id of openRooms) next.emit(EVENTS.conversationOpen, { conversationId: id });
      handlers.connected([...openRooms]);
    });
    // A refusal from the server is final for socket.io, so retry by hand once the token has had a chance to refresh.
    next.on("connect_error", () => {
      if (!next.active) setTimeout(() => next.connect(), RETRY_AFTER_REFUSAL_MS);
    });

    next.on(EVENTS.messageNew, handlers.messageNew);
    next.on(EVENTS.unreadUpdate, handlers.unread);
    next.on(EVENTS.typingStart, (notice: TypingNotice) => handlers.typing(notice, true));
    next.on(EVENTS.typingStop, (notice: TypingNotice) => handlers.typing(notice, false));
    next.on(EVENTS.presenceUpdate, handlers.presence);
    next.on(EVENTS.chatUpdated, handlers.chatUpdated);
    next.on(EVENTS.activityNew, handlers.activityNew);
    next.on(EVENTS.activityUnread, handlers.activityUnread);

    appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && !next.connected) next.connect();
    });
  },

  stop() {
    appStateSubscription?.remove();
    appStateSubscription = null;
    socket?.close();
    socket = null;
    openRooms.clear();
  },

  open(conversationId: string) {
    openRooms.add(conversationId);
    if (socket?.connected) socket.emit(EVENTS.conversationOpen, { conversationId });
  },

  close(conversationId: string) {
    openRooms.delete(conversationId);
    if (socket?.connected) socket.emit(EVENTS.conversationClose, { conversationId });
  },

  typing(conversationId: string, on: boolean) {
    if (socket?.connected) socket.emit(on ? EVENTS.typingStart : EVENTS.typingStop, { conversationId });
  },
};
