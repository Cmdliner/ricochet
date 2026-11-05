import { colors, type HubColor } from "@ricochet/shared";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

type AvatarProps = {
  name: string;
  color: HubColor;
  size?: number;
  /** Hubs use rounded squares, people use circles. */
  square?: boolean;
};

export function Avatar({ name, color, size = 40, square = false }: AvatarProps) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: square ? size * 0.3 : size / 2,
        backgroundColor: colors.avatar[color],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.4, fontFamily: "Inter_700Bold", color: "#1f0c05" }}>{letter}</Text>
    </View>
  );
}
