import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/theme/theme-provider";
import { Button } from "./button";
import { Text } from "./text";

type Hint = { icon: keyof typeof Ionicons.glyphMap; label: string };

type EmptyStateProps = {
  art: ReactNode;
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
  hints?: Hint[];
};

export function EmptyState({ art, title, body, action, secondary, hints }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    // className does not reach Reanimated views, so the layout lives on a plain View inside.
    <Animated.View entering={FadeInDown.duration(420)} style={{ width: "100%" }}>
      <View className="w-full items-center px-8 pt-6 pb-10">
        <View className="mb-6">{art}</View>
        <Text className="text-center font-display text-[24px] tracking-tight text-ink">{title}</Text>
        <Text className="mt-2 max-w-[300px] text-center text-base leading-6 text-muted">{body}</Text>

        {hints?.length ? (
          <View className="mt-6 flex-row flex-wrap justify-center gap-2">
            {hints.map((hint) => (
              <View key={hint.label} className="flex-row items-center gap-1.5 rounded-full border border-line bg-surface py-1.5 pr-3 pl-2.5">
                <Ionicons name={hint.icon} size={15} color={colors.accent} />
                <Text className="text-sm font-sans-medium text-ink">{hint.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {action || secondary ? (
          <View className="mt-8 w-full max-w-[300px] gap-2">
            {action ? <Button label={action.label} onPress={action.onPress} /> : null}
            {secondary ? <Button label={secondary.label} variant="ghost" className="border border-line" onPress={secondary.onPress} /> : null}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}
