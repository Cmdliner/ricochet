"use client";

import { useEffect, useState } from "react";
import { PauseIcon, PlayIcon } from "@/components/icons";
import { Waveform } from "@/components/waveform";

const LENGTH = 14;

function format(seconds: number) {
  return `0:${String(seconds).padStart(2, "0")}`;
}

/** A voice note that plays on a loop and can be paused and resumed. */
export function VoiceSticker({ className }: { className?: string }) {
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setElapsed((s) => (s + 1) % LENGTH), 1000);
    return () => clearInterval(timer);
  }, [playing]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause voice note" : "Play voice note"}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-ink text-ink transition-transform hover:scale-105 active:scale-95"
      >
        {playing ? (
          <PauseIcon className="size-4" />
        ) : (
          <PlayIcon className="size-4 translate-x-px" />
        )}
      </button>
      <Waveform animated light paused={!playing} duration={LENGTH} count={14} />
      <span className="w-8 text-xs text-cream-muted tabular-nums">{format(elapsed)}</span>
    </div>
  );
}
