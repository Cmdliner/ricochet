"use client";

import { useState } from "react";
import { Container } from "@/components/container";
import { LogoMark } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { VoiceSticker } from "@/components/voice-sticker";
import { waitlistSchema } from "@ricochet/shared";
import { buttonClass } from "@/lib/utils";


export function Waitlist() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = waitlistSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }
    setError(null);
    // TODO: send `result.data.email` to the waitlist backend once one exists.
    setDone(true);
  }

  return (
    <section
      id="waitlist"
      className="pattern-light relative z-30 -mt-12 overflow-hidden rounded-t-[3rem] bg-accent pt-14 pb-20 text-center text-accent-ink sm:pt-32 sm:pb-40"
    >
      <VoiceSticker className="absolute top-32 left-[6%] hidden -rotate-6 items-center gap-3 rounded-2xl bg-cream-card px-4 py-3 shadow-xl shadow-black/15 lg:flex" />
      <div
        aria-hidden="true"
        className="float absolute right-[7%] bottom-40 hidden rotate-6 rounded-2xl bg-accent-ink px-4 py-3 text-sm text-ink shadow-xl shadow-black/20 lg:block"
      >
        see you inside 👋
      </div>

      <Container className="relative">
        <Reveal>
          <LogoMark inverse className="mx-auto size-11 sm:size-14" />
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold tracking-[-0.03em] text-balance sm:mt-8 sm:text-6xl">
            Be first through the door.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-accent-ink/80 sm:mt-5 sm:text-lg">
            Leave your email and we will let you know the moment Ricochet is ready.
          </p>

          {done ? (
            <p
              role="status"
              className="fade-up mx-auto mt-6 max-w-md rounded-2xl bg-accent-ink px-5 py-4 text-ink sm:mt-10"
            >
              You are on the list. Talk soon.
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              noValidate
              className="mx-auto mt-6 flex w-full max-w-md flex-col gap-3 sm:mt-10 sm:flex-row"
            >
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={error !== null}
                aria-describedby={error ? "email-error" : undefined}
                className="h-12 w-full rounded-full bg-cream-card px-5 text-base text-cream-ink placeholder:text-cream-muted/70 focus:outline-2 focus:outline-accent-ink aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-[#8f1d1d] sm:flex-1"
              />
              <button
                type="submit"
                className={`${buttonClass({ variant: "dark", size: "lg" })} sheen w-full cursor-pointer sm:w-auto`}
              >
                Notify me
              </button>
            </form>
          )}
          {error && (
            <p id="email-error" role="alert" className="mt-3 text-sm font-medium text-[#6e1313]">
              {error}
            </p>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
