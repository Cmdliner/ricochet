import { Container } from "@/components/container";

const steps = [
  {
    title: "Start a hub",
    body: "Name it, invite your people and set the tone for your community.",
  },
  {
    title: "Organise with pods",
    body: "Give every topic its own pod, from announcements to off-topic banter.",
  },
  {
    title: "Go private when it matters",
    body: "Take a conversation one to one with voice messages and video notes.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-line bg-surface py-24 sm:py-32">
      <Container>
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-accent">How it works</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            From first hub to private chat.
          </h2>
        </div>

        <ol className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
          <span
            aria-hidden="true"
            className="absolute top-5 right-[16.6%] left-5 hidden h-px bg-white/20 md:block"
          />
          {steps.map((step, index) => (
            <li key={step.title} className="relative">
              <span className="relative grid size-10 place-items-center rounded-full bg-accent font-display font-semibold text-accent-ink">
                {index + 1}
              </span>
              <h3 className="mt-6 font-display text-xl font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
