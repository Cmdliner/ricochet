import { Stack } from "expo-router";
import { useTheme } from "@/theme/theme-provider";

/** Everything a signed-in person can reach: the tabs, hubs, pods and the create and join sheets. */
export default function MainLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="hubs/new" options={{ presentation: "modal" }} />
      <Stack.Screen name="hubs/join" options={{ presentation: "modal" }} />
    </Stack>
  );
}
