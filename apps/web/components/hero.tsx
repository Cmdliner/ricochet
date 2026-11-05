import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { PhoneMockups } from "@/components/phone-mockups";
import { buttonClass } from "@/lib/utils";

export function Hero() {
  return (
    <section className="bg-hero-scene relative z-0 overflow-hidden">
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

      {/* Decorative shapes at the edges, kept as elements so they are never cropped. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        <span className="absolute top-[40%] left-[5%] size-24 rounded-full bg-accent" />
        <span className="absolute top-[36%] left-[11%] size-6 rounded-full bg-ink/90" />
        <span className="absolute top-[56%] left-[3%] flex items-center gap-2.5 rounded-3xl rounded-bl-lg bg-raised px-6 py-5">
          <span className="size-2.5 rounded-full bg-accent" />
          <span className="size-2.5 rounded-full bg-accent" />
          <span className="size-2.5 rounded-full bg-accent" />
        </span>
        <span className="absolute top-[42%] right-[6%] size-16 rounded-full bg-accent-deep/80" />
        <span className="absolute top-[37%] right-[12%] size-5 rounded-full bg-accent" />
        <span className="absolute top-[60%] right-[2%] flex w-32 flex-col gap-2.5 rounded-3xl rounded-br-lg bg-accent px-5 py-4">
          <span className="h-2.5 w-full rounded-full bg-accent-ink/85" />
          <span className="h-2.5 w-2/3 rounded-full bg-accent-ink/50" />
        </span>
      </div>

      <div className="relative mt-14 sm:mt-16">
        <PhoneMockups />
      </div>
    </section>
  );
}
