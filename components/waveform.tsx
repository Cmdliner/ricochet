import { WAVEFORM_BARS } from "@/lib/constants";

type WaveformProps = {
  /** Animate the playhead across the bars. */
  animated?: boolean;
  /** Static played portion, 0 to 100. Ignored when animated. */
  progress?: number;
  /** How many bars to draw; defaults to all of them. */
  count?: number;
};

function Bars({ className, count }: { className: string; count: number }) {
  return (
    <div className="flex h-8 items-center gap-[3px]">
      {WAVEFORM_BARS.slice(0, count).map((height, i) => (
        <span key={i} className={`w-[3px] rounded-full ${className}`} style={{ height }} />
      ))}
    </div>
  );
}

export function Waveform({
  animated = false,
  progress = 0,
  count = WAVEFORM_BARS.length,
}: WaveformProps) {
  return (
    <div className="relative" aria-hidden="true">
      <Bars className="bg-white/25" count={count} />
      <div
        className={animated ? "playhead absolute inset-0" : "absolute inset-0"}
        style={animated ? undefined : { clipPath: `inset(0 ${100 - progress}% 0 0)` }}
      >
        <Bars className="bg-ink" count={count} />
      </div>
    </div>
  );
}
