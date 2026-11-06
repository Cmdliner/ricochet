import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from "react-native-svg";
import { useTheme } from "@/theme/theme-provider";

export function ProfileArt({ width = 300 }: { width?: number }) {
  const { colors: c } = useTheme();

  return (
    <Svg width={width} height={(width * 200) / 320} viewBox="0 0 320 200" accessibilityRole="image" accessibilityLabel="A profile picture surrounded by hubs">
      <Defs>
        <ClipPath id="avatar-clip">
          <Circle cx={160} cy={100} r={52} />
        </ClipPath>
      </Defs>

      <Circle cx={160} cy={100} r={80} fill="none" stroke={c.line} strokeWidth={2} strokeDasharray="2 9" strokeLinecap="round" />

      {/* Avatar */}
      <Circle cx={160} cy={100} r={52} fill={c.avatar.coral} />
      <G clipPath="url(#avatar-clip)">
        <Circle cx={160} cy={88} r={19} fill={c.accentInk} opacity={0.3} />
        <Ellipse cx={160} cy={152} rx={40} ry={34} fill={c.accentInk} opacity={0.3} />
      </G>

      {/* Edit badge */}
      <Circle cx={204} cy={142} r={17} fill={c.accent} stroke={c.canvas} strokeWidth={4} />
      <Path d="M204 134 v16 M196 142 h16" stroke={c.accentInk} strokeWidth={3.5} strokeLinecap="round" />

      {/* Hubs */}
      <Rect x={52} y={40} width={46} height={46} rx={15} fill={c.avatar.amber} />
      <Rect x={228} y={34} width={40} height={40} rx={13} fill={c.avatar.sky} />
      <Rect x={244} y={118} width={34} height={34} rx={11} fill={c.avatar.mint} />
      <Rect x={60} y={132} width={30} height={30} rx={10} fill={c.surface} stroke={c.line} strokeWidth={2} />
      <Path d="M70 142 l4 10 M78 142 l-4 10 M68 146 h14 M67 151 h14" stroke={c.muted} strokeWidth={2} strokeLinecap="round" />

      <Path d="M30 112 h10 M35 107 v10" stroke={c.muted} strokeWidth={3} strokeLinecap="round" />
      <Path d="M286 82 h10 M291 77 v10" stroke={c.muted} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={118} cy={20} r={3} fill={c.muted} />
      <Circle cx={196} cy={184} r={3} fill={c.muted} />
    </Svg>
  );
}
