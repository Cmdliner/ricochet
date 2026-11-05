import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@/theme/theme-provider";
import { formatDuration } from "../format";

type VideoNoteCircleProps = {
  durationMs: number;
  size?: number;
  /** A video you have not watched yet gets a bright ring. */
  fresh?: boolean;
};

/** The round video note. Tapping plays it, which for now only shows the progress ring. */
export function VideoNoteCircle({ durationMs, size = 176, fresh = true }: VideoNoteCircleProps) {
  const { colors } = useTheme();
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [watched, setWatched] = useState(!fresh);

  useEffect(() => {
    if (!playing) return;
    const started = Date.now() - elapsed;
    const timer = setInterval(() => {
      const next = Date.now() - started;
      if (next >= durationMs) {
        setPlaying(false);
        setElapsed(0);
      } else {
        setElapsed(next);
      }
    }, 80);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, durationMs]);

  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ring = playing || elapsed > 0 ? colors.accent : watched ? colors.line : colors.accent;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={playing ? "Pause video note" : "Play video note"}
      onPress={() => {
        setPlaying((p) => !p);
        setWatched(true);
      }}
      style={{ width: size, height: size }}
      className="active:opacity-90"
    >
      <View style={{ width: size, height: size, borderRadius: size / 2 }} className="overflow-hidden bg-raised">
        {/* A friendly stand-in for the camera picture: a head and shoulders. */}
        <View
          style={{
            position: "absolute",
            top: size * 0.2,
            alignSelf: "center",
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: size * 0.15,
            backgroundColor: colors.line,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: size * 0.56,
            alignSelf: "center",
            width: size * 0.66,
            height: size * 0.6,
            borderTopLeftRadius: size * 0.33,
            borderTopRightRadius: size * 0.33,
            backgroundColor: colors.line,
          }}
        />
        <View className="absolute inset-0 items-center justify-center">
          <View className="size-12 items-center justify-center rounded-full bg-black/55">
            <Ionicons name={playing ? "pause" : "play"} size={22} color="#fff" style={{ marginLeft: playing ? 0 : 2 }} />
          </View>
        </View>
      </View>

      <Svg width={size} height={size} style={{ position: "absolute" }} pointerEvents="none">
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={ring} strokeWidth={stroke} fill="none" opacity={elapsed > 0 ? 0.3 : 1} />
        {elapsed > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - elapsed / durationMs)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>

      <View className="absolute bottom-3 self-center rounded-full bg-black/60 px-2.5 py-1">
        <Text className="text-xs font-sans-semibold text-white" style={{ fontVariant: ["tabular-nums"] }}>
          {formatDuration(playing || elapsed > 0 ? durationMs - elapsed : durationMs)}
        </Text>
      </View>
    </Pressable>
  );
}
