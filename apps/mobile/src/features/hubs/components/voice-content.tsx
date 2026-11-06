import { Ionicons } from "@expo/vector-icons";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/theme/theme-provider";
import { formatDuration } from "../format";
import { claimPlayback, releasePlayback } from "../media";
import { useHubsStore } from "../store";
import type { VoiceMessage } from "../types";
import { WaveformBars } from "./waveform-bars";

type VoiceContentProps = {
  message: VoiceMessage;
  mine: boolean;
};

export function VoiceContent({ message, mine }: VoiceContentProps) {
  const { colors } = useTheme();
  const refreshMedia = useHubsStore((s) => s.refreshMedia);
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [loading, setLoading] = useState(false);
  const unavailable = message.mediaStatus === "failed";

  const pause = useCallback(() => player.pause(), [player]);
  useEffect(() => () => releasePlayback(pause), [pause]);

  async function toggle() {
    if (status.playing) {
      pause();
      return;
    }
    claimPlayback(pause);

    // Playing from the start asks for a fresh link first, since the one this message arrived with expires. A paused note just resumes.
    const resuming = status.currentTime > 0 && !status.didJustFinish;
    if (!resuming) {
      setLoading(true);
      try {
        const url = await refreshMedia(message.podId, message.id);
        if (!url) return;
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
        player.replace({ uri: url });
      } finally {
        setLoading(false);
      }
    }
    player.play();
  }

  const totalMs = status.duration > 0 ? status.duration * 1000 : message.durationMs;
  const playedMs = status.currentTime * 1000;
  const progress = totalMs > 0 ? Math.min(1, playedMs / totalMs) : 0;
  const remaining = status.playing || playedMs > 0 ? Math.max(0, totalMs - playedMs) : message.durationMs;

  return (
    <View className="w-[236px] flex-row items-center gap-3 py-0.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={unavailable ? "Voice note unavailable" : status.playing ? "Pause voice note" : "Play voice note"}
        disabled={unavailable}
        onPress={() => void toggle()}
        className={`size-10 items-center justify-center rounded-full active:opacity-80 ${mine ? "bg-accent-ink" : "bg-accent"} ${unavailable ? "opacity-40" : ""}`}
      >
        {loading ? (
          <ActivityIndicator size="small" color={mine ? colors.accent : colors.accentInk} />
        ) : (
          <Ionicons
            name={unavailable ? "alert" : status.playing ? "pause" : "play"}
            size={18}
            color={mine ? colors.accent : colors.accentInk}
            style={{ marginLeft: status.playing || unavailable ? 0 : 2 }}
          />
        )}
      </Pressable>
      <WaveformBars
        bars={message.waveform.length > 0 ? message.waveform : Array.from({ length: 28 }, () => 30)}
        progress={progress}
        playedColor={mine ? colors.accentInk : colors.accent}
        idleColor={mine ? "rgba(31,12,5,0.35)" : `${colors.muted}66`}
        height={30}
      />
      <Text className={`w-9 text-right text-xs ${mine ? "text-accent-ink" : "text-muted"}`} style={{ fontVariant: ["tabular-nums"] }}>
        {formatDuration(remaining)}
      </Text>
    </View>
  );
}
