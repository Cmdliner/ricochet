import { describe, expect, it } from "vitest";
import { takePage } from "./pagination.js";

const rows = (count: number) => Array.from({ length: count }, (_, i) => ({ id: `m${i}` }));

describe("takePage", () => {
  it("has no next page when everything fits", () => {
    expect(takePage(rows(3), 5)).toEqual({ items: rows(3), nextCursor: null });
  });

  it("has no next page when the result is exactly the limit", () => {
    expect(takePage(rows(5), 5).nextCursor).toBeNull();
  });

  it("drops the extra row and points the cursor at the last one kept", () => {
    const page = takePage(rows(6), 5);
    expect(page.items).toHaveLength(5);
    expect(page.nextCursor).toBe("m4");
  });

  it("copes with no rows", () => {
    expect(takePage([], 5)).toEqual({ items: [], nextCursor: null });
  });
});
