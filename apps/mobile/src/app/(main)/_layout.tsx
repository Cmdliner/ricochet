import { Stack } from "expo-router";
import { useEffect } from "react";
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

  // Everything in this group is signed-in content, so its data is fetched when the group mounts and dropped when it unmounts.
  useEffect(() => {
    void useHubsStore.getState().load();
    return () => useHubsStore.getState().reset();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="hubs/add" options={sheet} />
      <Stack.Screen name="hubs/new" options={sheet} />
      <Stack.Screen name="hubs/join" options={sheet} />
      <Stack.Screen name="hub/[hubId]/members" options={sheet} />
      <Stack.Screen name="hub/[hubId]/new-pod" options={sheet} />
    </Stack>
  );
}
