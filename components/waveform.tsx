import { WAVEFORM_BARS } from "@/lib/constants";

type WaveformProps = {
  /** Animate the playhead across the bars. */
  animated?: boolean;
  /** Static played portion, 0 to 100. Ignored when animated. */
  progress?: number;
  /** How many bars to draw; defaults to all of them. */
  count?: number;
  /** Freeze the animated playhead. */
  paused?: boolean;
  /** Use darker unplayed bars, for light backgrounds. */
  light?: boolean;
  /** Seconds for one full pass of the animated playhead. */
  duration?: number;
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
  paused = false,
  light = false,
  duration,
}: WaveformProps) {
  return (
    <div className="relative" aria-hidden="true">
      <Bars className={light ? "bg-cream-ink/20" : "bg-white/25"} count={count} />
      <div
        className={animated ? "playhead absolute inset-0" : "absolute inset-0"}
        style={
          animated
            ? {
                animationPlayState: paused ? "paused" : "running",
                animationDuration: duration ? `${duration}s` : undefined,
              }
            : { clipPath: `inset(0 ${100 - progress}% 0 0)` }
        }
      >
        <Bars className="bg-accent" count={count} />
      </div>
    </div>
  );
}
