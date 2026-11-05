import Link from "next/link";
import { Container } from "@/components/container";
import { Logo } from "@/components/logo";
import { FOOTER_COLUMNS, SITE, STORES } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <Container className="grid gap-12 py-16 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-8">
        <div className="max-w-sm">
          <Link href="/" aria-label="Ricochet home" className="inline-block">
            <Logo />
          </Link>
          <p className="mt-5 leading-relaxed text-muted">
            Real-time messaging with hubs for your communities and private chats for
            everyone else.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {STORES.map((store) => (
              <li
                key={store.id}
                className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-xs text-muted"
              >
                {store.store}
                <span className="text-accent">Soon</span>
              </li>
            ))}
          </ul>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-sm font-medium">{column.title}</h2>
            <ul className="mt-5 flex flex-col gap-3.5 text-sm text-muted">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition-colors hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>

      <div className="border-t border-line">
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
