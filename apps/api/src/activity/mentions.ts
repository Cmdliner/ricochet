const MAX_MENTIONS = 20;

/** Handles written as @name. The lookbehind keeps email addresses like ada@example.com from counting. */
export function extractMentions(body: string): string[] {
  const found = new Set<string>();
  for (const match of body.toLowerCase().matchAll(/(?<![a-z0-9_])@([a-z0-9_]+)/g)) {
    if (match[1]) found.add(match[1]);
    if (found.size === MAX_MENTIONS) break;
  }
  return [...found];
}

export function previewOf(body: string | null): string | null {
  if (!body) return null;
  const text = body.replace(/\s+/g, " ").trim();
  return text.length > 140 ? `${text.slice(0, 139)}…` : text;
}
