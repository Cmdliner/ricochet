import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, SectionList, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChatsArt, SearchArt } from "@/components/illustrations/empty-art";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { ChatRow } from "@/features/hubs/components/chat-row";
import { useHubsStore } from "@/features/hubs/store";
import { useTheme } from "@/theme/theme-provider";

type Filter = "all" | "unread";

export default function Chats() {
  const { colors } = useTheme();
  const chats = useHubsStore((s) => s.chats);
  const members = useHubsStore((s) => s.members);
  const unread = useHubsStore((s) => s.unread);
  const messages = useHubsStore((s) => s.messages);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const unreadCount = chats.filter((c) => !c.muted && (unread[c.id] ?? 0) > 0).length;
  const searching = query.trim().length > 0;

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const lastAt = (id: string) => messages[id]?.[messages[id].length - 1]?.sentAt ?? 0;
    const matches = chats
      .filter((chat) => {
        const person = members[chat.personId];
        if (!person) return false;
        if (q && !person.name.toLowerCase().includes(q) && !person.handle.toLowerCase().includes(q)) return false;
        if (filter === "unread" && (chat.muted || (unread[chat.id] ?? 0) === 0)) return false;
        return true;
      })
      .sort((a, b) => lastAt(b.id) - lastAt(a.id));

    const pinned = matches.filter((c) => c.pinned);
    const rest = matches.filter((c) => !c.pinned);
    const out: { title: string; data: typeof matches }[] = [];
    if (pinned.length) out.push({ title: "Pinned", data: pinned });
    if (rest.length) out.push({ title: pinned.length ? "All chats" : "Recent", data: rest });
    return out;
  }, [chats, members, messages, unread, query, filter]);

  const nothingAtAll = chats.length === 0;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <View className="px-5 pt-5">
        <Text className="font-display text-[32px] tracking-tight text-ink">Chats</Text>
      </View>

      <SectionList
        sections={nothingAtAll ? [] : sections}
        keyExtractor={(chat) => chat.id}
        renderItem={({ item }) => <ChatRow chat={item} />}
        renderSectionHeader={({ section }) => (
          <Text className="bg-canvas px-5 pt-5 pb-1 text-xs font-sans-semibold tracking-widest text-muted uppercase">{section.title}</Text>
        )}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 40 }}
        ListHeaderComponent={
          nothingAtAll ? undefined : (
            <View className="px-3 pt-4">
              <View className="h-12 flex-row items-center gap-3 rounded-2xl bg-raised px-4">
                <Ionicons name="search" size={19} color={colors.muted} />
                <TextInput
                  accessibilityLabel="Search chats"
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search people"
                  placeholderTextColor={colors.muted}
                  selectionColor={colors.accent}
                  autoCorrect={false}
                  returnKeyType="search"
                  className="h-full flex-1 font-sans text-base text-ink"
                />
                {searching ? (
                  <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery("")}>
                    <Ionicons name="close-circle" size={19} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>

              <View className="mt-3 flex-row gap-2">
                {(["all", "unread"] as const).map((value) => {
                  const selected = filter === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setFilter(value)}
                      className={`flex-row items-center gap-2 rounded-full px-4 py-2 ${selected ? "bg-accent" : "border border-line bg-surface"}`}
                    >
                      <Text className={`text-sm font-sans-semibold ${selected ? "text-accent-ink" : "text-muted"}`}>
                        {value === "all" ? "All" : "Unread"}
                      </Text>
                      {value === "unread" && unreadCount > 0 ? (
                        <View className={`h-5 min-w-5 items-center justify-center rounded-full px-1.5 ${selected ? "bg-accent-ink/15" : "bg-accent"}`}>
                          <Text className={`text-[11px] font-sans-bold ${selected ? "text-accent-ink" : "text-accent-ink"}`}>{unreadCount}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )
        }
        ListEmptyComponent={
          nothingAtAll ? (
            <EmptyState
              art={<ChatsArt width={240} />}
              title="Your private chats live here"
              body="One-to-one conversations with the people you know, away from the noise of a hub."
              hints={[
                { icon: "chatbubble-ellipses-outline", label: "Messages" },
                { icon: "mic-outline", label: "Voice notes" },
                { icon: "videocam-outline", label: "Video notes" },
              ]}
            />
          ) : searching ? (
            <EmptyState
              art={<SearchArt />}
              title="No one by that name"
              body={`None of your chats match “${query.trim()}”.`}
              secondary={{ label: "Clear search", onPress: () => setQuery("") }}
            />
          ) : (
            <EmptyState
              art={<ChatsArt width={240} />}
              title="Nothing unread"
              body="You have read everything. New messages will show up here first."
              secondary={{ label: "Show all chats", onPress: () => setFilter("all") }}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
