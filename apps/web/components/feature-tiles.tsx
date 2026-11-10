import { Avatar } from "@/components/avatar";
import { MicIcon, PlayIcon } from "@/components/icons";
import { VideoNote } from "@/components/video-note";
import { Waveform } from "@/components/waveform";
import { AVATAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Each tile shows a piece of the real app, so the page explains the product by showing it.
 * They are drawn with the same colours, bubbles and badges as the mobile screens.
 */

function Badge({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "ink" }) {
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-px text-[0.65rem] font-semibold",
        tone === "accent" ? "bg-accent text-accent-ink" : "bg-cream-ink text-cream",
      )}
    >
      {children}
    </span>
  );
}

function Copy({ title, body, tone = "dark" }: { title: string; body: string; tone?: "dark" | "accent" | "cream" }) {
  return (
    <div>
      <h3 className="font-display text-xl leading-tight font-semibold tracking-tight sm:text-2xl">{title}</h3>
      <p
        className={cn(
          "mt-1.5 text-sm leading-relaxed sm:text-[0.95rem]",
          tone === "dark" && "text-muted",
          tone === "accent" && "text-accent-ink/75",
          tone === "cream" && "text-cream-muted",
        )}
      >
        {body}
      </p>
    </div>
  );
}

/* ---------- Hubs and pods ---------- */

const pods = [
  { name: "announcements", unread: 0 },
  { name: "design-crits", unread: 3 },
  { name: "launch", unread: 12 },
  { name: "off-topic", unread: 0 },
];

