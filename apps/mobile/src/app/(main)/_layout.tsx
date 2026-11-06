import { Stack } from "expo-router";
import { useEffect } from "react";
import { useActivityStore } from "@/features/activity/store";
import { MessageMenuHost } from "@/features/hubs/components/message-menu";
import { usePush } from "@/features/push/use-push";
import { startRealtime, stopRealtime } from "@/features/hubs/realtime-handlers";
import { useHubsStore } from "@/features/hubs/store";
import { useTheme } from "@/theme/theme-provider";

/** Sheets draw their own backdrop and slide themselves in, so the route must be see-through and unanimated. */
const sheet = {
  presentation: "transparentModal",
  animation: "none",
  contentStyle: { backgroundColor: "transparent" },
} as const;

export default function MainLayout() {
  const { colors } = useTheme();
  usePush();

  // Everything in this group is signed-in content, so its data is fetched when the group mounts and dropped when it unmounts.
  useEffect(() => {
    void useHubsStore.getState().load();
    void useActivityStore.getState().load();
    startRealtime();
    return () => {
      stopRealtime();
      useHubsStore.getState().reset();
      useActivityStore.getState().reset();
    };
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="hubs/add" options={sheet} />
        <Stack.Screen name="hubs/new" options={sheet} />
        <Stack.Screen name="hubs/join" options={sheet} />
        <Stack.Screen name="hub/[hubId]/members" options={sheet} />
        <Stack.Screen name="hub/[hubId]/new-pod" options={sheet} />
      </Stack>
      <MessageMenuHost />
    </>
  );
}
