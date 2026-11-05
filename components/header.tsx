"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { NAV_LINKS } from "@/lib/constants";
import { buttonClass, cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  // Lock page scroll and allow Escape to close while the full-screen menu is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-line bg-black/70 backdrop-blur-xl">
        <div className="grid h-16 w-full grid-cols-[1fr_auto] items-center px-5 sm:px-8 md:grid-cols-[1fr_auto_1fr] lg:px-10">
          <Link href="/" aria-label="Ricochet home" className="justify-self-start">
            <Logo />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition-colors hover:bg-raised hover:text-ink",
                  pathname === link.href ? "bg-raised text-ink" : "text-muted",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 justify-self-end">
            <Link href="/#waitlist" className={`${buttonClass()} hidden sm:inline-flex`}>
              Join the waitlist
            </Link>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(true)}
              className="grid size-10 place-items-center rounded-full border border-line md:hidden"
            >
              <MenuIcon className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 flex flex-col bg-black md:hidden"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5 sm:px-8">
            <Link href="/" aria-label="Ricochet home" onClick={close}>
              <Logo />
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={close}
              className="grid size-10 place-items-center rounded-full border border-line"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>

          <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center px-5 sm:px-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="border-b border-line py-5 font-display text-3xl font-semibold tracking-tight transition-colors hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="shrink-0 px-5 pb-8 sm:px-8">
            <Link
              href="/#waitlist"
              onClick={close}
              className={`${buttonClass({ size: "lg" })} w-full`}
            >
              Join the waitlist
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
