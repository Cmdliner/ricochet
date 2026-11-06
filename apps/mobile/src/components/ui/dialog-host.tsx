import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { BackHandler, Platform, Pressable, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useDialogStore, type DialogButton, type DialogContent } from "@/lib/dialog";
import { useTheme } from "@/theme/theme-provider";
import { PressableScale } from "./pressable-scale";
import { Text } from "./text";

function DialogCard({ dialog, onClose }: { dialog: DialogContent; onClose: (button?: DialogButton) => void }) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = reduceMotion ? 1 : withSpring(1, { damping: 18, stiffness: 240 });
  }, [dialog.id, progress, reduceMotion]);

  const backdrop = useAnimatedStyle(() => ({ opacity: Math.min(progress.value, 1) * 0.55 }));
  const card = useAnimatedStyle(() => ({ opacity: Math.min(progress.value, 1), transform: [{ scale: 0.92 + 0.08 * progress.value }] }));

  const cancel = dialog.buttons.find((button) => button.style === "cancel");
  const actions = dialog.buttons.filter((button) => button.style !== "cancel");
  const destructive = actions.some((button) => button.style === "destructive");
  const sideBySide = actions.length === 1 && !!cancel;

  const choose = (button: DialogButton) => {
    progress.value = withTiming(0, { duration: 120, easing: Easing.in(Easing.quad) });
    onClose(button);
  };

  const renderAction = (button: DialogButton, grow: boolean) => {
    const bad = button.style === "destructive";
    return (
      <PressableScale
        key={button.text}
        accessibilityRole="button"
        onPress={() => choose(button)}
        scaleTo={0.97}
        className={`h-12 items-center justify-center rounded-full px-5 ${grow ? "flex-1" : ""} ${bad ? "bg-danger" : "bg-accent"}`}
      >
        <Text className={`text-[15px] font-sans-semibold ${bad ? "text-white" : "text-accent-ink"}`}>{button.text}</Text>
      </PressableScale>
    );
  };

  const renderCancel = (button: DialogButton, grow: boolean) => (
    <PressableScale
      key={button.text}
      accessibilityRole="button"
      onPress={() => choose(button)}
      scaleTo={0.97}
      className={`h-12 items-center justify-center rounded-full border border-line px-5 ${grow ? "flex-1" : ""}`}
    >
      <Text className="text-[15px] font-sans-semibold text-ink">{button.text}</Text>
    </PressableScale>
  );

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "#000" }, backdrop]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        onPress={() => choose(cancel ?? { text: "" })}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <Animated.View
        accessibilityViewIsModal
        style={[{ width: "100%", maxWidth: 340, borderRadius: 28, backgroundColor: colors.surface, padding: 24 }, card]}
      >
        <View
          className={`mb-4 size-12 items-center justify-center rounded-full ${destructive ? "bg-danger/10" : "bg-raised"}`}
        >
          <Ionicons name={destructive ? "warning" : "information-circle"} size={26} color={destructive ? colors.danger : colors.accentText} />
        </View>
        <Text accessibilityRole="header" className="font-display text-[22px] leading-7 tracking-tight text-ink">
          {dialog.title}
        </Text>
        {dialog.message ? <Text className="mt-2 text-[15px] leading-[22px] text-muted">{dialog.message}</Text> : null}

        <View className="mt-6 gap-2.5">
          {sideBySide ? (
            <View className="flex-row gap-2.5">
              {cancel ? renderCancel(cancel, true) : null}
              {actions[0] ? renderAction(actions[0], true) : null}
            </View>
          ) : (
            <>
              {actions.map((button) => renderAction(button, false))}
              {cancel ? renderCancel(cancel, false) : null}
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * Draws whichever dialog `showDialog` asked for. Mounted once, at the top of the app.
 *
 * It is drawn inside the app rather than in a native `Modal`, because a Modal sits outside the theme on the web and
 * would lose the app's colours.
 */
export function DialogHost() {
  const current = useDialogStore((s) => s.current);
  const close = useDialogStore((s) => s.close);
  const cancel = current?.buttons.find((button) => button.style === "cancel");

  const onClose = (button?: DialogButton) => {
    close();
    button?.onPress?.();
  };

  // The Android back button answers the dialog instead of leaving the screen behind it.
  useEffect(() => {
    if (!current || Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      cancel?.onPress?.();
      return true;
    });
    return () => subscription.remove();
  }, [current, cancel, close]);

  if (!current) return null;
  return (
    <View style={OVERLAY}>
      <DialogCard key={current.id} dialog={current} onClose={onClose} />
    </View>
  );
}

const OVERLAY = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 1000, elevation: 1000 } as const;
