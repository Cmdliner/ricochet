import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { FlatList, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import { NotFound } from "@/components/ui/not-found";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Text } from "@/components/ui/text";
import { buildChatItems } from "@/features/hubs/chat-items";
import { Composer } from "@/features/hubs/components/composer";
import { DaySeparator } from "@/features/hubs/components/day-separator";
import { MessageItem } from "@/features/hubs/components/message-item";
import { TypingIndicator } from "@/features/hubs/components/typing-indicator";
import { useHubsStore } from "@/features/hubs/store";
import { ME_ID, type ChatItem } from "@/features/hubs/types";

/** The top of a private chat, above the first message. */
function ChatIntro({ name, handle, color }: { name: string; handle: string; color: Parameters<typeof Avatar>[0]["color"] }) {
  return (
    <View className="items-center gap-2 px-8 py-10">
      <Avatar name={name} color={color} size={84} />
      <Text className="mt-2 font-display text-[22px] text-ink">{name}</Text>
      <Text className="text-muted">@{handle}</Text>
      <Text className="mt-1 max-w-[260px] text-center text-sm text-muted">
        This is the start of your private chat. Messages, voice notes and video notes stay between the two of you.
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const chat = useHubsStore((s) => s.chats.find((c) => c.id === chatId));
  const person = useHubsStore((s) => (chat ? s.members[chat.personId] : undefined));
  const messages = useHubsStore((s) => s.messages[chatId ?? ""]);
  const typing = useHubsStore((s) => s.typing[chatId ?? ""]);
  const markPodRead = useHubsStore((s) => s.markPodRead);
  const sendMessage = useHubsStore((s) => s.sendMessage);
  const toggleChatMute = useHubsStore((s) => s.toggleChatMute);

  const items = useMemo(() => buildChatItems(messages ?? [], ME_ID), [messages]);

  useEffect(() => {
    if (chatId) markPodRead(chatId);
  }, [chatId, messages?.length, markPodRead]);

  if (!chat || !person) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
        <NotFound what="Chat" />
      </SafeAreaView>
    );
  }

  const first = person.name.split(" ")[0] ?? person.name;
  const renderItem = ({ item }: { item: ChatItem }) =>
    item.type === "day" ? <DaySeparator label={item.label} /> : <MessageItem item={item} direct />;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader
        title={person.name}
        subtitle={typing ? "typing…" : person.online ? "Online" : "Offline"}
        leading={
          <View>
            <Avatar name={person.name} color={person.color} size={40} />
            {person.online ? <View className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-canvas bg-online" /> : null}
          </View>
        }
        actions={
          <IconButton
            icon={chat.muted ? "notifications-off-outline" : "notifications-outline"}
            label={chat.muted ? "Unmute this chat" : "Mute this chat"}
            variant="plain"
            onPress={() => toggleChatMute(chat.id)}
          />
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <FlatList
          inverted
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerClassName="py-2"
          ListHeaderComponent={typing ? <TypingIndicator member={person} /> : undefined}
          ListFooterComponent={<ChatIntro name={person.name} handle={person.handle} color={person.color} />}
          initialNumToRender={14}
          maxToRenderPerBatch={10}
          windowSize={9}
        />

        <Composer
          placeholder={`Message ${first}`}
          onSendText={(text) => sendMessage(chat.id, { kind: "text", text })}
          onSendVoice={(note) => sendMessage(chat.id, { kind: "voice", ...note })}
          onSendVideo={(note) => sendMessage(chat.id, { kind: "video", ...note })}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
