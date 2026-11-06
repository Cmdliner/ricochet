import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useTheme } from "@/theme/theme-provider";

export function MailArt({ width = 300 }: { width?: number }) {
  const { colors: c } = useTheme();
  const dots = [0, 1, 2, 3, 4, 5];

  return (
    <Svg width={width} height={(width * 200) / 320} viewBox="0 0 320 200" accessibilityRole="image" accessibilityLabel="An envelope with a sign in code">
      <Circle cx={160} cy={108} r={82} fill={c.raised} />

      {/* The letter, partly out of the envelope */}
      <Rect x={96} y={26} width={128} height={96} rx={14} fill={c.surface} stroke={c.line} strokeWidth={2} />
      {dots.map((i) => (
        <Rect key={i} x={110 + i * 17} y={44} width={12} height={16} rx={4} fill={c.accent} opacity={0.35 + i * 0.13} />
      ))}
      <Rect x={110} y={72} width={72} height={6} rx={3} fill={c.line} />
      <Rect x={110} y={86} width={52} height={6} rx={3} fill={c.line} />

      {/* Envelope */}
      <Rect x={64} y={80} width={192} height={96} rx={20} fill={c.surface} stroke={c.line} strokeWidth={2} />
      <Path d="M70 92 L160 148 L250 92" fill="none" stroke={c.line} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {/* Delivered badge */}
      <Circle cx={248} cy={86} r={20} fill={c.accent} />
      <Path d="M239 86 L246 93 L258 79" fill="none" stroke={c.accentInk} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />

      {/* A dot bouncing in */}
      <Path d="M30 30 L58 76 L84 52" fill="none" stroke={c.accent} strokeWidth={3} strokeLinecap="round" strokeDasharray="1 9" />
      <Circle cx={92} cy={44} r={7} fill={c.accent} />

      <Path d="M270 30 h12 M276 24 v12" stroke={c.muted} strokeWidth={3} strokeLinecap="round" />
      <Path d="M40 140 h10 M45 135 v10" stroke={c.muted} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={286} cy={150} r={3} fill={c.muted} />
      <Circle cx={190} cy={16} r={3} fill={c.muted} />
    </Svg>
  );
}
