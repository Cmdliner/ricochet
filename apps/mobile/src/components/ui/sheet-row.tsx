import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useTheme } from "@/theme/theme-provider";
import { PressableScale } from "./pressable-scale";
import { Text } from "./text";

type SheetRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function SheetRow({ icon, title, subtitle, onPress }: SheetRowProps) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      className="flex-row items-center gap-4 rounded-3xl bg-raised p-4"
    >
      <View className="size-12 items-center justify-center rounded-2xl bg-accent">
        <Ionicons name={icon} size={24} color={colors.accentInk} />
      </View>
      <View className="flex-1">
        <Text className="text-[17px] font-sans-semibold text-ink">{title}</Text>
        <Text className="text-sm text-muted">{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </PressableScale>
  );
}
