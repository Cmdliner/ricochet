import { colors } from "@ricochet/shared";
import Svg, { Circle, Path, Rect } from "react-native-svg";

/** The Ricochet mark: a path that bounces and sends a dot flying. */
export function LogoMark({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityLabel="Ricochet">
      <Rect width={32} height={32} rx={9} fill={colors.accent} />
      <Path
        d="M7.5 9 14 23 22 12"
        fill="none"
        stroke={colors.accentInk}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={25} cy={8.5} r={2.4} fill={colors.accentInk} />
    </Svg>
  );
}
