import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "@/theme/theme-provider";
import { formatDuration } from "../format";
import { WaveformBars } from "./waveform-bars";

type VoiceContentProps = {
  durationMs: number;
  waveform: number[];
  /** Your own notes sit on the accent colour, so they use dark controls. */
  mine: boolean;
};

/** A voice note you can play. For now it only animates: real audio arrives with the API. */
export function VoiceContent({ durationMs, waveform, mine }: VoiceContentProps) {
  const { colors } = useTheme();
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

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
    // `elapsed` is read only to resume from where we paused, so it is not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, durationMs]);

  const progress = elapsed / durationMs;
  const remaining = playing || elapsed > 0 ? durationMs - elapsed : durationMs;

  return (
    <View className="w-[236px] flex-row items-center gap-3 py-0.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? "Pause voice note" : "Play voice note"}
        onPress={() => setPlaying((p) => !p)}
        className={`size-10 items-center justify-center rounded-full active:opacity-80 ${mine ? "bg-accent-ink" : "bg-accent"}`}
      >
        <Ionicons name={playing ? "pause" : "play"} size={18} color={mine ? colors.accent : colors.accentInk} style={{ marginLeft: playing ? 0 : 2 }} />
      </Pressable>
      <WaveformBars
        bars={waveform}
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
