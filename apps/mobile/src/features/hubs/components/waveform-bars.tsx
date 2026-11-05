import { View } from "react-native";

type WaveformBarsProps = {
  /** Loudness per bar, 0 to 100. */
  bars: number[];
  /** How much has played, 0 to 1. */
  progress: number;
  playedColor: string;
  idleColor: string;
  height?: number;
};

/** The bars of a voice note. The part that has played is drawn in a brighter colour. */
export function WaveformBars({ bars, progress, playedColor, idleColor, height = 28 }: WaveformBarsProps) {
  return (
    <View className="flex-row items-center" style={{ height, gap: 2.5 }}>
      {bars.map((level, index) => (
        <View
          key={index}
          style={{
            width: 3,
            height: Math.max(4, (level / 100) * height),
            borderRadius: 2,
            backgroundColor: index / bars.length < progress ? playedColor : idleColor,
          }}
        />
      ))}
    </View>
  );
}
