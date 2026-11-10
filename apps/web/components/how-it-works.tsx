import { Avatar } from "@/components/avatar";
import { Container } from "@/components/container";
import { PlayIcon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { Waveform } from "@/components/waveform";
import { AVATAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** A small piece of the app, on a light panel so it stands out from the page. */
function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className={cn("w-full max-w-[18rem] rounded-2xl border border-cream-line bg-cream-card p-3.5 text-left text-cream-ink shadow-sm", className)}
    >
      {children}
    </div>
  );
}

function CreateHubArt() {
  return (
    <Panel>
      <div className="flex items-center gap-3">
        <Avatar letter="S" color={AVATAR_COLORS.coral} size="md" square />
        <div className="flex h-10 flex-1 items-center rounded-xl bg-cream px-3 text-sm">
          Ship It
          <span className="ml-0.5 h-4 w-px bg-accent" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {[AVATAR_COLORS.coral, AVATAR_COLORS.sky, AVATAR_COLORS.mint, AVATAR_COLORS.amber].map((color, i) => (
          <span
            key={color}
            className={cn("size-6 rounded-full", i === 0 && "ring-2 ring-cream-ink ring-offset-2 ring-offset-cream-card")}
            style={{ background: color }}
          />
        ))}
        <span className="ml-auto rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-ink">Create hub</span>
      </div>
    </Panel>
  );
}

function PodsArt() {
  const pods = [
    { name: "announcements", unread: 0 },
    { name: "design-crits", unread: 3 },
    { name: "launch", unread: 12 },
  ];
  return (
    <Panel className="p-2">
      <ul className="text-sm">
        {pods.map((pod, i) => (
          <li key={pod.name} className={cn("flex items-center justify-between rounded-lg px-2.5 py-2", i === 2 && "bg-cream")}>
            <span>
              <span className="mr-1.5 text-cream-muted">#</span>
              {pod.name}
            </span>
            {pod.unread > 0 && (
              <span className="rounded-full bg-accent px-1.5 py-px text-[0.65rem] font-semibold text-accent-ink">{pod.unread}</span>
            )}
          </li>
        ))}
        <li className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-cream-muted">
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          core-team
        </li>
      </ul>
    </Panel>
  );
}

function PrivateArt() {
  return (
    <Panel className="flex flex-col gap-2.5">
      <div className="flex items-end gap-2">
        <Avatar letter="M" color={AVATAR_COLORS.coral} />
        <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md bg-cream px-3 py-2">
          <span className="grid size-7 place-items-center rounded-full bg-accent text-accent-ink">
            <PlayIcon className="size-3 translate-x-px" />
          </span>
          <Waveform progress={45} count={12} light />
          <span className="text-[0.7rem] text-cream-muted tabular-nums">0:23</span>
        </div>
      </div>
      <p className="self-end rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-ink">
        loved it, sending one back
      </p>
    </Panel>
  );
}

const steps = [
  { title: "Start a hub", body: "Name it, pick a colour and invite your people.", Art: CreateHubArt },
  { title: "Add pods", body: "A room for every topic, open to all or kept private.", Art: PodsArt },
  { title: "Take it one to one", body: "Voice notes and video notes, just between the two of you.", Art: PrivateArt },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-cream py-14 text-cream-ink sm:py-20 lg:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            tone="light"
            eyebrow="How it works"
            title="Three bounces from hello to private chat."
            body="No setup maze. Start a hub, split it into pods, and take any conversation one to one."
          />
        </Reveal>

        <div className="relative mt-9 sm:mt-14 lg:mt-20">
          {/* The ricochet: a dashed line that bounces from stop to stop. Only drawn when the stops sit side by side. */}
          <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-0 top-5 hidden h-14 w-full lg:block">
            <polyline
              className="dash-march"
              points="16.67,0 50,100 83.33,0"
              fill="none"
              stroke="#e9714e"
              strokeWidth="2"
              strokeDasharray="2 8"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <ol className="relative flex flex-col lg:grid lg:grid-cols-3 lg:gap-10">
            {steps.map((step, index) => (
              <li key={step.title} className={cn("lg:mt-0", index === 1 && "lg:pt-14")}>
                <Reveal
                  delay={index * 120}
                  className="relative grid grid-cols-[2.5rem_1fr] gap-x-4 pb-9 last:pb-0 lg:flex lg:flex-col lg:items-center lg:gap-0 lg:pb-0 lg:text-center"
                >
                  {/* On a phone the markers are joined by a thin dashed rail down the left. */}
                  {index < steps.length - 1 && (
                    <span aria-hidden="true" className="absolute top-10 bottom-0 left-5 w-px -translate-x-1/2 border-l border-dashed border-accent/60 lg:hidden" />
                  )}
                  <span className="relative z-10 grid size-10 place-items-center rounded-full bg-accent font-display text-base font-semibold text-accent-ink ring-8 ring-cream lg:size-12 lg:text-lg">
                    {index + 1}
                  </span>
                  <div className="lg:mt-6 lg:flex lg:flex-col lg:items-center">
                    <h3 className="font-display text-xl leading-10 font-semibold tracking-tight lg:leading-tight">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-cream-muted sm:text-base lg:max-w-xs">{step.body}</p>
                    <div className="mt-4 lg:mt-6 lg:flex lg:justify-center">
                      <step.Art />
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
