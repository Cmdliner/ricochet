import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Switch, View } from "react-native";
import { useTheme } from "@/theme/theme-provider";
import { PressableScale } from "./pressable-scale";
import { Text } from "./text";

type Icon = keyof typeof Ionicons.glyphMap;

type SettingRowProps = {
  icon: Icon;
  title: string;
  value?: string;
  toggle?: { value: boolean; onChange: (next: boolean) => void };
  onPress?: () => void;
  last?: boolean;
  trailing?: ReactNode;
};

export function SettingRow({ icon, title, value, toggle, onPress, last = false, trailing }: SettingRowProps) {
  const { colors } = useTheme();
  const body = (
    <View className="flex-row items-center gap-3.5 px-4 py-3.5">
      <View className="size-9 items-center justify-center rounded-xl bg-raised">
        <Ionicons name={icon} size={19} color={colors.ink} />
      </View>
      <Text className="flex-1 text-base font-sans-medium text-ink">{title}</Text>
      {toggle ? (
        <Switch
          accessibilityLabel={title}
          value={toggle.value}
          onValueChange={toggle.onChange}
          trackColor={{ false: colors.line, true: colors.accent }}
          thumbColor="#ffffff"
          ios_backgroundColor={colors.line}
        />
      ) : (
        <>
          {value ? (
            <Text className="max-w-[45%] text-sm text-muted" numberOfLines={1}>
              {value}
            </Text>
          ) : null}
          {trailing}
          {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
        </>
      )}
    </View>
  );

  return (
    <View>
      {onPress ? (
        <PressableScale accessibilityRole="button" accessibilityLabel={title} scaleTo={0.99} onPress={onPress}>
          {body}
        </PressableScale>
      ) : (
        body
      )}
      {last ? null : <View className="ml-[62px] h-px bg-line" />}
    </View>
  );
}

export function SettingGroup({ children }: { children: ReactNode }) {
  return <View className="overflow-hidden rounded-3xl border border-line bg-surface">{children}</View>;
}
