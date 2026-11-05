import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { useTheme } from "@/theme/theme-provider";

type ArtProps = { width?: number };

function Frame({ width, label, children }: ArtProps & { label: string; children: React.ReactNode }) {
  return (
    <Svg width={width} height={((width ?? 220) * 150) / 220} viewBox="0 0 220 150" accessibilityRole="image" accessibilityLabel={label}>
      {children}
    </Svg>
  );
}

/** Empty Hubs tab: stacked hub avatars with pod chips under them. */
export function HubsArt({ width = 220 }: ArtProps) {
  const { colors: c } = useTheme();
  return (
    <Frame width={width} label="Hubs">
      <Circle cx={110} cy={70} r={62} fill={c.raised} />
      <Rect x={50} y={40} width={58} height={58} rx={19} fill={c.avatar.sky} />
      <Rect x={112} y={30} width={54} height={54} rx={18} fill={c.avatar.mint} />
      <Rect x={82} y={58} width={62} height={62} rx={20} fill={c.avatar.coral} stroke={c.canvas} strokeWidth={4} />
      <Path d="M104 78 l-4 22 M118 78 l-4 22 M96 84 h28 M94 94 h28" stroke={c.accentInk} strokeWidth={3.5} strokeLinecap="round" opacity={0.7} />
      <Rect x={40} y={128} width={60} height={16} rx={8} fill={c.surface} stroke={c.line} strokeWidth={1.5} />
      <Rect x={108} y={128} width={72} height={16} rx={8} fill={c.accent} />
      <Path d="M186 36 h10 M191 31 v10" stroke={c.muted} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={30} cy={60} r={3} fill={c.muted} />
    </Frame>
  );
}

/** Empty Chats tab: a text bubble, a voice note and a video note. */
export function ChatsArt({ width = 220 }: ArtProps) {
  const { colors: c } = useTheme();
  const bars = [8, 14, 10, 18, 12, 7];
  return (
    <Frame width={width} label="Chats">
      <Circle cx={110} cy={72} r={62} fill={c.raised} />
      <Rect x={34} y={34} width={104} height={38} rx={17} fill={c.surface} stroke={c.line} strokeWidth={2} />
      <Rect x={50} y={48} width={56} height={6} rx={3} fill={c.line} />
      <Rect x={50} y={58} width={36} height={6} rx={3} fill={c.line} />
      <Rect x={84} y={82} width={104} height={38} rx={17} fill={c.accent} />
      <Circle cx={104} cy={101} r={10} fill={c.accentInk} />
      <Path d="M101 96 L109 101 L101 106 Z" fill={c.accent} />
      <G>
        {bars.map((h, i) => (
          <Rect key={i} x={122 + i * 10} y={101 - h / 2} width={4} height={h} rx={2} fill={c.accentInk} opacity={i < 3 ? 1 : 0.4} />
        ))}
      </G>
      <Circle cx={170} cy={44} r={24} fill={c.avatar.amber} stroke={c.accent} strokeWidth={3} />
      <Path d="M165 36 L178 44 L165 52 Z" fill={c.accentInk} opacity={0.75} />
      <Path d="M30 108 h10 M35 103 v10" stroke={c.muted} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={196} cy={116} r={3} fill={c.muted} />
    </Frame>
  );
}

/** Empty Activity tab: a bell with a little spark. */
export function ActivityArt({ width = 220 }: ArtProps) {
  const { colors: c } = useTheme();
  return (
    <Frame width={width} label="Activity">
      <Circle cx={110} cy={74} r={62} fill={c.raised} />
      <Path d="M76 98 V74 a34 34 0 0 1 68 0 v24 l8 12 H68 Z" fill={c.surface} stroke={c.line} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M96 118 a14 14 0 0 0 28 0" fill="none" stroke={c.line} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={110} cy={36} r={6} fill={c.line} />
      <Circle cx={138} cy={50} r={13} fill={c.accent} stroke={c.canvas} strokeWidth={4} />
      <Path d="M52 40 h12 M58 34 v12" stroke={c.muted} strokeWidth={3} strokeLinecap="round" />
      <Path d="M168 98 h10 M173 93 v10" stroke={c.muted} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={176} cy={34} r={3} fill={c.muted} />
      <Circle cx={44} cy={110} r={3} fill={c.muted} />
    </Frame>
  );
}
