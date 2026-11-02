import { Avatar } from "@/components/avatar";
import { VideoNote } from "@/components/video-note";
import { PlayIcon } from "@/components/icons";
import { Waveform } from "@/components/waveform";
import { AVATAR_COLORS } from "@/lib/constants";

function Feature({
  id,
  title,
  body,
  children,
}: {
  id?: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <article id={id} className="flex flex-col bg-black p-6 sm:p-8">
      <div
        aria-hidden="true"
        className="grid h-56 place-items-center overflow-hidden rounded-2xl border border-line bg-surface"
      >
        {children}
      </div>
      <h3 className="mt-8 font-display text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-md leading-relaxed text-muted">{body}</p>
    </article>
  );
}

const hubAvatars = [
  { letter: "S", color: AVATAR_COLORS.coral },
  { letter: "D", color: AVATAR_COLORS.sky },
  { letter: "W", color: AVATAR_COLORS.mint },
  { letter: "B", color: AVATAR_COLORS.amber },
];

const pods = [
  { name: "general", unread: 0 },
  { name: "design-crits", unread: 3 },
  { name: "launch", unread: 12 },
  { name: "off-topic", unread: 0 },
];

const principles = [
  {
    title: "Real time, always",
    body: "Messages land the moment they are sent, with typing and presence that keep up.",
  },
  {
    title: "Public and private, one app",
    body: "Run a community in a hub, then take any conversation into a private chat.",
  },
  {
    title: "Made for your phone",
    body: "Built mobile first, so recording a voice message is one thumb away.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="max-w-2xl">
        <p className="text-sm text-muted">Features</p>
        <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
          One place for the crowd and the close circle.
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Everything you need to keep a community lively and your closest chats personal.
        </p>
      </div>

      <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-2">
        <Feature
          id="hubs"
          title="Hubs for communities"
          body="A hub is a home for your people. Invite friends, teammates or a whole fandom and give them somewhere to belong."
        >
          <div className="flex gap-3">
            {hubAvatars.map((hub) => (
              <Avatar key={hub.letter} letter={hub.letter} color={hub.color} size="lg" square />
            ))}
          </div>
        </Feature>

        <Feature
          title="Pods for every topic"
          body="Split a hub into pods so design crits never drown out launch plans. Unread counts tell you where to look."
        >
          <ul className="w-56 text-sm">
            {pods.map((pod) => (
              <li
                key={pod.name}
                className="flex items-center justify-between rounded-xl px-3 py-2 first:bg-raised"
              >
                <span>
                  <span className="mr-2 text-muted">#</span>
                  {pod.name}
                </span>
                {pod.unread > 0 && (
                  <span className="rounded-full bg-ink px-2 py-0.5 text-[0.65rem] font-semibold text-black">
                    {pod.unread}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Feature>

        <Feature
          id="voice-video"
          title="Voice messages"
          body="Say it the way you would out loud. Record, preview and send in a tap, then listen back at your own pace."
        >
          <div className="flex items-center gap-3 rounded-2xl bg-raised px-4 py-3">
            <span className="grid size-9 place-items-center rounded-full bg-ink text-black">
              <PlayIcon className="size-4 translate-x-px" />
            </span>
            <Waveform progress={60} />
            <span className="text-xs text-muted tabular-nums">0:42</span>
          </div>
        </Feature>

        <Feature
          title="Video notes"
          body="Short, round and personal. When text is too flat and a call is too much, send a quick video note."
        >
          <VideoNote duration="0:08" size={132} />
        </Feature>
      </div>

      <dl className="mt-16 grid gap-10 md:grid-cols-3">
        {principles.map((item) => (
          <div key={item.title} className="border-t border-line pt-6">
            <dt className="font-medium">{item.title}</dt>
            <dd className="mt-2 leading-relaxed text-muted">{item.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
