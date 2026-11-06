/** Turns what a person typed into text that is safe inside a LIKE pattern, so "50%" or "a_b" match literally. */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (match) => `\\${match}`);
}
