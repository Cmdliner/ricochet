import type { LegalContent } from "@/lib/legal/types";

export function LegalDocument({ content }: { content: LegalContent }) {
  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
      <h1 className="font-display text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
        {content.title}
      </h1>
      <p className="mt-4 text-sm text-muted">Last updated {content.updated}</p>
      <p className="mt-10 text-lg leading-relaxed text-muted">{content.intro}</p>

      <div className="mt-14 space-y-12">
        {content.sections.map((section, index) => (
          <section key={section.heading} aria-labelledby={`section-${index + 1}`}>
            <h2
              id={`section-${index + 1}`}
              className="font-display text-xl font-semibold tracking-tight"
            >
              {index + 1}. {section.heading}
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-muted">
              {section.paragraphs?.map((text) => <p key={text}>{text}</p>)}
              {section.list && (
                <ul className="list-disc space-y-2 pl-5 marker:text-line">
                  {section.list.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
