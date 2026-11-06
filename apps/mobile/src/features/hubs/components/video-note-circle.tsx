import { Ionicons } from "@expo/vector-icons";
import { useEvent, useEventListener } from "expo";
import { setAudioModeAsync } from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@/theme/theme-provider";
import { formatDuration } from "../format";
import { claimPlayback, releasePlayback } from "../media";
import { useHubsStore } from "../store";
import type { VideoMessage } from "../types";

type VideoNoteCircleProps = {
  message: VideoMessage;
  size?: number;
  fresh?: boolean;
};

export function VideoNoteCircle({ message, size = 176, fresh = true }: VideoNoteCircleProps) {
  const { colors } = useTheme();
  const refreshMedia = useHubsStore((s) => s.refreshMedia);
  const durationMs = message.durationMs;
  const player = useVideoPlayer(null);
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [watched, setWatched] = useState(!fresh);
  const processing = message.mediaStatus === "processing";
  const failed = message.mediaStatus === "failed";

  const pause = useCallback(() => player.pause(), [player]);
  useEffect(() => () => releasePlayback(pause), [pause]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => setElapsed(player.currentTime * 1000), 100);
    return () => clearInterval(timer);
  }, [isPlaying, player]);

  useEventListener(player, "playToEnd", () => {
    setActive(false);
    setElapsed(0);
  });

  async function toggle() {
    if (processing || failed) return;
    setWatched(true);
    if (isPlaying) {
      pause();
      return;
    }
    claimPlayback(pause);

    if (!active || elapsed === 0) {
      setLoading(true);
      try {
        const url = await refreshMedia(message.podId, message.id);
        if (!url) return;
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
        // The async version loads off the main thread. The plain `replace` can freeze the screen on iOS.
        await player.replaceAsync({ uri: url });
        setActive(true);
      } finally {
        setLoading(false);
      }
    }
    player.play();
  }

  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ring = isPlaying || elapsed > 0 ? colors.accent : watched ? colors.line : colors.accent;
  const shownMs = isPlaying || elapsed > 0 ? Math.max(0, durationMs - elapsed) : durationMs;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={failed ? "Video note unavailable" : processing ? "Video note is processing" : isPlaying ? "Pause video note" : "Play video note"}
      onPress={() => void toggle()}
      style={{ width: size, height: size }}
      className="active:opacity-90"
    >
      <View style={{ width: size, height: size, borderRadius: size / 2 }} className="overflow-hidden bg-raised">
        {active ? (
          <VideoView player={player} style={{ width: size, height: size }} contentFit="cover" nativeControls={false} />
        ) : message.posterUrl ? (
          <Image source={{ uri: message.posterUrl }} style={{ width: size, height: size }} resizeMode="cover" />
        ) : null}

        {!isPlaying ? (
          <View className="absolute inset-0 items-center justify-center">
            <View className="size-12 items-center justify-center rounded-full bg-black/55">
              {loading || processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name={failed ? "alert" : "play"} size={22} color="#fff" style={{ marginLeft: failed ? 0 : 2 }} />
              )}
            </View>
          </View>
        ) : null}
      </View>

      <Svg width={size} height={size} style={{ position: "absolute" }} pointerEvents="none">
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={ring} strokeWidth={stroke} fill="none" opacity={elapsed > 0 ? 0.3 : 1} />
        {elapsed > 0 && durationMs > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - Math.min(1, elapsed / durationMs))}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>

      <View className="absolute bottom-3 self-center rounded-full bg-black/60 px-2.5 py-1">
        <Text className="text-xs font-sans-semibold text-white" style={{ fontVariant: ["tabular-nums"] }}>
          {failed ? "Unavailable" : processing ? "Processing" : formatDuration(shownMs)}
        </Text>
      </View>
    </Pressable>
  );
}
