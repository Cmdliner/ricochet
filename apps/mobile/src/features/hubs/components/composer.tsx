import { Ionicons } from "@expo/vector-icons";
import { LIMITS } from "@ricochet/shared";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, Pressable, TextInput, View } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@/theme/theme-provider";
import { formatDuration } from "../format";

type Kind = "voice" | "video";
type Recording = { kind: Kind; elapsedMs: number; dx: number };

/** How far left a finger must slide before releasing throws the recording away. */
const CANCEL_DISTANCE = 90;
const BAR_COUNT = 28;

type ComposerProps = {
  podName: string;
  onSendText: (text: string) => void;
  onSendVoice: (note: { durationMs: number; waveform: number[] }) => void;
  onSendVideo: (note: { durationMs: number }) => void;
};

function haptic(run: () => Promise<void>) {
  run().catch(() => undefined);
}

/** Squashes the loudness samples taken while recording down to the bars we draw. */
function toBars(levels: number[]): number[] {
  if (levels.length === 0) return Array.from({ length: BAR_COUNT }, () => 30 + Math.random() * 60);
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const from = Math.floor((i / BAR_COUNT) * levels.length);
    const to = Math.max(from + 1, Math.floor(((i + 1) / BAR_COUNT) * levels.length));
    const slice = levels.slice(from, to);
    return Math.round(slice.reduce((sum, v) => sum + v, 0) / slice.length);
  });
}

function RecordingDot() {
  const { colors } = useTheme();
  const pulse = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(
      withSequence(withTiming(0.25, { duration: 520, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: 520 })),
      -1,
    );
  }, [pulse, reduceMotion]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <Animated.View style={[style, { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.danger }]} />;
}

/** The round camera preview that appears above the composer while a video note records. */
function Viewfinder({ elapsedMs, cancelling }: { elapsedMs: number; cancelling: boolean }) {
  const { colors } = useTheme();
  const size = 220;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View pointerEvents="none" className="absolute right-0 bottom-full left-0 items-center pb-5">
      <View style={{ width: size, height: size }} className={cancelling ? "opacity-40" : ""}>
        <View style={{ width: size, height: size, borderRadius: size / 2 }} className="overflow-hidden bg-raised">
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
        </View>
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.line} strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={cancelling ? colors.danger : colors.accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - Math.min(elapsedMs / LIMITS.videoNoteMaxMs, 1))}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View className="absolute top-4 flex-row items-center gap-1.5 self-center rounded-full bg-black/55 px-2.5 py-1">
          <RecordingDot />
          <Text className="text-xs font-sans-semibold text-white">REC</Text>
        </View>
      </View>
    </View>
  );
}

