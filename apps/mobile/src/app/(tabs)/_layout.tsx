import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTheme } from "@/theme/theme-provider";

type IconName = keyof typeof Ionicons.glyphMap;

/** One tab: an outline icon when idle, a filled icon when active. Icons first, no text labels. */
function tab(title: string, outline: IconName, filled: IconName, active: string, idle: string) {
  return {
    title,
    tabBarAccessibilityLabel: title,
    tabBarIcon: ({ focused }: { focused: boolean }) => (
      <Ionicons name={focused ? filled : outline} size={26} color={focused ? active : idle} />
    ),
  };
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.canvas,
          borderTopColor: colors.line,
        },
      }}
    >
      <Tabs.Screen name="index" options={tab("Hubs", "grid-outline", "grid", colors.ink, colors.muted)} />
      <Tabs.Screen name="chats" options={tab("Chats", "chatbubble-outline", "chatbubble", colors.ink, colors.muted)} />
      <Tabs.Screen name="activity" options={tab("Activity", "notifications-outline", "notifications", colors.ink, colors.muted)} />
      <Tabs.Screen name="you" options={tab("You", "person-outline", "person", colors.ink, colors.muted)} />
    </Tabs>
  );
}
