import { describe, expect, it } from "vitest";
import { extractMentions, previewOf } from "./mentions.js";

describe("extractMentions", () => {
  it("finds handles anywhere in the text, lowercased and without repeats", () => {
    expect(extractMentions("@Ada can you and @bob_2 look? cc @ada")).toEqual(["ada", "bob_2"]);
  });

  it("ignores email addresses and a lone at sign", () => {
    expect(extractMentions("write to ada@example.com or @ later")).toEqual([]);
  });

  it("handles a mention at the very start and punctuation after it", () => {
    expect(extractMentions("@mira, thanks!")).toEqual(["mira"]);
  });

  it("stops after twenty mentions", () => {
    const body = Array.from({ length: 30 }, (_, i) => `@user${i}`).join(" ");
    expect(extractMentions(body)).toHaveLength(20);
  });
});

describe("previewOf", () => {
  it("collapses whitespace and cuts long text", () => {
    expect(previewOf("  hello \n  world ")).toBe("hello world");
    expect(previewOf("x".repeat(200))).toHaveLength(140);
    expect(previewOf(null)).toBeNull();
  });
});
