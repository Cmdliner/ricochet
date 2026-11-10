import Link from "next/link";
import { Container } from "@/components/container";
import { Credit } from "@/components/credit";
import { Logo } from "@/components/logo";
import { StoreBadge } from "@/components/store-badge";
import { FOOTER_COLUMNS, SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-line bg-canvas">
      <Container className="grid gap-8 pt-10 pb-8 sm:pt-16 sm:pb-12 lg:grid-cols-[1.6fr_1fr_1fr] lg:gap-10">
        <div className="max-w-sm">
          <Link href="/" aria-label="Ricochet home" className="inline-block">
            <Logo />
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
            Real-time messaging with hubs for your communities and private chats for
            everyone else.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <StoreBadge store="ios" />
            <StoreBadge store="android" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:contents">
        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-sm font-semibold">{column.title}</h2>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm text-muted sm:mt-5 sm:gap-3.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="inline-block transition duration-200 hover:translate-x-1 hover:text-accent">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="grid gap-2 py-4 text-center text-sm text-muted sm:grid-cols-3 sm:items-center sm:py-6">
          <p className="sm:text-left">
            © {SITE.year} {SITE.name}. All rights reserved.
          </p>
          <Credit />
          <span aria-hidden="true" className="max-sm:hidden" />
        </Container>
      </div>
    </footer>
  );
}
