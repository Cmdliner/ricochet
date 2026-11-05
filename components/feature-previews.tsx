import { Avatar } from "@/components/avatar";
import { PlayIcon } from "@/components/icons";
import { VideoNote } from "@/components/video-note";
import { Waveform } from "@/components/waveform";
import { AVATAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const hubs = [
  { letter: "S", color: AVATAR_COLORS.coral },
  { letter: "D", color: AVATAR_COLORS.sky },
  { letter: "W", color: AVATAR_COLORS.mint },
];

const pods = [
  { name: "general", unread: 0 },
  { name: "design-crits", unread: 3 },
  { name: "launch", unread: 12 },
  { name: "off-topic", unread: 0 },
];

/** Miniature of the hub screen: hub rail, pod list and a short conversation. */
export function HubPreview() {
  return (
    <div className="flex h-[230px] w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/40">
      <div className="flex w-14 shrink-0 flex-col items-center gap-3 border-r border-line bg-canvas py-4">
        {hubs.map((hub, i) => (
          <span
            key={hub.letter}
            className={cn("rounded-xl", i === 0 && "ring-2 ring-accent ring-offset-2 ring-offset-canvas")}
          >
            <Avatar letter={hub.letter} color={hub.color} square />
          </span>
        ))}
      </div>
      <ul className="hidden w-40 shrink-0 flex-col gap-0.5 border-r border-line p-3 text-sm sm:flex">
        <li className="px-2 pb-2 text-xs font-medium text-muted">Ship It</li>
        {pods.map((pod, i) => (
          <li
            key={pod.name}
            className={cn("flex items-center justify-between rounded-lg px-2 py-1.5", i === 2 && "bg-raised")}
          >
            <span>
              <span className="mr-1.5 text-muted">#</span>
              {pod.name}
            </span>
            {pod.unread > 0 && (
              <span className="rounded-full bg-accent px-1.5 text-[0.65rem] font-semibold text-accent-ink">
                {pod.unread}
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-1 flex-col justify-end gap-3 p-4 text-sm">
        <div className="flex items-end gap-2.5">
          <Avatar letter="M" color={AVATAR_COLORS.coral} />
          <p className="rounded-2xl rounded-bl-md bg-raised px-3 py-2">ready to ship?</p>
        </div>
        <div className="flex items-end gap-2.5">
          <Avatar letter="J" color={AVATAR_COLORS.mint} />
          <p className="rounded-2xl rounded-bl-md bg-raised px-3 py-2">one last review ✅</p>
        </div>
        <p className="ml-auto rounded-2xl rounded-br-md bg-accent px-3 py-2 font-medium text-accent-ink">
          shipping now 🚀
        </p>
      </div>
    </div>
  );
}

export function RealTimePreview() {
  return (
    <div className="flex w-64 flex-col gap-3 text-sm">
      <p className="self-end rounded-2xl rounded-br-md bg-accent px-3.5 py-2 font-medium text-accent-ink">
        are you there?
      </p>
      <p className="self-end text-xs text-muted">Seen just now</p>
      <div className="flex items-center gap-2.5">
        <Avatar letter="M" color={AVATAR_COLORS.coral} />
        <div className="flex gap-1 rounded-2xl rounded-bl-md bg-raised px-4 py-3.5">
          <span className="typing-dot size-1.5 rounded-full bg-muted" />
          <span className="typing-dot size-1.5 rounded-full bg-muted [animation-delay:150ms]" />
          <span className="typing-dot size-1.5 rounded-full bg-muted [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export function VoicePreview() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-4 shadow-2xl shadow-black/40">
      <span className="grid size-11 place-items-center rounded-full bg-accent text-accent-ink">
        <PlayIcon className="size-4 translate-x-px" />
      </span>
      <Waveform animated />
      <span className="text-xs text-muted tabular-nums">0:42</span>
    </div>
  );
}

export function VideoPreview() {
  return (
    <div className="flex items-center">
      <VideoNote duration="0:08" size={110} />
      <div className="-ml-5">
        <VideoNote duration="0:15" size={138} />
      </div>
      <div className="-ml-5">
        <VideoNote duration="0:05" size={110} />
      </div>
    </div>
  );
}

export function PrivatePreview() {
  return (
    <div className="flex w-64 flex-col items-center gap-5">
      <div className="flex -space-x-2">
        <span className="rounded-full ring-4 ring-canvas">
          <Avatar letter="Y" color={AVATAR_COLORS.amber} size="lg" />
        </span>
        <span className="rounded-full ring-4 ring-canvas">
          <Avatar letter="M" color={AVATAR_COLORS.coral} size="lg" />
        </span>
      </div>
      <p className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm">
        <svg viewBox="0 0 24 24" className="size-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        Just the two of you
      </p>
    </div>
  );
}
