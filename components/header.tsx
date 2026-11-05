"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MenuIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { NAV_LINKS } from "@/lib/constants";
import { buttonClass, cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-canvas/75 backdrop-blur-xl">
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
                  "rounded-full px-4 py-2 text-sm transition-colors hover:bg-white/10 hover:text-ink",
                  pathname === link.href ? "bg-white/10 text-ink" : "text-muted",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 justify-self-end">
            <Link href="/#waitlist" className={`${buttonClass()} max-sm:hidden`}>
              Join the waitlist
            </Link>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(true)}
              className="grid size-10 place-items-center rounded-full bg-raised transition-colors hover:bg-line md:hidden"
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
