"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MenuIcon } from "@/components/icons";
import { Wordmark } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { NAV_LINKS } from "@/lib/constants";
import { buttonClass, cn } from "@/lib/utils";

/** Where the sliding highlight sits, measured from the link you are pointing at. */
type Highlight = { left: number; width: number } | null;

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [highlight, setHighlight] = useState<Highlight>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* A floating pill instead of a full-width bar. It starts wide, then tightens and gains a
          frosted background once you scroll, so it never feels like a heavy strip across the page. */}
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
        <div
          style={{ maxWidth: scrolled ? 880 : 1180 }}
          className={cn(
            "mx-auto flex h-14 items-center justify-between gap-4 rounded-full border pr-2 pl-5 backdrop-blur-xl",
            "transition-[max-width,background-color,border-color,box-shadow] duration-500 ease-out",
            scrolled
              ? "border-white/15 bg-canvas/80 shadow-2xl shadow-black/40"
              : "border-transparent bg-transparent md:border-white/10 md:bg-canvas/40",
          )}
        >
          <Link href="/" aria-label="Ricochet home" className="shrink-0">
            <Wordmark className="text-[1.7rem]" />
          </Link>

          <nav
            aria-label="Primary"
            onMouseLeave={() => setHighlight(null)}
            className="relative hidden items-center md:flex"
          >
            {highlight ? (
              <span
                aria-hidden="true"
                style={{ left: highlight.left, width: highlight.width }}
                className="absolute inset-y-0 rounded-full bg-white/10 transition-[left,width] duration-300 ease-out"
              />
            ) : null}
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                onMouseEnter={(e) =>
                  setHighlight({ left: e.currentTarget.offsetLeft, width: e.currentTarget.offsetWidth })
                }
                onFocus={(e) =>
                  setHighlight({ left: e.currentTarget.offsetLeft, width: e.currentTarget.offsetWidth })
                }
                className={cn(
                  "relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  pathname === link.href ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link href="/#waitlist" className={`${buttonClass()} sheen max-sm:hidden`}>
              Join the waitlist
            </Link>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(true)}
              className="grid size-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/15 md:hidden"
            >
              <MenuIcon className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {open && <MobileMenu onClose={() => setOpen(false)} />}
    </>
  );
}
