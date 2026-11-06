import { useMemo, useState } from "react";
import { Pressable, SectionList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandBar } from "@/components/brand-bar";
import { ActivityArt } from "@/components/illustrations/empty-art";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { NotificationRow } from "@/features/activity/notification-row";
import { useActivityStore, type AppNotification } from "@/features/activity/store";
import { formatDayLabel } from "@/features/hubs/format";

type Filter = "all" | "mentions" | "invites";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "mentions", label: "Mentions" },
  { value: "invites", label: "Invites" },
];

const EMPTY: Record<Filter, { title: string; body: string }> = {
  all: {
    title: "You are all caught up",
    body: "When someone mentions you, replies to you or invites you to a hub, you will see it here.",
  },
  mentions: { title: "No mentions yet", body: "When someone tags you in a pod, it will show up here so you never miss it." },
  invites: { title: "No invites waiting", body: "Hub invites from your friends will land here, ready to accept." },
};

function group(items: AppNotification[]) {
  const sections: { title: string; data: AppNotification[] }[] = [];
  const fresh = items.filter((n) => !n.read);
  if (fresh.length) sections.push({ title: "New", data: fresh });
  for (const note of items.filter((n) => n.read)) {
    const title = formatDayLabel(note.at);
    const last = sections[sections.length - 1];
    if (last && last.title === title) last.data.push(note);
    else sections.push({ title, data: [note] });
  }
  return sections;
}

export default function Activity() {
  const items = useActivityStore((s) => s.items);
  const markAllRead = useActivityStore((s) => s.markAllRead);
  const [filter, setFilter] = useState<Filter>("all");

  const unread = items.filter((n) => !n.read).length;
  const sections = useMemo(() => {
    const filtered = items
      .filter((n) => (filter === "mentions" ? n.kind === "mention" : filter === "invites" ? n.kind === "invite" : true))
      .sort((a, b) => b.at - a.at);
    return group(filtered);
  }, [items, filter]);

  const copy = EMPTY[filter];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <BrandBar
        right={
          unread > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Mark all as read" hitSlop={8} onPress={markAllRead} className="rounded-full bg-raised px-4 py-2 active:opacity-70">
              <Text className="text-sm font-sans-semibold text-ink">Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />
      <View className="px-5 pt-1">
        <Text className="font-display text-[32px] tracking-tight text-ink">Activity</Text>
      </View>

      <View className="flex-row gap-2 px-5 pt-4 pb-1">
        {FILTERS.map(({ value, label }) => {
          const selected = filter === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setFilter(value)}
              className={`rounded-full px-4 py-2 ${selected ? "bg-accent" : "border border-line bg-surface"}`}
            >
              <Text className={`text-sm font-sans-semibold ${selected ? "text-accent-ink" : "text-muted"}`}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(note) => note.id}
        renderItem={({ item }) => <NotificationRow note={item} />}
        renderSectionHeader={({ section }) => (
          <Text className="bg-canvas px-5 pt-5 pb-1 text-xs font-sans-semibold tracking-widest text-muted uppercase">{section.title}</Text>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 40 }}
        ListEmptyComponent={<EmptyState art={<ActivityArt width={240} />} title={copy.title} body={copy.body} />}
      />
    </SafeAreaView>
  );
}
