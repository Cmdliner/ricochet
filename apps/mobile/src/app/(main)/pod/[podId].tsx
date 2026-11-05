import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { FlatList, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "@/components/ui/icon-button";
import { NotFound } from "@/components/ui/not-found";
import { ScreenHeader } from "@/components/ui/screen-header";
import { buildChatItems } from "@/features/hubs/chat-items";
import { Composer } from "@/features/hubs/components/composer";
import { DaySeparator } from "@/features/hubs/components/day-separator";
import { MessageItem } from "@/features/hubs/components/message-item";
import { TypingIndicator } from "@/features/hubs/components/typing-indicator";
import { useHubStats } from "@/features/hubs/hooks";
import { useHub, useHubsStore, usePod } from "@/features/hubs/store";
import { ME_ID, type ChatItem } from "@/features/hubs/types";

/** What shows at the very top of a pod, above its first message. */
function PodIntro({ name, description }: { name: string; description: string }) {
  return (
    <View className="items-center gap-2 px-8 py-10">
      <View className="size-16 items-center justify-center rounded-3xl bg-raised">
        <Text className="text-3xl font-sans-semibold text-muted">#</Text>
      </View>
      <Text className="font-display text-xl text-ink">Welcome to #{name}</Text>
      <Text className="text-center text-muted">{description}</Text>
      <Text className="text-center text-sm text-muted">This is the start of the pod.</Text>
    </View>
  );
}

export default function PodScreen() {
  const { podId } = useLocalSearchParams<{ podId: string }>();
  const pod = usePod(podId);
  const hub = useHub(pod?.hubId);
  const stats = useHubStats(pod?.hubId ?? "");
  const messages = useHubsStore((s) => s.messages[podId ?? ""]);
  const typingId = useHubsStore((s) => s.typing[podId ?? ""]);
  const typer = useHubsStore((s) => (typingId ? s.members[typingId] : undefined));
  const markPodRead = useHubsStore((s) => s.markPodRead);
  const sendMessage = useHubsStore((s) => s.sendMessage);
  const togglePodMute = useHubsStore((s) => s.togglePodMute);

  const items = useMemo(() => buildChatItems(messages ?? [], ME_ID), [messages]);

  // Being in the pod means you have read it, including anything that arrives while you watch.
  useEffect(() => {
    if (podId) markPodRead(podId);
  }, [podId, messages?.length, markPodRead]);

  if (!pod || !hub) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
        <NotFound what="Pod" />
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: ChatItem }) =>
    item.type === "day" ? <DaySeparator label={item.label} /> : <MessageItem item={item} />;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader
        title={`# ${pod.name}`}
        subtitle={`${hub.name} · ${stats.online} online`}
        actions={
          <>
            <IconButton
              icon={pod.muted ? "notifications-off-outline" : "notifications-outline"}
              label={pod.muted ? "Unmute this pod" : "Mute this pod"}
              variant="plain"
              onPress={() => togglePodMute(pod.id)}
            />
            <IconButton
              icon="people-outline"
              label="See members"
              variant="plain"
              onPress={() => router.push(`/hub/${hub.id}/members`)}
            />
          </>
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {/* Inverted: the newest message sits at the bottom, and the header slot is the bottom edge. */}
        <FlatList
          inverted
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerClassName="py-2"
          ListHeaderComponent={typer ? <TypingIndicator member={typer} /> : undefined}
          ListFooterComponent={<PodIntro name={pod.name} description={pod.description} />}
          initialNumToRender={14}
          maxToRenderPerBatch={10}
          windowSize={9}
        />

        <Composer
          podName={pod.name}
          onSendText={(text) => sendMessage(pod.id, { kind: "text", text })}
          onSendVoice={(note) => sendMessage(pod.id, { kind: "voice", ...note })}
          onSendVideo={(note) => sendMessage(pod.id, { kind: "video", ...note })}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