export function Composer({ podName, onSendText, onSendVoice, onSendVideo }: ComposerProps) {
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Kind>("voice");
  const [recording, setRecording] = useState<Recording | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const session = useRef<{ kind: Kind; startedAt: number; levels: number[]; timer: ReturnType<typeof setInterval> } | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlers = useRef<{ start: (kind: Kind) => void; stop: (cancelled: boolean) => void; mode: Kind }>({
    start: () => undefined,
    stop: () => undefined,
    mode,
  });

  const flashHint = useCallback((message: string) => {
    setHint(message);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), 2200);
  }, []);

  const stop = useCallback(
    (cancelled: boolean) => {
      const current = session.current;
      if (!current) return;
      clearInterval(current.timer);
      session.current = null;
      const durationMs = Date.now() - current.startedAt;
      setRecording(null);

      if (cancelled) {
        haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
        return;
      }
      if (durationMs < LIMITS.minRecordingMs) {
        flashHint("Hold to record, release to send.");
        return;
      }
      haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
      if (current.kind === "voice") onSendVoice({ durationMs, waveform: toBars(current.levels) });
      else onSendVideo({ durationMs });
    },
    [flashHint, onSendVoice, onSendVideo],
  );

  const start = useCallback((kind: Kind) => {
    if (session.current) return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const live = session.current;
      if (!live) return;
      const elapsedMs = Date.now() - live.startedAt;
      live.levels.push(20 + Math.random() * 80); // stands in for the microphone level until audio is wired up
      const cap = live.kind === "voice" ? LIMITS.voiceNoteMaxMs : LIMITS.videoNoteMaxMs;
      if (elapsedMs >= cap) handlers.current.stop(false);
      else setRecording((r) => (r ? { ...r, elapsedMs } : r));
    }, 100);
    session.current = { kind, startedAt, levels: [], timer };
    setRecording({ kind, elapsedMs: 0, dx: 0 });
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  }, []);

  useEffect(() => {
    handlers.current = { start, stop, mode };
  }, [start, stop, mode]);

  // Never leave a timer running if the screen closes mid-recording.
  useEffect(
    () => () => {
      if (session.current) clearInterval(session.current.timer);
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => handlers.current.start(handlers.current.mode),
        onPanResponderMove: (_, gesture) => setRecording((r) => (r ? { ...r, dx: gesture.dx } : r)),
        onPanResponderRelease: (_, gesture) => handlers.current.stop(gesture.dx < -CANCEL_DISTANCE),
        onPanResponderTerminate: () => handlers.current.stop(true),
      }),
    [],
  );

  const grow = useSharedValue(1);
  useEffect(() => {
    grow.value = withSpring(recording ? 1.3 : 1, { damping: 12, stiffness: 220 });
  }, [recording, grow]);
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: grow.value }] }));

  const hasText = text.trim().length > 0;
  const cancelling = !!recording && recording.dx < -CANCEL_DISTANCE;
  const otherMode: Kind = mode === "voice" ? "video" : "voice";

  function send() {
    const value = text.trim();
    if (!value) return;
    onSendText(value);
    setText("");
  }

  return (
    <View className="border-t border-line bg-canvas px-3 pt-2 pb-2">
      {hint ? (
        <View pointerEvents="none" className="absolute right-0 bottom-full left-0 items-center pb-2">
          <Text className="rounded-full bg-ink px-4 py-2 text-sm font-sans-medium text-canvas">{hint}</Text>
        </View>
      ) : null}
      {recording?.kind === "video" ? <Viewfinder elapsedMs={recording.elapsedMs} cancelling={cancelling} /> : null}

      <View className="flex-row items-end gap-2">
        {recording ? (
          <View className="h-12 flex-1 flex-row items-center gap-3 rounded-full bg-raised px-4">
            <RecordingDot />
            <Text className="w-11 text-base font-sans-semibold text-ink" style={{ fontVariant: ["tabular-nums"] }}>
              {formatDuration(recording.elapsedMs)}
            </Text>
            <View className="flex-1 flex-row items-center justify-end gap-1" style={{ transform: [{ translateX: Math.min(0, recording.dx * 0.35) }] }}>
              <Ionicons name="chevron-back" size={16} color={cancelling ? colors.danger : colors.muted} />
              <Text className={`text-sm ${cancelling ? "font-sans-semibold text-danger" : "text-muted"}`}>
                {cancelling ? "Release to cancel" : "Slide to cancel"}
              </Text>
            </View>
          </View>
        ) : (
          <View className="min-h-12 flex-1 flex-row items-end rounded-3xl bg-raised pr-1.5 pl-4">
            <TextInput
              accessibilityLabel={`Message ${podName}`}
              value={text}
              onChangeText={setText}
              placeholder={`Message #${podName}`}
              placeholderTextColor={colors.muted}
              selectionColor={colors.accent}
              multiline
              numberOfLines={1}
              maxLength={LIMITS.messageBodyMax}
              className="max-h-32 min-h-12 flex-1 py-3 font-sans text-base text-ink"
            />
            {!hasText ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${otherMode} notes`}
                hitSlop={6}
                onPress={() => setMode(otherMode)}
                className="mb-1.5 size-9 items-center justify-center rounded-full active:bg-raised"
              >
                <Ionicons name={otherMode === "video" ? "videocam-outline" : "mic-outline"} size={20} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        )}

        {hasText && !recording ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={send}
            className="size-12 items-center justify-center rounded-full bg-accent active:opacity-80"
          >
            <Ionicons name="arrow-up" size={24} color={colors.accentInk} />
          </Pressable>
        ) : (
          <Animated.View
            {...pan.panHandlers}
            accessibilityRole="button"
            accessibilityLabel={`Hold to record a ${mode} note`}
            style={[
              buttonStyle,
              {
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: cancelling ? colors.danger : colors.accent,
              },
            ]}
          >
            <Ionicons name={mode === "voice" ? "mic" : "videocam"} size={22} color={colors.accentInk} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}
