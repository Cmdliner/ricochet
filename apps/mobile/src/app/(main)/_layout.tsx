import { Stack } from "expo-router";
import { useTheme } from "@/theme/theme-provider";

/** Sheets draw their own backdrop and slide themselves in, so the route must be see-through and unanimated. */
const sheet = {
  presentation: "transparentModal",
  animation: "none",
  contentStyle: { backgroundColor: "transparent" },
} as const;

/** Everything a signed-in person can reach: the tabs, hubs, pods and the sheets that open over them. */
export default function MainLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="hubs/add" options={sheet} />
      <Stack.Screen name="hubs/new" options={sheet} />
      <Stack.Screen name="hubs/join" options={sheet} />
      <Stack.Screen name="hub/[hubId]/members" options={sheet} />
    </Stack>
  );
}
