import { useActivityStore } from "@/features/activity/store";
import { realtime } from "@/lib/realtime";
import { useHubsStore } from "./store";

/** Connects the socket to the store: each event the server sends becomes one store action. */
export function startRealtime() {
  const store = () => useHubsStore.getState();
  let firstConnect = true;

  realtime.start({
    connected(openConversations) {
      // The first connect has just loaded everything. Any later one follows a gap, so refetch what could have been missed.
      if (firstConnect) {
        firstConnect = false;
        return;
      }
      void store().load();
      void useActivityStore.getState().load();
      void store().catchUp(openConversations);
    },
    messageNew: (message) => store().receiveMessage(message),
    unread: (update) => store().receiveUnread(update),
    typing: (notice, on) => store().receiveTyping(notice, on),
    presence: (update) => store().receivePresence(update),
    chatUpdated: (update) => store().receiveChatUpdate(update),
    activityNew: (event) => useActivityStore.getState().receiveNew(event),
    activityUnread: ({ unread }) => useActivityStore.getState().receiveUnread(unread),
  });
}

export function stopRealtime() {
  realtime.stop();
}
