import { Ionicons } from "@expo/vector-icons";
import { colors, defaultHubIcon, type HubColor, type HubIcon } from "@ricochet/shared";
import { View } from "react-native";

type HubAvatarProps = {
  name: string;
  color: HubColor;
  icon?: HubIcon;
  size?: number;
};

export function HubAvatar({ name, color, icon, size = 54 }: HubAvatarProps) {
  const glyph = icon ?? defaultHubIcon(name);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: colors.avatar[color],
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          position: "absolute",
          top: -size * 0.22,
          right: -size * 0.18,
          width: size * 0.66,
          height: size * 0.66,
          borderRadius: size * 0.33,
          backgroundColor: "rgba(255,255,255,0.28)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -size * 0.26,
          left: -size * 0.2,
          width: size * 0.7,
          height: size * 0.7,
          borderRadius: size * 0.35,
          backgroundColor: "rgba(31,12,5,0.1)",
        }}
      />
      <Ionicons name={glyph} size={size * 0.5} color={colors.accentInk} />
    </View>
  );
}
