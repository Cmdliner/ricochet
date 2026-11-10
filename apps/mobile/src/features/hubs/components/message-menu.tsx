import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { BackHandler, Platform, Pressable, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/theme/theme-provider";
import { useMessageMenu } from "../message-menu";
import { useReplyDraft } from "../reply";
import { useHubsStore } from "../store";
import { ME_ID } from "../types";

/** The quick reactions. Any emoji works on the server, these are just the ones within reach. */
const REACTIONS = ["👍", "❤️", "😂", "🔥", "😮", "🙏"];

function Panel({ podId, messageId }: { podId: string; messageId: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const close = useMessageMenu((s) => s.close);
  const toggleReaction = useHubsStore((s) => s.toggleReaction);
  const message = useHubsStore((s) => s.messages[podId]?.find((m) => m.id === messageId));
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = reduceMotion ? 1 : withSpring(1, { damping: 20, stiffness: 260 });
  }, [progress, reduceMotion]);

  const backdrop = useAnimatedStyle(() => ({ opacity: Math.min(progress.value, 1) * 0.5 }));
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * 80 }], opacity: Math.min(progress.value, 1) }));

  const dismiss = () => {
    progress.value = withTiming(0, { duration: 120, easing: Easing.in(Easing.quad) });
    close();
  };

  if (!message || message.kind === "system") return null;
  const text = message.kind === "text" ? message.text : null;
  const mine = (emoji: string) => message.reactions.find((r) => r.emoji === emoji)?.userIds.includes(ME_ID) ?? false;

  return (
    <View style={{ flex: 1, justifyContent: "flex-end" }}>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "#000" }, backdrop]} />
      <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={dismiss} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />

      <Animated.View
        accessibilityViewIsModal
        style={[
          { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 16), paddingHorizontal: 16 },
          panel,
        ]}
      >
        <View className="mb-3 items-center">
          <View style={{ backgroundColor: colors.line }} className="h-1.5 w-11 rounded-full" />
        </View>

        <View className="flex-row justify-between px-1 pb-3">
          {REACTIONS.map((emoji) => {
            const reacted = mine(emoji);
            return (
              <Pressable
                key={emoji}
                accessibilityRole="button"
                accessibilityLabel={`${reacted ? "Remove" : "React with"} ${emoji}`}
                accessibilityState={{ selected: reacted }}
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => undefined);
                  void toggleReaction(podId, messageId, emoji);
                  dismiss();
                }}
                className={`size-12 items-center justify-center rounded-full border-2 active:opacity-70 ${reacted ? "border-accent bg-accent/15" : "border-transparent bg-raised"}`}
              >
                <Text className="text-[24px]">{emoji}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void Haptics.selectionAsync().catch(() => undefined);
            useReplyDraft.getState().start(podId, messageId);
            dismiss();
          }}
          className="h-14 flex-row items-center gap-3 rounded-2xl px-3 active:bg-raised"
        >
          <Ionicons name="arrow-undo-outline" size={22} color={colors.ink} />
          <Text className="text-base font-sans-medium text-ink">Reply</Text>
        </Pressable>

        {text ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void Clipboard.setStringAsync(text);
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
              dismiss();
            }}
            className="h-14 flex-row items-center gap-3 rounded-2xl px-3 active:bg-raised"
          >
            <Ionicons name="copy-outline" size={22} color={colors.ink} />
            <Text className="text-base font-sans-medium text-ink">Copy text</Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const OVERLAY = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 1000, elevation: 1000 } as const;

/** The menu that opens when a message is held down. Mounted once, with the signed-in screens. Drawn in the app, not in a native Modal, so it keeps the theme on the web. */
export function MessageMenuHost() {
  const target = useMessageMenu((s) => s.target);
  const close = useMessageMenu((s) => s.close);

  useEffect(() => {
    if (!target || Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => subscription.remove();
  }, [target, close]);

  if (!target) return null;
  return (
    <View style={OVERLAY}>
      <Panel key={target.messageId} podId={target.podId} messageId={target.messageId} />
    </View>
  );
}
