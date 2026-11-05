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
    <section
      id="how-it-works"
      className="relative z-20 -mt-12 rounded-t-[3rem] bg-teal-deep pt-24 pb-32 text-ink sm:pt-32 sm:pb-40"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-accent">How it works</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            From first hub to private chat.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink/70">
            Three steps, and a conversation that keeps bouncing along.
          </p>
        </div>

        <div className="relative mt-16 sm:mt-20">
          {/* The bounce: a dashed path that ricochets between the steps. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 100 140"
            preserveAspectRatio="none"
            className="absolute inset-x-0 top-0 hidden h-[140px] w-full md:block"
          >
            <polyline
              points="16.67,24 50,116 83.33,24"
              fill="none"
              stroke="#e9714e"
              strokeWidth="2"
              strokeDasharray="2 8"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <ol className="relative grid gap-8 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className={`rounded-3xl border border-teal-line bg-teal-raised p-7 text-center md:mt-0 md:border-0 md:bg-transparent md:p-0 ${
                  index === 1 ? "md:mt-[92px]" : ""
                }`}
              >
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent font-display text-lg font-semibold text-accent-ink ring-8 ring-teal-deep">
                  {index + 1}
                </span>
                <h3 className="mt-6 font-display text-xl font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mx-auto mt-2 max-w-xs leading-relaxed text-ink/70">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
