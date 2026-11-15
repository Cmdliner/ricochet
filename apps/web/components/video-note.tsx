import Image from "next/image";
import { PlayIcon } from "@/components/icons";

type VideoNoteProps = {
  duration: string;
  photo: string;
  size?: number;
};

export function VideoNote({ duration, photo, size = 112 }: VideoNoteProps) {
  return (
    <div
      aria-hidden="true"
      className="relative shrink-0 overflow-hidden rounded-full border-2 border-accent bg-[#1d1d1d]"
      style={{ width: size, height: size }}
    >
      <Image src={photo} alt="" width={200} height={200} className="size-full object-cover" />
      <span className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-ink backdrop-blur-[2px]">
        <PlayIcon className="size-3.5 translate-x-px" />
      </span>
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-2 py-0.5 text-[0.65rem] text-ink tabular-nums">
        {duration}
      </span>
    </div>
  );
}
