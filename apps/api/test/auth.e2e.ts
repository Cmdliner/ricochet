import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuthResponse, AuthUser } from "@ricochet/shared";
import { request, signIn, startApp, uniqueEmail, type TestApp } from "./harness.js";

let app: TestApp;
beforeAll(async () => {
  app = await startApp();
});
afterAll(() => app.close());

describe("signing in", () => {
  it("makes an account on first sign in and returns the same one on the next", async () => {
    const email = uniqueEmail("ada");

    await request(app, "POST", "/auth/request-code", { body: { email } });
    const first = await request<AuthResponse & { isNewUser: boolean }>(app, "POST", "/auth/verify", {
      body: { email, code: app.mailbox.codeFor(email) },
    });
    expect(first.status).toBe(200);
    expect(first.body.isNewUser).toBe(true);

    const me = await request<AuthUser>(app, "GET", "/me", { token: first.body.accessToken });
    expect(me.status).toBe(200);
    expect(me.body.id).toBe(first.body.user.id);
    expect(me.body.email).toBe(email);
  });

  it("refuses a wrong code, and a code that was already used", async () => {
    const email = uniqueEmail("wrong");
    await request(app, "POST", "/auth/request-code", { body: { email } });
    const code = app.mailbox.codeFor(email);
    const wrong = code === "000000" ? "111111" : "000000";

    const bad = await request(app, "POST", "/auth/verify", { body: { email, code: wrong } });
    expect(bad.status).toBe(401);

    const good = await request(app, "POST", "/auth/verify", { body: { email, code } });
    expect(good.status).toBe(200);

    const again = await request(app, "POST", "/auth/verify", { body: { email, code } });
    expect(again.status).toBe(401);
  });

  it("rejects malformed input before it reaches the database", async () => {
    const reply = await request(app, "POST", "/auth/request-code", { body: { email: "not-an-email" } });
    expect(reply.status).toBe(400);
  });
});

describe("sessions", () => {
  it("keeps private routes closed without a token", async () => {
    expect((await request(app, "GET", "/me")).status).toBe(401);
    expect((await request(app, "GET", "/me", { token: "garbage" })).status).toBe(401);
    expect((await request(app, "GET", "/hubs")).status).toBe(401);
  });

  it("trades a refresh token for a new access token", async () => {
    const person = await signIn(app, "refresh");
    const refreshed = await request<AuthResponse>(app, "POST", "/auth/refresh", { body: { refreshToken: person.refreshToken } });
    expect(refreshed.status).toBe(200);

    const me = await request(app, "GET", "/me", { token: refreshed.body.accessToken });
    expect(me.status).toBe(200);
  });

  it("stops honouring the refresh token after logout", async () => {
    const person = await signIn(app, "logout");
    const out = await request(app, "POST", "/auth/logout", { body: { refreshToken: person.refreshToken } });
    expect(out.status).toBe(204);

    const refreshed = await request(app, "POST", "/auth/refresh", { body: { refreshToken: person.refreshToken } });
    expect(refreshed.status).toBe(401);
  });
});