export function HubsTile() {
  return (
    <>
      <Copy
        title="Hubs for crowds. Pods for topics."
        body="Give every community a home, then split it into rooms. Unread counts show you where to look."
      />
      <div className="mt-5 flex min-h-0 flex-1 overflow-hidden rounded-xl border border-line bg-canvas">
        <div className="flex w-12 shrink-0 flex-col items-center gap-2.5 border-r border-line py-3 sm:w-14">
          <span className="rounded-xl ring-2 ring-accent ring-offset-2 ring-offset-canvas">
            <Avatar letter="S" color={AVATAR_COLORS.coral} square />
          </span>
          <Avatar letter="D" color={AVATAR_COLORS.sky} square />
          <Avatar letter="W" color={AVATAR_COLORS.mint} square />
          <Avatar letter="B" color={AVATAR_COLORS.amber} square />
        </div>
        <div className="flex-1 p-2.5 text-sm">
          <p className="px-2 pt-1 pb-2 text-[0.7rem] font-medium tracking-wider text-muted uppercase">Ship It</p>
          <ul className="flex flex-col gap-0.5">
            {pods.map((pod, i) => (
              <li key={pod.name} className={cn("flex items-center justify-between rounded-lg px-2 py-1.5", i === 2 && "bg-raised")}>
                <span>
                  <span className="mr-1.5 text-muted">#</span>
                  {pod.name}
                </span>
                {pod.unread > 0 && <Badge>{pod.unread}</Badge>}
              </li>
            ))}
            <li className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-muted">
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              core-team
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

/* ---------- Voice notes ---------- */

export function VoiceTile() {
  return (
    <>
      <Copy
        tone="accent"
        title="Say it out loud."
        body="Hold to record, slide to cancel, let go to send. Listen back whenever suits you."
      />
      <div className="mt-5 flex flex-1 flex-col justify-end gap-3">
        <div className="flex items-center gap-3 self-start rounded-2xl rounded-bl-md bg-accent-ink px-3.5 py-3 text-ink">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
            <PlayIcon className="size-3.5 translate-x-px" />
          </span>
          <Waveform animated count={16} duration={6} />
          <span className="text-xs text-ink/70 tabular-nums">0:14</span>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-accent-ink/12 py-1.5 pr-1.5 pl-4 text-sm text-accent-ink">
          <span className="size-2 shrink-0 rounded-full bg-[#b3261e]" />
          <span className="font-semibold tabular-nums">0:07</span>
          <span className="ml-auto truncate text-accent-ink/70">‹ Slide to cancel</span>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-ink text-accent">
            <MicIcon className="size-[18px]" />
          </span>
        </div>
      </div>
    </>
  );
}

/* ---------- Video notes ---------- */

export function VideoTile() {
  const size = 132;
  const ring = 148;
  const radius = (ring - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <>
      <Copy title="Round and personal." body="Up to 60 seconds. For when text is flat and a call is too much." />
      <div className="mt-5 grid flex-1 place-items-center">
        <div className="relative" style={{ width: ring, height: ring }}>
          <svg width={ring} height={ring} className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx={ring / 2} cy={ring / 2} r={radius} fill="none" stroke="var(--line)" strokeWidth="4" />
            <circle
              cx={ring / 2}
              cy={ring / 2}
              r={radius}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.62} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <VideoNote duration="0:23" size={size - 12} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- Private chats ---------- */

const chats = [
  { letter: "M", color: AVATAR_COLORS.coral, name: "Mira", line: "Voice note · 0:23", time: "9:41", unread: 2 },
  { letter: "J", color: AVATAR_COLORS.mint, name: "Jonah", line: "Sent a video note", time: "Mon", unread: 0 },
  { letter: "T", color: AVATAR_COLORS.amber, name: "Tola", line: "figma.com/file/onboarding", time: "Sun", unread: 0 },
];

export function ChatsTile() {
  return (
    <>
      <Copy tone="cream" title="Step out, one to one." body="Find anyone by their handle and keep it between the two of you." />
      <ul className="mt-5 flex flex-1 flex-col justify-end gap-1">
        {chats.map((chat) => (
          <li key={chat.name} className="flex items-center gap-3 rounded-xl py-1.5">
            <Avatar letter={chat.letter} color={chat.color} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{chat.name}</p>
              <p className="truncate text-xs text-cream-muted">{chat.line}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[0.65rem] text-cream-muted">{chat.time}</span>
              {chat.unread > 0 ? <Badge tone="ink">{chat.unread}</Badge> : <span className="h-4" />}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ---------- Live ---------- */

export function LiveTile() {
  return (
    <>
      <Copy title="No refresh. Ever." body="Messages, typing and read states arrive the moment they happen." />
      <div className="mt-5 flex flex-1 flex-col justify-end gap-2 text-sm">
        <p className="self-end rounded-2xl rounded-br-md bg-accent px-3.5 py-2 font-medium text-accent-ink">ready to ship?</p>
        <p className="self-end text-[0.7rem] text-muted">Seen 9:41</p>
        <div className="flex items-end gap-2">
          <Avatar letter="M" color={AVATAR_COLORS.coral} />
          <span className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-raised px-3.5 py-3">
            <span className="typing-dot size-1.5 rounded-full bg-muted" />
            <span className="typing-dot size-1.5 rounded-full bg-muted [animation-delay:150ms]" />
            <span className="typing-dot size-1.5 rounded-full bg-muted [animation-delay:300ms]" />
          </span>
        </div>
        <p className="flex items-center gap-2 pt-1 text-xs text-muted">
          <span className="size-2 rounded-full bg-[#5dd39e]" />
          128 online in Ship It
        </p>
      </div>
    </>
  );
}

/* ---------- Activity inbox ---------- */

export function ActivityTile() {
  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-10">
      <Copy
        title="Never miss a mention."
        body="Mentions, reactions and hub invites land in one inbox, and the badge follows you across every device."
      />
      <ul className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-line bg-canvas p-2 text-sm sm:gap-2 sm:p-2.5">
        <li className="flex items-start gap-3 rounded-lg bg-surface p-2.5">
          <Avatar letter="M" color={AVATAR_COLORS.coral} />
          <div className="min-w-0 flex-1">
            <p>
              <b className="font-semibold">Mira</b> <span className="text-muted">mentioned you in</span> <b className="font-semibold">#launch</b>
            </p>
            <p className="mt-1.5 truncate rounded-lg bg-raised px-2.5 py-1.5 text-xs text-muted">@you can you look at the pricing copy?</p>
          </div>
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
        </li>
        <li className="flex items-center gap-3 rounded-lg p-2.5 max-sm:hidden">
          <Avatar letter="J" color={AVATAR_COLORS.mint} />
          <p className="min-w-0 flex-1">
            <b className="font-semibold">Jonah</b> <span className="text-muted">reacted 🔥 to your message</span>
          </p>
        </li>
        <li className="flex items-center gap-3 rounded-lg p-2.5">
          <Avatar letter="L" color={AVATAR_COLORS.amber} />
          <div className="min-w-0 flex-1">
            <p>
              <b className="font-semibold">Leo</b> <span className="text-muted">invited you to join</span> <b className="font-semibold">Pixel Lab</b>
            </p>
            <div className="mt-2 flex gap-2 text-xs font-semibold">
              <span className="rounded-full bg-accent px-3.5 py-1.5 text-accent-ink">Accept</span>
              <span className="rounded-full border border-line px-3.5 py-1.5">Decline</span>
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
}
