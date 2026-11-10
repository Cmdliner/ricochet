import { Ionicons } from "@expo/vector-icons";
import { LIMITS } from "@ricochet/shared";
import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { Camera, CameraView } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
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
import { useKeyboardState } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@/theme/theme-provider";
import { formatDuration } from "../format";
import { replyRefFor } from "../adapters";
import { useReplyDraft } from "../reply";
import { useHubsStore } from "../store";
import { activeMention, insertMention, suggestMembers } from "../mentions";
import type { Member } from "../types";
import { MentionSuggestions } from "./mention-suggestions";
import { quoteAuthor, quoteLabel } from "./reply-quote";

type Kind = "voice" | "video";
type Recording = { kind: Kind; elapsedMs: number; dx: number };

const CANCEL_DISTANCE = 90;
const BAR_COUNT = 28;

type ComposerProps = {
  /** The pod or chat this composer writes to. A reply in progress belongs to it. */
  conversationId: string;
  placeholder: string;
  /** The people who can be tagged here. Leave empty where tagging makes no sense, such as a private chat. */
  mentionables?: Member[];
  onSendText: (text: string) => void;
  onSendVoice: (note: { uri: string; durationMs: number; waveform: number[] }) => void;
  onSendVideo: (note: { uri: string; durationMs: number }) => void;
  onTyping?: (typing: boolean) => void;
};

function haptic(run: () => Promise<void>) {
  run().catch(() => undefined);
}

function toBars(levels: number[]): number[] {
  if (levels.length === 0) return Array.from({ length: BAR_COUNT }, () => 30 + Math.random() * 60);
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const from = Math.floor((i / BAR_COUNT) * levels.length);
    const to = Math.max(from + 1, Math.floor(((i + 1) / BAR_COUNT) * levels.length));
    const slice = levels.slice(from, to);
    return Math.round(slice.reduce((sum, v) => sum + v, 0) / slice.length);
  });
}

/** The recorder reports decibels, roughly -60 for quiet to 0 for as loud as it gets. The waveform wants 0 to 100. */
function levelOf(decibels: number | undefined): number {
  if (decibels === undefined) return 30;
  return Math.max(4, Math.min(100, ((decibels + 60) / 60) * 100));
}

type Access = "ready" | "asked" | "denied";

