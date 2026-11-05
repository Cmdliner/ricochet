import { Container } from "@/components/container";
import { FeatureShowcase } from "@/components/feature-showcase";
import { Reveal } from "@/components/reveal";

export function Features() {
  return (
    <section
      id="features"
      className="relative z-10 -mt-12 rounded-t-[3rem] bg-cream pt-24 pb-28 text-cream-ink sm:pt-32 sm:pb-36"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-accent-deep">Features</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            One place for the crowd and the close circle.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-cream-muted">
            Everything you need to keep a community lively and your closest chats personal.
            Tap through to see how each piece feels.
          </p>
        </Reveal>

        <Reveal className="mt-14 sm:mt-16" delay={100}>
          <FeatureShowcase />
        </Reveal>
      </Container>
    </section>
  );
}
