import { describe, expect, it } from "vitest";
import { groupReactions } from "./reactions.js";

describe("groupReactions", () => {
  it("groups people under the emoji they used, per message", () => {
    const grouped = groupReactions([
      { messageId: "m1", userId: "ada", emoji: "🔥" },
      { messageId: "m1", userId: "bob", emoji: "🔥" },
      { messageId: "m1", userId: "ada", emoji: "👍" },
      { messageId: "m2", userId: "bob", emoji: "🔥" },
    ]);

    expect(grouped.get("m1")).toEqual([
      { emoji: "👍", userIds: ["ada"] },
      { emoji: "🔥", userIds: ["ada", "bob"] },
    ]);
    expect(grouped.get("m2")).toEqual([{ emoji: "🔥", userIds: ["bob"] }]);
  });

  it("has nothing for a message nobody reacted to", () => {
    expect(groupReactions([]).get("m1")).toBeUndefined();
  });
});
