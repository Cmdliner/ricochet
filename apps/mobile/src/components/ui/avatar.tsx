import { colors, type HubColor } from "@ricochet/shared";
import { useState } from "react";
import { Image, View } from "react-native";
import { Text } from "@/components/ui/text";

type AvatarProps = {
  name: string;
  color: HubColor;
  size?: number;
  square?: boolean;
  /** A profile photo. The coloured letter shows while it loads and if it fails. */
  uri?: string | null;
};

export function Avatar({ name, color, size = 40, square = false, uri }: AvatarProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  const radius = square ? size * 0.3 : size / 2;
  const showPhoto = !!uri && failed !== uri;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: colors.avatar[color],
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Text style={{ fontSize: size * 0.4, fontFamily: "Inter_700Bold", color: "#1f0c05" }}>{letter}</Text>
      {showPhoto ? (
        <Image
          source={{ uri }}
          onError={() => setFailed(uri)}
          style={{ position: "absolute", width: size, height: size }}
          resizeMode="cover"
        />
      ) : null}
    </View>
  );
}
