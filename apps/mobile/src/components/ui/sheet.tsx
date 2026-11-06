import { router } from "expo-router";
import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { PanResponder, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "@/theme/theme-provider";
import { IconButton } from "./icon-button";
import { Text } from "./text";

type SheetProps = {
  title?: string;
  children: ReactNode;
  scroll?: boolean;
};

function dismiss() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

export function Sheet({ title, children, scroll = true }: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const progress = useSharedValue(0);
  const drag = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const close = useCallback(() => {
    progress.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) }, (finished) => {
      if (finished) scheduleOnRN(dismiss);
    });
  }, [progress]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, g) => {
          drag.value = Math.max(0, g.dy);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 110 || g.vy > 0.9) {
            drag.value = withTiming(screenHeight, { duration: 200 }, (finished) => {
              if (finished) scheduleOnRN(dismiss);
            });
          } else {
            drag.value = withSpring(0, { damping: 18, stiffness: 260 });
          }
        },
        onPanResponderTerminate: () => {
          drag.value = withSpring(0);
        },
      }),
    [drag, screenHeight],
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.6 * (1 - Math.min(drag.value / screenHeight, 1)),
  }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * screenHeight + drag.value }],
  }));

  const body = scroll ? (
    <ScrollView
      style={{ flexGrow: 0 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 12 }}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <View style={{ flex: 1, justifyContent: "flex-end" }}>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "#000" }, backdropStyle]} />
      <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />

      <KeyboardAvoidingView behavior="padding" pointerEvents="box-none">
        <Animated.View
          style={[
            {
              maxHeight: screenHeight * 0.9,
              backgroundColor: colors.surface,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingBottom: Math.max(insets.bottom, 16),
              overflow: "hidden",
            },
            panelStyle,
          ]}
        >
          <View {...pan.panHandlers} className="items-center pt-3 pb-1">
            <View style={{ backgroundColor: colors.line }} className="h-1.5 w-11 rounded-full" />
          </View>
          <View className="flex-row items-center justify-between px-6 pt-2 pb-3">
            <Text className="font-display text-[22px] tracking-tight text-ink">{title ?? ""}</Text>
            <IconButton icon="close" label="Close" variant="filled" size={36} onPress={close} />
          </View>
          <View className="shrink px-6">{body}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
