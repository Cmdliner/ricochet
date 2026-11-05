import { Avatar } from "@/components/avatar";
import { Container } from "@/components/container";
import { PlayIcon } from "@/components/icons";
import { VideoNote } from "@/components/video-note";
import { Waveform } from "@/components/waveform";
import { AVATAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function Card({
  id,
  title,
  body,
  className,
  children,
}: {
  id?: string;
  title: string;
  body: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article
      id={id}
      className={cn("flex flex-col overflow-hidden rounded-3xl border border-line bg-surface", className)}
    >
      <div aria-hidden="true" className="grid h-64 place-items-center overflow-hidden border-b border-line bg-black">
        {children}
      </div>
      <div className="p-7">
        <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 leading-relaxed text-muted">{body}</p>
      </div>
    </article>
  );
}

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
function HubPreview() {
  return (
    <div className="flex h-[210px] w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex w-14 shrink-0 flex-col items-center gap-3 border-r border-line bg-black py-4">
        {hubs.map((hub, i) => (
          <span key={hub.letter} className={cn("rounded-xl", i === 0 && "ring-2 ring-accent ring-offset-2 ring-offset-black")}>
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

function RealTimePreview() {
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

function VoicePreview() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-4">
      <span className="grid size-11 place-items-center rounded-full bg-accent text-accent-ink">
        <PlayIcon className="size-4 translate-x-px" />
      </span>
      <Waveform progress={55} />
      <span className="text-xs text-muted tabular-nums">0:42</span>
    </div>
  );
}

function VideoPreview() {
  return (
    <div className="flex items-center">
      <VideoNote duration="0:08" size={120} />
      <div className="-ml-5">
        <VideoNote duration="0:15" size={144} />
      </div>
      <div className="-ml-5">
        <VideoNote duration="0:05" size={120} />
      </div>
    </div>
  );
}

function PrivatePreview() {
  return (
    <div className="flex w-60 flex-col items-center gap-4">
      <div className="flex -space-x-2">
        <span className="rounded-full ring-4 ring-black">
          <Avatar letter="Y" color={AVATAR_COLORS.amber} size="lg" />
        </span>
        <span className="rounded-full ring-4 ring-black">
          <Avatar letter="M" color={AVATAR_COLORS.coral} size="lg" />
        </span>
      </div>
      <p className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm">
        <svg viewBox="0 0 24 24" className="size-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        Just the two of you
      </p>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-accent">Features</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            One place for the crowd and the close circle.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Everything you need to keep a community lively and your closest chats personal.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-6">
          <Card
            id="hubs"
            className="md:col-span-4"
            title="Hubs and pods"
            body="A hub is a home for your people. Split it into pods so every topic gets its own room, with unread counts to show you where to look."
          >
            <HubPreview />
          </Card>
          <Card
            className="md:col-span-2"
            title="Real time, always"
            body="Messages land the moment they are sent, with typing and read states that keep up."
          >
            <RealTimePreview />
          </Card>
          <Card
            id="voice-video"
            className="md:col-span-2"
            title="Voice messages"
            body="Say it the way you would out loud. Record, preview and send in a tap."
          >
            <VoicePreview />
          </Card>
          <Card
            className="md:col-span-2"
            title="Video notes"
            body="Short, round and personal. For when text is too flat and a call is too much."
          >
            <VideoPreview />
          </Card>
          <Card
            className="md:col-span-2"
            title="Private chats"
            body="Step out of the hub into a one-to-one conversation without leaving the app."
          >
            <PrivatePreview />
          </Card>
        </div>
      </Container>
    </section>
  );
}
