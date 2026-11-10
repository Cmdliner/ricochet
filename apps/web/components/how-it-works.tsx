import { Avatar } from "@/components/avatar";
import { Container } from "@/components/container";
import { PlayIcon } from "@/components/icons";
import { LogoMark } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { Waveform } from "@/components/waveform";
import { AVATAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const steps = [
  { title: "Start a hub", body: "Name it, pick a colour and invite your people." },
  { title: "Add pods", body: "A room for every topic, open to all or kept private." },
  { title: "Take it one to one", body: "Voice notes and video notes, just between the two of you." },
];

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[0.7rem] font-medium tracking-wider text-muted uppercase">
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function Bot({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-2.5">
      <LogoMark className="size-8 shrink-0" />
      <div className="flex min-w-0 flex-col gap-2">{children}</div>
    </div>
  );
}

function Bubble({ children }: { children: React.ReactNode }) {
  return <p className="w-fit max-w-full rounded-2xl rounded-bl-md bg-raised px-3.5 py-2 text-sm leading-relaxed">{children}</p>;
}

function CreateHubCard() {
  return (
    <div className="w-full max-w-[17rem] rounded-2xl border border-line bg-canvas p-3">
      <div className="flex items-center gap-3">
        <Avatar letter="S" color={AVATAR_COLORS.coral} size="md" square />
        <div className="flex h-10 flex-1 items-center rounded-xl bg-raised px-3 text-sm">
          Ship It
          <span className="ml-0.5 h-4 w-px bg-accent" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {[AVATAR_COLORS.coral, AVATAR_COLORS.sky, AVATAR_COLORS.mint, AVATAR_COLORS.amber].map((color, i) => (
          <span key={color} className={cn("size-6 rounded-full", i === 0 && "ring-2 ring-ink ring-offset-2 ring-offset-canvas")} style={{ background: color }} />
        ))}
        <span className="ml-auto rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-ink">Create hub</span>
      </div>
    </div>
  );
}

function PodList() {
  const pods = [
    { name: "announcements", unread: 0 },
    { name: "design-crits", unread: 3 },
    { name: "launch", unread: 12 },
  ];
  return (
    <ul className="w-full max-w-[17rem] rounded-2xl border border-line bg-canvas p-2 text-sm">
      {pods.map((pod, i) => (
        <li key={pod.name} className={cn("flex items-center justify-between rounded-lg px-2.5 py-1.5", i === 2 && "bg-raised")}>
          <span>
            <span className="mr-1.5 text-muted">#</span>
            {pod.name}
          </span>
          {pod.unread > 0 && <span className="rounded-full bg-accent px-1.5 py-px text-[0.65rem] font-semibold text-accent-ink">{pod.unread}</span>}
        </li>
      ))}
      <li className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-muted">
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        core-team
      </li>
    </ul>
  );
}

function Thread() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <LogoMark className="size-7" />
        <div className="leading-tight">
          <p className="text-sm font-semibold"># welcome</p>
          <p className="text-[0.7rem] text-muted">Ricochet · 3 steps</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-[0.7rem] text-muted">
          <span className="size-2 rounded-full bg-[#5dd39e]" />
          live
        </span>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <Chip>Step 1 · Start a hub</Chip>
        <Bot>
          <Bubble>Name it, pick a colour and invite your people.</Bubble>
          <CreateHubCard />
        </Bot>

        <Chip>Step 2 · Add pods</Chip>
        <Bot>
          <Bubble>A room for every topic. Keep some private.</Bubble>
          <PodList />
        </Bot>

        <Chip>Step 3 · Go private</Chip>
        <div className="flex items-end gap-2">
          <Avatar letter="M" color={AVATAR_COLORS.coral} />
          <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md bg-raised px-3 py-2">
            <span className="grid size-7 place-items-center rounded-full bg-accent text-accent-ink">
              <PlayIcon className="size-3 translate-x-px" />
            </span>
            <Waveform progress={45} count={14} />
            <span className="text-[0.7rem] text-muted tabular-nums">0:23</span>
          </div>
        </div>
        <p className="w-fit self-end rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-ink">loved it, sending one back</p>
        <div className="flex items-end gap-2">
          <Avatar letter="M" color={AVATAR_COLORS.coral} />
          <span className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-raised px-3.5 py-3">
            <span className="typing-dot size-1.5 rounded-full bg-muted" />
            <span className="typing-dot size-1.5 rounded-full bg-muted [animation-delay:150ms]" />
            <span className="typing-dot size-1.5 rounded-full bg-muted [animation-delay:300ms]" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-canvas pt-12 pb-16 text-ink sm:pt-24 sm:pb-28 lg:pt-28 lg:pb-32"
    >
      <Container className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-20">
        <Reveal className="lg:sticky lg:top-28">
          <p className="text-sm font-semibold text-accent">How it works</p>
          <h2 className="mt-2 font-display text-[1.85rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:mt-3 sm:text-5xl">
            Three bounces from hello to private chat.
          </h2>
          <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-muted sm:text-lg">
            No setup maze. Start a hub, split it into pods, and take any conversation one to one.
          </p>

          <ol className="relative mt-10 hidden flex-col gap-8 lg:flex">
            <span aria-hidden="true" className="absolute top-8 bottom-8 left-5 border-l border-dashed border-accent/50" />
            {steps.map((step, index) => (
              <li key={step.title} className="relative flex items-start gap-5">
                <span className="relative z-10 w-10 bg-canvas py-1 text-center font-display text-4xl leading-none font-semibold text-transparent [-webkit-text-stroke:1.5px_var(--accent)]">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-1 max-w-xs text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={100}>
          <Thread />
        </Reveal>
      </Container>
    </section>
  );
}
