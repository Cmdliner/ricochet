import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { PhoneMockups } from "@/components/phone-mockups";
import { buttonClass, cn } from "@/lib/utils";

function Tile({ className, delay, children }: { className?: string; delay: string; children: React.ReactNode }) {
  return (
    <div aria-hidden="true" className={cn("float absolute hidden md:block", className)} style={{ animationDelay: delay }}>
      {children}
    </div>
  );
}

function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
      <path d="M24 4v40M5 14l38 20M43 14 5 34" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative z-0 overflow-hidden bg-canvas">
      <div className="relative mx-auto max-w-6xl px-5 pt-8 text-center sm:px-8 sm:pt-14">
        <Tile className="top-10 left-2 -rotate-[8deg] lg:left-10" delay="0s">
          <div className="rounded-3xl bg-raised p-2 shadow-2xl shadow-black/50">
            <Avatar letter="M" color="#f3a5a5" size="lg" square />
          </div>
        </Tile>
        <Tile className="top-24 right-2 rotate-[7deg] lg:right-10" delay="1.2s">
          <div className="rounded-3xl bg-raised p-2 shadow-2xl shadow-black/50">
            <Avatar letter="J" color="#8fe0bd" size="lg" square />
          </div>
        </Tile>
        <Tile className="top-[17rem] left-0 rotate-[-4deg] lg:left-16" delay="2.1s">
          <div className="flex items-center gap-2 rounded-full bg-raised py-2 pr-4 pl-2 text-sm font-semibold shadow-2xl shadow-black/50">
            <span className="grid size-7 place-items-center rounded-full bg-accent text-xs text-accent-ink">🔥</span>
            4
          </div>
        </Tile>
        <Tile className="top-[19rem] right-0 rotate-[3deg] lg:right-14" delay="0.6s">
          <div className="flex items-center gap-2.5 rounded-full bg-accent py-2 pr-4 pl-2 shadow-2xl shadow-black/50">
            <span className="grid size-7 place-items-center rounded-full bg-accent-ink text-ink">
              <svg viewBox="0 0 12 12" className="size-3 fill-current" aria-hidden="true">
                <path d="M3 1.5v9l7.5-4.5z" />
              </svg>
            </span>
            <span className="flex h-4 items-center gap-[3px]">
              {[6, 12, 8, 15, 10, 5, 13, 7].map((h, i) => (
                <span key={i} className="w-[3px] rounded-full bg-accent-ink/70" style={{ height: h }} />
              ))}
            </span>
            <span className="text-xs font-semibold text-accent-ink">0:14</span>
          </div>
        </Tile>

        <div aria-hidden="true" className="mb-6 flex items-center justify-center gap-3 md:hidden">
          <div className="-rotate-[8deg] rounded-2xl bg-raised p-1.5 shadow-xl shadow-black/50">
            <Avatar letter="M" color="#f3a5a5" size="md" square />
          </div>
          <div className="flex rotate-[3deg] items-center gap-2 rounded-full bg-accent py-1.5 pr-3.5 pl-1.5 shadow-xl shadow-black/50">
            <span className="grid size-6 place-items-center rounded-full bg-accent-ink text-ink">
              <svg viewBox="0 0 12 12" className="size-2.5 fill-current">
                <path d="M3 1.5v9l7.5-4.5z" />
              </svg>
            </span>
            <span className="flex h-3.5 items-center gap-[3px]">
              {[5, 10, 7, 12, 8, 4, 10].map((h, i) => (
                <span key={i} className="w-[3px] rounded-full bg-accent-ink/70" style={{ height: h }} />
              ))}
            </span>
            <span className="text-xs font-semibold text-accent-ink">0:14</span>
          </div>
          <div className="rotate-[7deg] rounded-2xl bg-raised p-1.5 shadow-xl shadow-black/50">
            <Avatar letter="J" color="#8fe0bd" size="md" square />
          </div>
        </div>

        <h1 className="relative font-display text-[3.5rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[6rem] lg:text-[8rem]">
          Chat that
          <br />
          <span className="text-accent">bounces back.</span>
          <Spark className="absolute -top-2 -right-1 hidden size-10 text-accent md:block lg:-right-6 lg:size-12" />
        </h1>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row">
          <Link href="/#waitlist" className={`${buttonClass({ size: "lg" })} sheen`}>
            Join the waitlist
          </Link>
          <Link href="/download" className={buttonClass({ variant: "secondary", size: "lg" })}>
            Get the app
          </Link>
        </div>

        <p className="mt-6 text-sm text-muted lg:hidden">Hubs, pods, voice and video notes.</p>

        <p
          aria-hidden="true"
          className="absolute right-6 bottom-[-3.5rem] hidden rotate-[4deg] text-left text-sm leading-snug text-muted lg:block xl:right-16"
        >
          hubs, pods, voice
          <br />
          &amp; video notes
          <svg viewBox="0 0 24 24" className="mt-1 mr-3 ml-auto size-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 4c9 0 13 4 12 14M13 14l4 5 4-5" />
          </svg>
        </p>
      </div>

      <div className="relative mt-10 sm:mt-14">
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
