import Link from "next/link";
import { Logo } from "@/components/logo";
import { FOOTER_COLUMNS, SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-auto overflow-hidden border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-12 px-5 pt-16 pb-12 sm:px-8 md:flex-row">
        <div className="max-w-xs">
          <Link href="/" aria-label="Ricochet home">
            <Logo />
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Real-time messaging for communities and close friends.
          </p>
        </div>

        <div className="flex gap-16 sm:gap-28">
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="mb-5 text-sm text-muted">{column.title}</h2>
              <ul className="flex flex-col gap-3.5 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-muted">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <p className="px-5 pb-6 text-center text-sm text-muted">
        © {SITE.year} {SITE.name}. All rights reserved.
      </p>

      <div
        aria-hidden="true"
        className="pointer-events-none h-[13vw] max-h-[190px] overflow-hidden text-center select-none"
      >
        <p className="font-display text-[21vw] leading-[0.82] font-semibold tracking-tighter text-raised sm:text-[19vw] lg:text-[17.5rem]">
          ricochet
        </p>
      </div>
    </footer>
  );
}
