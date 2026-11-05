import { useEffect } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Avatar } from "@/components/ui/avatar";
import { useTheme } from "@/theme/theme-provider";
import type { Member } from "../types";

function Dot({ delay }: { delay: number }) {
  const { colors } = useTheme();
  const lift = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    lift.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: 260 }),
        ),
        -1,
      ),
    );
  }, [delay, lift, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: 0.4 + lift.value * 0.6, transform: [{ translateY: -4 * lift.value }] }));
  return <Animated.View style={[style, { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.muted }]} />;
}

/** "Mira is typing" with three bouncing dots, shown at the bottom of the chat. */
export function TypingIndicator({ member }: { member: Member }) {
  return (
    <View accessibilityLabel={`${member.name} is typing`} accessibilityLiveRegion="polite" className="mb-3 flex-row items-end gap-2 px-3">
      <Avatar name={member.name} color={member.color} size={32} />
      <View className="gap-1">
        <Text className="ml-3 text-xs font-sans-semibold text-muted">{member.name.split(" ")[0]} is typing</Text>
        <View className="h-10 flex-row items-center gap-1.5 self-start rounded-[20px] rounded-bl-md bg-raised px-4">
          <Dot delay={0} />
          <Dot delay={140} />
          <Dot delay={280} />
        </View>
      </View>
    </View>
  );
}
