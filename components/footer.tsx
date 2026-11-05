import Link from "next/link";
import { Container } from "@/components/container";
import { Logo } from "@/components/logo";
import { StoreBadge } from "@/components/store-badge";
import { FOOTER_COLUMNS, SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="pattern-dark relative z-40 -mt-12 rounded-t-[3rem] bg-canvas">
      <Container className="grid gap-12 pt-20 pb-14 lg:grid-cols-[1.6fr_1fr_1fr] lg:gap-10">
        <div className="max-w-sm">
          <Link href="/" aria-label="Ricochet home" className="inline-block">
            <Logo />
          </Link>
          <p className="mt-5 leading-relaxed text-muted">
            Real-time messaging with hubs for your communities and private chats for
            everyone else.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <StoreBadge store="ios" />
            <StoreBadge store="android" />
          </div>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-sm font-semibold">{column.title}</h2>
            <ul className="mt-5 flex flex-col gap-3.5 text-sm text-muted">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition-colors hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {SITE.year} {SITE.name}. All rights reserved.
          </p>
          <p>Made for people who talk a lot.</p>
        </Container>
      </div>
    </footer>
  );
}
