import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useHubsStore } from "../store";
import { ME_ID, type Reaction } from "../types";

type ReactionRowProps = {
  podId: string;
  messageId: string;
  reactions: Reaction[];
  mine: boolean;
};

export function ReactionRow({ podId, messageId, reactions, mine }: ReactionRowProps) {
  const toggleReaction = useHubsStore((s) => s.toggleReaction);
  if (reactions.length === 0) return null;

  return (
    <View className={`mt-1 flex-row flex-wrap gap-1.5 ${mine ? "justify-end" : ""}`}>
      {reactions.map((reaction) => {
        const reacted = reaction.userIds.includes(ME_ID);
        return (
          <Pressable
            key={reaction.emoji}
            accessibilityRole="button"
            accessibilityLabel={`${reaction.emoji} ${reaction.userIds.length}${reacted ? ", you reacted" : ""}`}
            onPress={() => toggleReaction(podId, messageId, reaction.emoji)}
            className={`h-7 flex-row items-center gap-1 rounded-full border px-2.5 active:opacity-70 ${
              reacted ? "border-accent bg-accent/15" : "border-line bg-surface"
            }`}
          >
            <Text className="text-[13px]">{reaction.emoji}</Text>
            <Text className={`text-xs font-sans-semibold ${reacted ? "text-accent-text" : "text-muted"}`}>{reaction.userIds.length}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
