import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { useTheme } from "@/theme/theme-provider";

export function WelcomeArt({ width = 300 }: { width?: number }) {
  const { colors: c } = useTheme();
  const bars = [10, 18, 12, 24, 16, 8, 20, 14];

  return (
    <Svg width={width} height={(width * 200) / 320} viewBox="0 0 320 200" accessibilityRole="image" accessibilityLabel="A message bouncing between chat bubbles">
      <Circle cx={162} cy={112} r={82} fill={c.raised} />

      {/* The ricochet: down onto the bubble, then up and away */}
      <Path d="M24 18 L98 116 L196 38" fill="none" stroke={c.accent} strokeWidth={4} strokeLinecap="round" strokeDasharray="1 11" />
      <Circle cx={212} cy={26} r={10} fill={c.accent} />
      <Ellipse cx={98} cy={122} rx={20} ry={4} fill={c.ink} opacity={0.12} />

      {/* Left bubble with typing dots */}
      <Rect x={28} y={124} width={118} height={48} rx={20} fill={c.surface} stroke={c.line} strokeWidth={2} />
      <Circle cx={62} cy={148} r={5} fill={c.muted} />
      <Circle cx={84} cy={148} r={5} fill={c.muted} opacity={0.7} />
      <Circle cx={106} cy={148} r={5} fill={c.muted} opacity={0.4} />

      {/* Right bubble with a voice note */}
      <Rect x={164} y={112} width={128} height={56} rx={22} fill={c.accent} />
      <Circle cx={192} cy={140} r={13} fill={c.accentInk} />
      <Path d="M188.5 133.5 L199 140 L188.5 146.5 Z" fill={c.accent} />
      <G>
        {bars.map((h, i) => (
          <Rect key={i} x={214 + i * 9} y={140 - h / 2} width={4} height={h} rx={2} fill={c.accentInk} opacity={i < 5 ? 1 : 0.4} />
        ))}
      </G>

      {/* People */}
      <Circle cx={30} cy={178} r={13} fill={c.avatar.mint} />
      <Circle cx={292} cy={96} r={12} fill={c.avatar.amber} />
      <Rect x={252} y={44} width={30} height={30} rx={10} fill={c.avatar.sky} />

      {/* Sparkles */}
      <Path d="M262 24 h14 M269 17 v14" stroke={c.muted} strokeWidth={3} strokeLinecap="round" />
      <Path d="M52 70 h10 M57 65 v10" stroke={c.muted} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={150} cy={22} r={3} fill={c.muted} />
      <Circle cx={304} cy={150} r={3} fill={c.muted} />
    </Svg>
  );
}
