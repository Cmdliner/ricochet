import { colors } from "@ricochet/shared";
import * as Haptics from "expo-haptics";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// The Ricochet mark in its own units (the same shape as the logo): the ball comes down onto
// B, the path is drawn A to B to C, and the ball lands as the dot at D.
const A = { x: 7.5, y: 9 };
const B = { x: 14, y: 23 };
const C = { x: 22, y: 12 };
const D = { x: 25, y: 8.5 };
const BALL = 2.4;
const STROKE = 3.2;

const LEN1 = Math.hypot(B.x - A.x, B.y - A.y);
const LEN2 = Math.hypot(C.x - B.x, C.y - B.y);
const TOTAL = LEN1 + LEN2;
/** How far along the second leg the path ends, before the ball carries on to become the dot. */
const FRACTION_TO_C = LEN2 / Math.hypot(D.x - B.x, D.y - B.y);

const INK = colors.accentInk;

function impactHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
}

type AnimatedSplashProps = {
  /** True once the app has finished loading what it needs. The splash leaves after that. */
  ready: boolean;
  onFinish: () => void;
};

/**
 * Full-screen splash: a ball drops in, ricochets off the floor and draws the Ricochet mark.
 * The native splash is a plain accent colour, so this picks up exactly where it leaves off.
 */
export function AnimatedSplash({ ready, onFinish }: AnimatedSplashProps) {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const leg1 = useSharedValue(0);
  const leg2 = useSharedValue(0);
  const squash = useSharedValue(0);
  const ring = useSharedValue(0);
  const settle = useSharedValue(0);
  const word = useSharedValue(0);
  const exit = useSharedValue(0);
  const [played, setPlayed] = useState(false);

  // Scale the mark so it is bold on every screen, and work out where the ball enters from.
  const scene = useMemo(() => {
    const unit = (width * 0.6) / 24;
    const viewW = width / unit;
    const viewH = height / unit;
    const centre = { x: 16, y: 13 };
    const dir = { x: (B.x - A.x) / LEN1, y: (B.y - A.y) / LEN1 };
    const top = centre.y - viewH / 2 - 4;
    const back = (A.y - top) / dir.y;
    const start = { x: A.x - dir.x * back, y: top };
    const toB = Math.hypot(B.x - start.x, B.y - start.y);
    return {
      unit,
      viewBox: `${centre.x - viewW / 2} ${centre.y - viewH / 2} ${viewW} ${viewH}`,
      start,
      fractionToA: Math.hypot(A.x - start.x, A.y - start.y) / toB,
      wordTop: height / 2 + 15 * unit,
    };
  }, [width, height]);

  // The native splash can go as soon as this screen is on top of it.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      leg1.value = leg2.value = word.value = 1;
      const timer = setTimeout(() => setPlayed(true), 500);
      return () => clearTimeout(timer);
    }

    // Everything is scheduled on the UI thread, so a busy JavaScript thread cannot make it stutter.
    leg1.value = withDelay(150, withTiming(1, { duration: 650, easing: Easing.in(Easing.quad) }));
    squash.value = withDelay(790, withSequence(withTiming(1, { duration: 70 }), withSpring(0, { damping: 7, stiffness: 260 })));
    ring.value = withDelay(800, withTiming(1, { duration: 520, easing: Easing.out(Easing.quad) }));
    leg2.value = withDelay(800, withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }));
    settle.value = withDelay(1260, withSequence(withTiming(1, { duration: 110 }), withSpring(0, { damping: 9, stiffness: 240 })));
    word.value = withDelay(1050, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    // Hold the finished mark for a beat, then report that the animation has played.
    const timer = setTimeout(() => setPlayed(true), 1900);
    return () => clearTimeout(timer);
  }, [reduceMotion, leg1, leg2, squash, ring, settle, word]);

  // A tap on the floor, felt exactly when the ball lands.
  useAnimatedReaction(
    () => leg1.value >= 1,
    (landed, previous) => {
      if (landed && !previous) scheduleOnRN(impactHaptic);
    },
  );

  // Leave once the animation has played and the app is ready underneath.
  useEffect(() => {
    if (!played || !ready) return;
    exit.value = withTiming(1, { duration: 320, easing: Easing.in(Easing.quad) }, (finished) => {
      if (finished) scheduleOnRN(onFinish);
    });
  }, [played, ready, exit, onFinish]);

  const { start, fractionToA } = scene;

  const ballProps = useAnimatedProps(() => {
    const onSecondLeg = leg2.value > 0;
    const x = onSecondLeg ? B.x + (D.x - B.x) * leg2.value : start.x + (B.x - start.x) * leg1.value;
    const y = onSecondLeg ? B.y + (D.y - B.y) * leg2.value : start.y + (B.y - start.y) * leg1.value;
    return {
      cx: x,
      cy: y,
      rx: BALL * (1 + 0.55 * squash.value + 0.35 * settle.value),
      ry: BALL * (1 - 0.4 * squash.value + 0.35 * settle.value),
      opacity: leg1.value > 0 ? 1 : 0,
    };
  });

  const trailProps = useAnimatedProps(() => {
    const firstLeg = Math.min(Math.max((leg1.value - fractionToA) / (1 - fractionToA), 0), 1);
    const secondLeg = Math.min(leg2.value / FRACTION_TO_C, 1);
    const drawn = (LEN1 * firstLeg + LEN2 * secondLeg) / TOTAL;
    return { strokeDashoffset: TOTAL * (1 - drawn), opacity: drawn > 0 ? 1 : 0 };
  });

  const ringProps = useAnimatedProps(() => ({
    r: BALL + ring.value * 9,
    strokeOpacity: (1 - ring.value) * 0.55,
    opacity: ring.value > 0 ? 1 : 0,
  }));

  const stageStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.035 * squash.value }] }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: word.value, transform: [{ translateY: (1 - word.value) * 16 }] }));
  const exitStyle = useAnimatedStyle(() => ({ opacity: 1 - exit.value, transform: [{ scale: 1 + 0.06 * exit.value }] }));

  return (
    <Animated.View
      pointerEvents="auto"
      accessibilityRole="image"
      accessibilityLabel="Ricochet"
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.accent, zIndex: 100 }, exitStyle]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, stageStyle]}>
        <Svg width={width} height={height} viewBox={scene.viewBox}>
          <AnimatedCircle cx={B.x} cy={B.y} fill="none" stroke={INK} strokeWidth={0.5} animatedProps={ringProps} />
          <AnimatedPath
            d={`M${A.x} ${A.y} L${B.x} ${B.y} L${C.x} ${C.y}`}
            fill="none"
            stroke={INK}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${TOTAL} ${TOTAL}`}
            animatedProps={trailProps}
          />
          <AnimatedEllipse fill={INK} animatedProps={ballProps} />
        </Svg>
      </Animated.View>

      <Animated.Text
        style={[
          wordStyle,
          {
            position: "absolute",
            top: scene.wordTop,
            left: 0,
            right: 0,
            textAlign: "center",
            color: INK,
            fontSize: 44,
            fontWeight: "800",
            letterSpacing: -1.5,
          },
        ]}
      >
        ricochet
      </Animated.Text>
    </Animated.View>
  );
}
