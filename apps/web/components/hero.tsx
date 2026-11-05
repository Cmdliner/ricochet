import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { PhoneMockups } from "@/components/phone-mockups";
import { buttonClass } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative z-0 overflow-hidden bg-canvas">
      <div className="mx-auto max-w-4xl px-5 pt-16 text-center sm:px-8 sm:pt-24">
        <Link
          href="/#waitlist"
          className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/80 py-1.5 pr-3.5 pl-2 text-sm text-muted backdrop-blur transition-colors hover:text-ink"
        >
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-ink">
            New
          </span>
          Early access opens soon
          <ArrowRightIcon className="size-3.5" />
        </Link>

        <h1 className="mt-8 font-display text-[2.9rem] leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:text-7xl">
          Conversations that <span className="text-accent">bounce</span> right back.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted">
          Ricochet is real-time messaging with hubs for your communities and private
          chats for everyone else. Send a voice message, drop a video note, keep the
          thread moving.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/#waitlist" className={`${buttonClass({ size: "lg" })} sheen`}>
            Join the waitlist
          </Link>
          <Link href="/download" className={buttonClass({ variant: "secondary", size: "lg" })}>
            Get the app
          </Link>
        </div>
        <p className="mt-5 text-sm text-muted">Coming to iOS and Android.</p>
      </div>

      <div className="relative mt-14 sm:mt-16">
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
