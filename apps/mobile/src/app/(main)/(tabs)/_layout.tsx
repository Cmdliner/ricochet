import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useUnreadActivity } from "@/features/activity/store";
import { useHubsStore } from "@/features/hubs/store";
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
  const activityUnread = useUnreadActivity();
  const chatsUnread = useHubsStore((s) => s.chats.filter((c) => !c.muted && (s.unread[c.id] ?? 0) > 0).length);
  const badge = (count: number) => ({
    tabBarBadge: count > 0 ? count : undefined,
    tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.accentInk, fontFamily: "Inter_700Bold", fontSize: 11 },
  });
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
      <Tabs.Screen name="chats" options={{ ...tab("Chats", "chatbubble-outline", "chatbubble", colors.ink, colors.muted), ...badge(chatsUnread) }} />
      <Tabs.Screen name="activity" options={{ ...tab("Activity", "notifications-outline", "notifications", colors.ink, colors.muted), ...badge(activityUnread) }} />
      <Tabs.Screen name="you" options={tab("You", "person-outline", "person", colors.ink, colors.muted)} />
    </Tabs>
  );
}
