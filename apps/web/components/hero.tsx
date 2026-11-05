import Link from "next/link";
import { PhoneMockups } from "@/components/phone-mockups";
import { buttonClass } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative z-0 overflow-hidden bg-canvas">
      <div className="mx-auto max-w-4xl px-5 pt-10 text-center sm:px-8 sm:pt-16">
        <h1 className="font-display text-[2.9rem] leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:text-7xl">
          Conversations that <span className="text-accent">bounce</span> right back.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-pretty text-muted">
          Hubs for your communities. Voice and video notes for everyone else.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/#waitlist" className={`${buttonClass({ size: "lg" })} sheen`}>
            Join the waitlist
          </Link>
          <Link href="/download" className={buttonClass({ variant: "secondary", size: "lg" })}>
            Get the app
          </Link>
        </div>
      </div>

      <div className="relative mt-12 sm:mt-14">
        {/* A quiet stage for the phones: one flat disc, a hairline ring, and the ball that ricocheted off it. */}
        <div aria-hidden="true" className="pointer-events-none absolute top-24 left-1/2 aspect-square w-[150vw] max-w-[1180px] -translate-x-1/2 sm:top-20">
          <span className="absolute inset-0 rounded-full bg-surface" />
          <span className="absolute -inset-[7%] rounded-full border border-line" />
          <span className="float absolute top-[3.5%] left-[8%] size-5 rounded-full bg-accent" />
        </div>
        <PhoneMockups />
      </div>
    </section>
  );
}
