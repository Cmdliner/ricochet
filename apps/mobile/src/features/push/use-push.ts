import { pushDataSchema } from "@ricochet/shared";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";
import { realtime } from "@/lib/realtime";
import { registerForPush } from "@/lib/push";

// A banner on top of the conversation you are already reading would only be noise.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = pushDataSchema.safeParse(notification.request.content.data);
    const watching = data.success && data.data.type === "message" && realtime.isOpen(data.data.conversationId);
    return { shouldShowBanner: !watching, shouldShowList: !watching, shouldPlaySound: !watching, shouldSetBadge: false };
  },
});

/** Opens whatever a notification was about. */
function openFrom(content: Notifications.NotificationContent) {
  const data = pushDataSchema.safeParse(content.data);
  if (!data.success) return;
  if (data.data.type === "invite") router.push("/activity");
  else if (data.data.kind === "pod") router.push({ pathname: "/pod/[podId]", params: { podId: data.data.conversationId } });
  else router.push({ pathname: "/chat/[chatId]", params: { chatId: data.data.conversationId } });
}

/** Signed-in screens call this once. It registers the phone and sends taps on notifications to the right screen. */
export function usePush() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    void registerForPush().catch(() => undefined);

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => openFrom(response.notification.request.content));
    // The app may have been closed when the notification was tapped, in which case the tap has already happened.
    const opening = Notifications.getLastNotificationResponse();
    if (opening) openFrom(opening.notification.request.content);
    return () => subscription.remove();
  }, []);
}
