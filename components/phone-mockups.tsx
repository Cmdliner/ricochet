import { Avatar } from "@/components/avatar";
import { MicIcon, PlayIcon, PlusIcon } from "@/components/icons";
import { VideoNote } from "@/components/video-note";
import { Waveform } from "@/components/waveform";
import { AVATAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-[640px] w-[290px] shrink-0 rounded-[46px] border border-line bg-[#0d0d0d] p-2",
        className,
      )}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[38px] border border-line/70 bg-black">
        <span className="absolute top-3 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-[#0d0d0d]" />
        {children}
      </div>
    </div>
  );
}

function Bubble({ mine = false, children }: { mine?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "max-w-[210px] rounded-2xl px-3.5 py-2.5 text-[0.82rem] leading-snug",
        mine ? "rounded-br-md bg-accent font-medium text-accent-ink" : "rounded-bl-md bg-raised",
      )}
    >
      {children}
    </div>
  );
}

function VoiceBubble({ duration, mine = false }: { duration: string; mine?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2.5",
        mine ? "rounded-br-md bg-ink" : "rounded-bl-md bg-raised",
      )}
    >
      <span
        className={cn(
          "grid size-8 place-items-center rounded-full",
          mine ? "bg-black text-ink" : "bg-accent text-accent-ink",
        )}
      >
        <PlayIcon className="size-3.5 translate-x-px" />
      </span>
      <Waveform animated count={15} />
      <span className={cn("text-[0.7rem] tabular-nums", mine ? "text-black/70" : "text-muted")}>
        {duration}
      </span>
    </div>
  );
}

function TabBar({ active }: { active: "Hubs" | "Chats" | "You" }) {
  return (
    <div className="mt-auto flex justify-around border-t border-line px-6 pt-3 pb-5 text-[0.7rem]">
      {(["Hubs", "Chats", "You"] as const).map((tab) => (
        <span key={tab} className={tab === active ? "text-ink" : "text-muted"}>
          {tab}
        </span>
      ))}
    </div>
  );
}

function Composer({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex items-center gap-2 border-t border-line p-3 pb-5">
      <div className="flex-1 rounded-full bg-raised px-4 py-2.5 text-[0.78rem] text-muted">
        {placeholder}
      </div>
      <span className="grid size-10 place-items-center rounded-full bg-accent text-accent-ink">
        <MicIcon className="size-[18px]" />
      </span>
    </div>
  );
}

const hubs = [
  { name: "Ship It", letter: "S", color: AVATAR_COLORS.coral, meta: "6 pods", unread: 15 },
  { name: "Design Club", letter: "D", color: AVATAR_COLORS.sky, meta: "4 pods", unread: 0 },
  { name: "Weekend Run", letter: "W", color: AVATAR_COLORS.mint, meta: "2 pods", unread: 2 },
  { name: "Book Circle", letter: "B", color: AVATAR_COLORS.amber, meta: "3 pods", unread: 0 },
];

const pods = [
  { name: "general", unread: 0 },
  { name: "design-crits", unread: 3 },
  { name: "launch", unread: 12 },
];

function HubsScreen() {
  return (
    <PhoneFrame className="mt-16 hidden lg:block">
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <p className="font-display text-2xl font-semibold tracking-tight">Hubs</p>
        <span className="grid size-8 place-items-center rounded-full bg-raised">
          <PlusIcon className="size-4" />
        </span>
      </div>
      <ul className="px-3">
        {hubs.map((hub, i) => (
          <li
            key={hub.name}
            className={cn("flex items-center gap-3 rounded-2xl px-2 py-2.5", i === 0 && "bg-raised")}
          >
            <Avatar letter={hub.letter} color={hub.color} size="md" square />
            <div className="flex-1">
              <p className="text-sm font-medium">{hub.name}</p>
              <p className="text-xs text-muted">{hub.meta}</p>
            </div>
            {hub.unread > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[0.65rem] font-semibold text-accent-ink">
                {hub.unread}
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-6 px-5 pb-2 text-[0.65rem] font-medium tracking-wider text-muted uppercase">
        Pods in Ship It
      </p>
      <ul className="px-3 text-sm">
        {pods.map((pod) => (
          <li key={pod.name} className="flex items-center justify-between rounded-xl px-2 py-2">
            <span>
              <span className="mr-2 text-muted">#</span>
              {pod.name}
            </span>
            {pod.unread > 0 && <span className="size-1.5 rounded-full bg-accent" />}
          </li>
        ))}
      </ul>
      <TabBar active="Hubs" />
    </PhoneFrame>
  );
}

function PodScreen() {
  return (
    <PhoneFrame className="relative z-10">
      <div className="border-b border-line px-5 pt-11 pb-3">
        <p className="font-display text-lg font-semibold tracking-tight"># launch</p>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <span className="size-1.5 rounded-full bg-accent" />
          Ship It · 128 online
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 py-5">
        <div className="flex items-end gap-2.5">
          <Avatar letter="M" color={AVATAR_COLORS.coral} />
          <Bubble>anyone up for a quick sync before launch?</Bubble>
        </div>
        <div className="flex items-end gap-2.5">
          <Avatar letter="J" color={AVATAR_COLORS.mint} />
          <VoiceBubble duration="0:14" />
        </div>
        <div className="ml-[42px] flex gap-2">
          <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs">🔥 4</span>
          <span className="rounded-full border border-accent px-2.5 py-1 text-xs">👀 2</span>
        </div>
        <div className="flex items-end gap-2.5">
          <Avatar letter="D" color={AVATAR_COLORS.amber} />
          <VideoNote duration="0:08" size={104} />
        </div>
        <div className="mt-auto flex justify-end">
          <Bubble mine>on my way 🚀</Bubble>
        </div>
      </div>
      <Composer placeholder="Message #launch" />
    </PhoneFrame>
  );
}

function PrivateScreen() {
  return (
    <PhoneFrame className="mt-16 hidden lg:block">
      <div className="flex items-center gap-3 border-b border-line px-5 pt-11 pb-3">
        <Avatar letter="M" color={AVATAR_COLORS.coral} size="md" />
        <div>
          <p className="text-sm font-medium">Mira</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            typing
            <span className="flex gap-0.5">
              <span className="typing-dot size-1 rounded-full bg-muted" />
              <span className="typing-dot size-1 rounded-full bg-muted [animation-delay:150ms]" />
              <span className="typing-dot size-1 rounded-full bg-muted [animation-delay:300ms]" />
            </span>
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 py-5">
        <div className="flex items-end gap-2.5">
          <VoiceBubble duration="0:23" />
        </div>
        <div className="flex justify-end">
          <Bubble mine>ha, you&apos;re kidding</Bubble>
        </div>
        <div className="flex justify-end">
          <VideoNote duration="0:11" size={116} />
        </div>
        <p className="text-right text-[0.7rem] text-muted">Seen 9:41</p>
      </div>
      <Composer placeholder="Message Mira" />
    </PhoneFrame>
  );
}

/** A single phone, for pages that need one screen rather than the trio. */
export const ChatPhone = PodScreen;

export function PhoneMockups() {
  return (
    <div className="flex h-[500px] items-start justify-center gap-6 overflow-hidden px-5 sm:h-[580px] lg:gap-8">
      <HubsScreen />
      <PodScreen />
      <PrivateScreen />
    </div>
  );
}
