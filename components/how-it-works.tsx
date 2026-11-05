import { Avatar } from "@/components/avatar";
import { Container } from "@/components/container";
import { PlusIcon } from "@/components/icons";
import { Waveform } from "@/components/waveform";
import { AVATAR_COLORS } from "@/lib/constants";

function CreateHubArt() {
  return (
    <div className="flex w-full max-w-[15rem] flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-3">
        <Avatar letter="S" color={AVATAR_COLORS.coral} size="md" square />
        <div className="flex h-10 flex-1 items-center rounded-xl bg-raised px-3 text-sm">
          Ship It
          <span className="ml-0.5 h-4 w-px bg-accent" />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Avatar letter="M" color={AVATAR_COLORS.mint} />
        <Avatar letter="J" color={AVATAR_COLORS.sky} />
        <Avatar letter="D" color={AVATAR_COLORS.amber} />
        <span className="grid size-8 place-items-center rounded-full border border-dashed border-line text-muted">
          <PlusIcon className="size-4" />
        </span>
        <span className="ml-auto rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-ink">
          Create
        </span>
      </div>
    </div>
  );
}

function PodsArt() {
  const pods = [
    { name: "announcements", unread: 0 },
    { name: "design-crits", unread: 3 },
    { name: "launch", unread: 12 },
    { name: "off-topic", unread: 0 },
  ];
  return (
    <ul className="w-full max-w-[15rem] rounded-2xl border border-line bg-surface p-2 text-sm">
      {pods.map((pod, i) => (
        <li
          key={pod.name}
          className={`flex items-center justify-between rounded-xl px-3 py-2 ${i === 2 ? "bg-raised" : ""}`}
        >
          <span>
            <span className="mr-2 text-muted">#</span>
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
  );
}

function PrivateArt() {
  return (
    <div className="flex w-full max-w-[15rem] flex-col gap-3 text-sm">
      <div className="flex items-center gap-2.5">
        <Avatar letter="M" color={AVATAR_COLORS.coral} />
        <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md bg-raised px-3 py-2">
          <span className="grid size-7 place-items-center rounded-full bg-accent text-accent-ink">
            <svg viewBox="0 0 24 24" className="size-3 translate-x-px" fill="currentColor" aria-hidden="true">
              <path d="M8 5.2v13.6a.6.6 0 0 0 .9.5l11-6.8a.6.6 0 0 0 0-1l-11-6.8a.6.6 0 0 0-.9.5Z" />
            </svg>
          </span>
          <Waveform progress={45} count={12} />
        </div>
      </div>
      <p className="self-end rounded-2xl rounded-br-md bg-accent px-3.5 py-2 font-medium text-accent-ink">
        loved it, sending one back
      </p>
    </div>
  );
}

const steps = [
  {
    title: "Start a hub",
    body: "Name it, invite your people and set the tone for your community.",
    Art: CreateHubArt,
  },
  {
    title: "Organise with pods",
    body: "Give every topic its own pod, from announcements to off-topic banter.",
    Art: PodsArt,
  },
  {
    title: "Go private when it matters",
    body: "Take a conversation one to one with voice messages and video notes.",
    Art: PrivateArt,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="pattern-dark relative z-20 -mt-12 rounded-t-[3rem] bg-canvas pt-24 pb-32 text-ink sm:pt-32 sm:pb-40"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-accent">How it works</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            From first hub to private chat.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Three steps, and a conversation that keeps bouncing along.
          </p>
        </div>

        <div className="relative mt-16 sm:mt-20">
          {/* The bounce: a dashed path that ricochets between the step badges. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 100 96"
            preserveAspectRatio="none"
            className="absolute inset-x-0 top-6 hidden h-24 w-full md:block"
          >
            <polyline
              points="16.67,0 50,96 83.33,0"
              fill="none"
              stroke="#e9714e"
              strokeWidth="2"
              strokeDasharray="2 8"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => (
              <li key={step.title} className={`text-center ${index === 1 ? "md:mt-24" : ""}`}>
                <span className="relative mx-auto grid size-12 place-items-center rounded-full bg-accent font-display text-lg font-semibold text-accent-ink ring-8 ring-canvas">
                  {index + 1}
                </span>
                <div className="pattern-dark mt-6 grid h-52 place-items-center overflow-hidden rounded-3xl border border-line bg-black p-5">
                  <step.Art />
                </div>
                <h3 className="mt-7 font-display text-xl font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mx-auto mt-2 max-w-xs leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
