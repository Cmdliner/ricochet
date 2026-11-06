import { describe, expect, it } from "vitest";
import { dmKeyFor } from "./dm-key.js";
import { escapeLike } from "./like-pattern.js";

describe("dmKeyFor", () => {
  it("gives the same key whichever person starts the chat", () => {
    expect(dmKeyFor("b-id", "a-id")).toBe(dmKeyFor("a-id", "b-id"));
    expect(dmKeyFor("a-id", "b-id")).toBe("a-id:b-id");
  });
});

describe("escapeLike", () => {
  it("makes wildcard characters literal", () => {
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
    expect(escapeLike("ada")).toBe("ada");
  });
});
