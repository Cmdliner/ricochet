import { Ionicons } from "@expo/vector-icons";
import { colors } from "@ricochet/shared";
import { Tabs } from "expo-router";

type IconName = keyof typeof Ionicons.glyphMap;

/** One tab: an outline icon when idle, a filled icon when active. Icons first, no text labels. */
function tab(title: string, outline: IconName, filled: IconName) {
  return {
    title,
    tabBarAccessibilityLabel: title,
    tabBarIcon: ({ focused }: { focused: boolean }) => (
      <Ionicons
        name={focused ? filled : outline}
        size={26}
        color={focused ? colors.dark.ink : colors.dark.muted}
      />
    ),
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.dark.ink,
        tabBarInactiveTintColor: colors.dark.muted,
        tabBarStyle: {
          backgroundColor: colors.dark.canvas,
          borderTopColor: colors.dark.line,
        },
      }}
    >
      <Tabs.Screen name="index" options={tab("Hubs", "grid-outline", "grid")} />
      <Tabs.Screen name="chats" options={tab("Chats", "chatbubble-outline", "chatbubble")} />
      <Tabs.Screen name="activity" options={tab("Activity", "notifications-outline", "notifications")} />
      <Tabs.Screen name="you" options={tab("You", "person-outline", "person")} />
    </Tabs>
  );
}
