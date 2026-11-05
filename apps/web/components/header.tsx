"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MenuIcon } from "@/components/icons";
import { Wordmark } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Phase = "top" | "hidden" | "shown";

export function Header() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("top");
  const lastY = useRef(0);
  const pathname = usePathname();

  // Desktop only: the header steps out of the way as you read down, and returns when you scroll
  // back up. On a phone it stays pinned and looks the same at every scroll position, with no background.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 24) setPhase("top");
      else if (y > lastY.current + 4) setPhase("hidden");
      else if (y < lastY.current - 4) setPhase("shown");
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 md:transition-[transform,background-color,border-color] md:duration-500 md:ease-out",
          "border-b border-transparent",
          phase === "hidden" && "md:-translate-y-full",
          phase === "shown" && "md:border-white/10 md:bg-canvas/75 md:backdrop-blur-xl",
        )}
      >
        <div className="mx-auto flex h-20 max-w-[88rem] items-center justify-between px-6 md:h-[4.5rem] md:px-10">
          <Link href="/" aria-label="Ricochet home" className="shrink-0 rounded-full border border-white/10 bg-canvas/60 px-4 py-1.5 backdrop-blur-md md:border-transparent md:bg-transparent md:p-0 md:backdrop-blur-none">
            <Wordmark className="text-[1.9rem] md:text-[1.8rem]" />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-10 md:flex">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className="group/link relative flex items-baseline gap-2 py-2 text-[0.95rem] font-medium text-muted transition-colors hover:text-ink"
              >
                <span className="text-[0.65rem] tracking-widest text-accent tabular-nums">0{i + 1}</span>
                {link.label}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-ink transition-transform duration-300 ease-out group-hover/link:scale-x-100"
                />
              </Link>
            ))}

            <Link
              href="/#waitlist"
              className="group/cta flex items-center gap-2.5 border-l border-white/15 py-2 pl-10 text-[0.95rem] font-semibold text-ink"
            >
              Join the waitlist
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-full bg-accent text-accent-ink transition-transform duration-300 group-hover/cta:-rotate-45"
              >
                →
              </span>
            </Link>
          </nav>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
            className="grid size-11 place-items-center rounded-full border border-white/10 bg-canvas/60 backdrop-blur-md md:hidden"
          >
            <MenuIcon className="size-6" />
          </button>
        </div>
      </header>

      {open && <MobileMenu onClose={() => setOpen(false)} />}
    </>
  );
}