async function ensureAccess(kind: "voice" | "video"): Promise<Access> {
  const has = async () =>
    kind === "voice"
      ? (await getRecordingPermissionsAsync()).granted
      : (await Camera.getCameraPermissionsAsync()).granted && (await Camera.getMicrophonePermissionsAsync()).granted;
  if (await has()) return "ready";

  const granted =
    kind === "voice"
      ? (await requestRecordingPermissionsAsync()).granted
      : (await Camera.requestCameraPermissionsAsync()).granted && (await Camera.requestMicrophonePermissionsAsync()).granted;
  // The permission prompt takes the finger off the button, so the press that triggered it is over either way.
  return granted ? "asked" : "denied";
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

function Viewfinder({
  elapsedMs,
  cancelling,
  cameraRef,
  onReady,
}: {
  elapsedMs: number;
  cancelling: boolean;
  cameraRef: React.RefObject<CameraView | null>;
  onReady: () => void;
}) {
  const { colors } = useTheme();
  const size = 220;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View pointerEvents="none" className="absolute right-0 bottom-full left-0 items-center pb-5">
      <View style={{ width: size, height: size }} className={cancelling ? "opacity-40" : ""}>
        <View style={{ width: size, height: size, borderRadius: size / 2 }} className="overflow-hidden bg-raised">
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" mode="video" mirror onCameraReady={onReady} />
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

export function Composer({ conversationId, placeholder, mentionables, onSendText, onSendVoice, onSendVideo, onTyping }: ComposerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardState((s) => s.isVisible);
  const [text, setText] = useState("");
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const replyId = useReplyDraft((s) => s.targets[conversationId]);
  const clearReply = useReplyDraft((s) => s.clear);
  const quoted = useHubsStore((s) => (replyId ? s.messages[conversationId]?.find((m) => m.id === replyId) : undefined));
  const members = useHubsStore((s) => s.members);
  const replyRef = replyRefFor(quoted, members);

  // The cursor decides whether a tag is being typed: "hi @mi|" offers people, "hi @mira |" does not.
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [forcedSelection, setForcedSelection] = useState<{ start: number; end: number } | undefined>();
  const mention = mentionables && mentionables.length > 0 && selection.start === selection.end ? activeMention(text, selection.start) : null;
  const suggestions = mention ? suggestMembers(mentionables ?? [], mention.query) : [];

  function pickMention(member: Member) {
    if (!mention) return;
    const next = insertMention(text, selection.start, mention.start, member.handle);
    setText(next.text);
    // Tapping a suggestion takes focus away from the input on the web, so give it back, or the next keys go nowhere.
    setSelection({ start: next.cursor, end: next.cursor });
    setForcedSelection({ start: next.cursor, end: next.cursor });
    inputRef.current?.focus();
    onTyping?.(true);
  }

  useEffect(() => {
    if (replyId) inputRef.current?.focus();
  }, [replyId]);
  const [mode, setMode] = useState<Kind>("voice");
  const [recording, setRecording] = useState<Recording | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const cameraRef = useRef<CameraView>(null);
  const session = useRef<{
    kind: Kind;
    startedAt: number;
    levels: number[];
    timer: ReturnType<typeof setInterval>;
    video?: Promise<{ uri: string } | undefined>;
  } | null>(null);
  /** True while the finger is down. Asking for permission or preparing the recorder takes a moment, and the person may let go in that time. */
  const held = useRef(false);
  const starting = useRef(false);
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

  const finish = useCallback(
    async (cancelled: boolean) => {
      const current = session.current;
      if (!current) return;
      clearInterval(current.timer);
      session.current = null;
      const durationMs = Date.now() - current.startedAt;
      setRecording(null);

      let uri: string | undefined;
      try {
        if (current.kind === "voice") {
          await recorder.stop();
          uri = recorder.uri ?? undefined;
          await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
        } else {
          cameraRef.current?.stopRecording();
          uri = (await current.video)?.uri;
        }
      } catch {
        uri = undefined;
      }

      if (cancelled) {
        haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
        return;
      }
      if (durationMs < LIMITS.minRecordingMs) {
        flashHint("Hold to record, release to send.");
        return;
      }
      if (!uri) {
        flashHint("Could not record that. Try again.");
        return;
      }
      haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
      if (current.kind === "voice") onSendVoice({ uri, durationMs, waveform: toBars(current.levels) });
      else onSendVideo({ uri, durationMs });
    },
    [flashHint, onSendVoice, onSendVideo, recorder],
  );

  const stop = useCallback(
    (cancelled: boolean) => {
      held.current = false;
      void finish(cancelled);
    },
    [finish],
  );

  const start = useCallback(
    async (kind: Kind) => {
      held.current = true;
      if (session.current || starting.current) return;
      starting.current = true;
      try {
        const access = await ensureAccess(kind);
        if (access === "denied") {
          flashHint(kind === "voice" ? "Allow microphone access in Settings to record." : "Allow camera and microphone access in Settings to record.");
          return;
        }
        if (access === "asked") {
          flashHint("All set. Now hold to record.");
          return;
        }
        if (!held.current) return;

        if (kind === "voice") {
          await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
          await recorder.prepareToRecordAsync();
          if (!held.current) return;
          recorder.record();
        }

        const timer = setInterval(() => {
          const live = session.current;
          if (!live) return;
          const elapsedMs = Date.now() - live.startedAt;
          if (live.kind === "voice") live.levels.push(levelOf(recorder.getStatus().metering));
          const cap = live.kind === "voice" ? LIMITS.voiceNoteMaxMs : LIMITS.videoNoteMaxMs;
          if (elapsedMs >= cap) handlers.current.stop(false);
          else setRecording((r) => (r ? { ...r, elapsedMs } : r));
        }, 100);
        session.current = { kind, startedAt: Date.now(), levels: [], timer };
        setRecording({ kind, elapsedMs: 0, dx: 0 });
        haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
      } catch {
        flashHint("Could not start recording.");
      } finally {
        starting.current = false;
      }
    },
    [flashHint, recorder],
  );

  /** The camera takes a moment to come up. Recording, and the clock, start when it does. */
  const beginVideo = useCallback(() => {
    const live = session.current;
    if (!live || live.kind !== "video" || live.video) return;
    live.startedAt = Date.now();
    live.video = cameraRef.current?.recordAsync({ maxDuration: LIMITS.videoNoteMaxMs / 1000 });
  }, []);

  useEffect(() => {
    handlers.current = { start: (kind) => void start(kind), stop, mode };
  }, [start, stop, mode]);

  useEffect(
    () => () => {
      if (session.current) {
        clearInterval(session.current.timer);
        if (session.current.kind === "voice") void recorder.stop().catch(() => undefined);
        else cameraRef.current?.stopRecording();
      }
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [recorder],
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
    onTyping?.(false);
  }

  return (
    <View className="border-t border-line bg-canvas px-3 pt-2" style={{ paddingBottom: keyboardOpen ? 10 : Math.max(insets.bottom, 10) }}>
      {hint ? (
        <View pointerEvents="none" className="absolute right-0 bottom-full left-0 items-center pb-2">
          <Text className="rounded-full bg-ink px-4 py-2 text-sm font-sans-medium text-canvas">{hint}</Text>
        </View>
      ) : null}
      {recording?.kind === "video" ? <Viewfinder elapsedMs={recording.elapsedMs} cancelling={cancelling} cameraRef={cameraRef} onReady={beginVideo} /> : null}

      <MentionSuggestions people={recording ? [] : suggestions} onPick={pickMention} />

      {replyRef ? (
        <View className="mb-2 flex-row items-center gap-3 rounded-2xl bg-raised py-2 pr-1.5 pl-3">
          <View className="h-9 w-1 rounded-full bg-accent" />
          <View className="flex-1">
            <Text className="text-xs font-sans-semibold text-ink" numberOfLines={1}>
              Replying to {quoteAuthor(replyRef) === "You" ? "yourself" : quoteAuthor(replyRef)}
            </Text>
            <Text className="text-sm text-muted" numberOfLines={1}>
              {quoteLabel(replyRef)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel reply"
            hitSlop={8}
            onPress={() => clearReply(conversationId)}
            className="size-9 items-center justify-center rounded-full active:bg-line"
          >
            <Ionicons name="close" size={20} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

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
              ref={inputRef}
              accessibilityLabel={placeholder}
              value={text}
              selection={forcedSelection}
              onSelectionChange={(event) => {
                const next = event.nativeEvent.selection;
                setSelection(next);
                if (forcedSelection && next.start === forcedSelection.start) setForcedSelection(undefined);
              }}
              onChangeText={(value) => {
                setText(value);
                setForcedSelection(undefined);
                onTyping?.(value.trim().length > 0);
              }}
              placeholder={placeholder}
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
