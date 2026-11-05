"use client";

import { useState } from "react";
import { Container } from "@/components/container";
import { MicIcon } from "@/components/icons";
import { LogoMark } from "@/components/logo";
import { Waveform } from "@/components/waveform";
import { buttonClass, isValidEmail } from "@/lib/utils";

export function Waitlist() {
  const [status, setStatus] = useState<"idle" | "invalid" | "done">("idle");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    if (!isValidEmail(email)) {
      setStatus("invalid");
      return;
    }
    // TODO: send `email` to the waitlist backend once one exists.
    setStatus("done");
  }

  return (
    <section
      id="waitlist"
      className="pattern-light relative z-30 -mt-12 overflow-hidden rounded-t-[3rem] bg-accent pt-24 pb-32 text-center text-accent-ink sm:pt-32 sm:pb-40"
    >
      {/* Playful stickers that echo the product. Decorative only. */}
      <div
        aria-hidden="true"
        className="absolute top-32 left-[6%] hidden -rotate-6 items-center gap-3 rounded-2xl bg-cream-card px-4 py-3 shadow-xl shadow-black/15 lg:flex"
      >
        <span className="grid size-9 place-items-center rounded-full bg-accent-ink text-ink">
          <MicIcon className="size-4" />
        </span>
        <span className="[&_span]:bg-accent-ink/25">
          <Waveform progress={65} count={14} />
        </span>
        <span className="text-xs text-cream-muted tabular-nums">0:14</span>
      </div>
      <div
        aria-hidden="true"
        className="absolute right-[7%] bottom-40 hidden rotate-6 rounded-2xl bg-accent-ink px-4 py-3 text-sm text-ink shadow-xl shadow-black/20 lg:block"
      >
        see you inside 👋
      </div>

      <Container className="relative">
        <LogoMark inverse className="mx-auto size-14" />
        <h2 className="mx-auto mt-8 max-w-2xl font-display text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
          Be first through the door.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-accent-ink/80">
          Leave your email and we will let you know the moment Ricochet is ready.
        </p>

        {status === "done" ? (
          <p role="status" className="mx-auto mt-10 max-w-md rounded-2xl bg-accent-ink px-5 py-4 text-ink">
            You are on the list. Talk soon.
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            noValidate
            className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
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
              aria-invalid={status === "invalid"}
              aria-describedby={status === "invalid" ? "email-error" : undefined}
              className="h-12 flex-1 rounded-full bg-cream-card px-5 text-cream-ink placeholder:text-cream-muted/70 focus:outline-2 focus:outline-accent-ink aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-[#8f1d1d]"
            />
            <button type="submit" className={`${buttonClass({ variant: "dark", size: "lg" })} sheen`}>
              Notify me
            </button>
          </form>
        )}
        {status === "invalid" && (
          <p id="email-error" role="alert" className="mt-3 text-sm font-medium text-[#6e1313]">
            That email does not look right. Mind checking it?
          </p>
        )}
      </Container>
    </section>
  );
}
