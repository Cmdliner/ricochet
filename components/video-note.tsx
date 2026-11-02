import { PlayIcon } from "@/components/icons";

type VideoNoteProps = {
  duration: string;
  size?: number;
};

/** A round video note placeholder: flat silhouette, no photography needed. */
export function VideoNote({ duration, size = 112 }: VideoNoteProps) {
  return (
    <div
      aria-hidden="true"
      className="relative shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-[#1d1d1d]"
      style={{ width: size, height: size }}
    >
      <span
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[#3b3b3b]"
        style={{ top: size * 0.2, width: size * 0.3, height: size * 0.3 }}
      />
      <span
        className="absolute left-1/2 -translate-x-1/2 rounded-t-full bg-[#3b3b3b]"
        style={{ top: size * 0.56, width: size * 0.64, height: size * 0.6 }}
      />
      <span className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-ink">
        <PlayIcon className="size-3.5 translate-x-px" />
      </span>
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-2 py-0.5 text-[0.65rem] text-ink tabular-nums">
        {duration}
      </span>
    </div>
  );
}
