import { colors } from "@ricochet/shared";
import { Text, View } from "react-native";
import { useTheme } from "@/theme/theme-provider";

export function Wordmark({ size = 26 }: { size?: number }) {
  const { colors: theme } = useTheme();
  const letters = {
    fontFamily: "InterTight_700Bold",
    fontSize: size,
    lineHeight: size,
    letterSpacing: -size * 0.035,
    color: theme.ink,
    includeFontPadding: false,
  } as const;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Ricochet" style={{ flexDirection: "row", alignItems: "baseline" }}>
      <Text style={letters}>r</Text>
      <View style={{ marginLeft: size * 0.02 }}>
        {/* A dotless i, so the accent ball can sit where the dot would be. */}
        <Text style={letters}>ı</Text>
        <View
          style={{
            position: "absolute",
            top: size * 0.03,
            left: "50%",
            marginLeft: -size * 0.125,
            width: size * 0.25,
            height: size * 0.25,
            borderRadius: size * 0.125,
            backgroundColor: colors.accent,
          }}
        />
      </View>
      <Text style={letters}>cochet</Text>
    </View>
  );
}
