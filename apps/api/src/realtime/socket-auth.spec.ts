import { JwtService } from "@nestjs/jwt";
import { describe, expect, it } from "vitest";
import { authenticateSocket } from "./socket-auth.js";

describe("authenticateSocket", () => {
  const jwt = new JwtService({ secret: "test-secret" });

  it("accepts a valid access token", async () => {
    const token = await jwt.signAsync({ sub: "user-1", sid: "session-1" });
    expect(await authenticateSocket(jwt, token)).toEqual({ userId: "user-1", sessionId: "session-1" });
  });

  it("rejects a missing or non-string token", async () => {
    expect(await authenticateSocket(jwt, undefined)).toBeNull();
    expect(await authenticateSocket(jwt, "")).toBeNull();
    expect(await authenticateSocket(jwt, { token: "x" })).toBeNull();
  });

  it("rejects garbage and tokens signed with another secret", async () => {
    const forged = await new JwtService({ secret: "other" }).signAsync({ sub: "user-1", sid: "session-1" });
    expect(await authenticateSocket(jwt, "not-a-token")).toBeNull();
    expect(await authenticateSocket(jwt, forged)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const expired = await jwt.signAsync({ sub: "user-1", sid: "session-1" }, { expiresIn: -10 });
    expect(await authenticateSocket(jwt, expired)).toBeNull();
  });
});
