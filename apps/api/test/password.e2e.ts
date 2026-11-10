import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuthResponse, AuthUser } from "@ricochet/shared";
import { Client } from "pg";
import { TEST_DATABASE_URL } from "./env.js";
import { request, signIn, startApp, type Person, type TestApp } from "./harness.js";

let app: TestApp;
beforeAll(async () => {
  app = await startApp();
});
afterAll(() => app.close());

const setPassword = (person: Person, password: string, currentPassword?: string) =>
  request<AuthUser>(app, "PUT", "/auth/password", { token: person.token, body: { password, currentPassword } });
const login = (email: string, password: string) => request<AuthResponse>(app, "POST", "/auth/password-login", { body: { email, password } });

async function sql(query: string, values: unknown[]) {
  const db = new Client({ connectionString: TEST_DATABASE_URL });
  await db.connect();
  try {
    await db.query(query, values);
  } finally {
    await db.end();
  }
}

describe("setting a password", () => {
  it("lets a signed-in person set one, and then sign in with it", async () => {
    const person = await signIn(app, "ada");
    expect(person.user.hasPassword).toBe(false);

    const set = await setPassword(person, "a long passphrase");
    expect(set.status).toBe(200);
    expect(set.body.hasPassword).toBe(true);

    const session = await login(person.email.toUpperCase(), "a long passphrase");
    expect(session.status).toBe(200);
    expect(session.body.user.id).toBe(person.user.id);
    const me = await request<AuthUser>(app, "GET", "/me", { token: session.body.accessToken });
    expect(me.status).toBe(200);
  });

  it("needs a signed-in session, and a password that is long enough", async () => {
    const person = await signIn(app, "ben");
    expect((await request(app, "PUT", "/auth/password", { body: { password: "a long passphrase" } })).status).toBe(401);
    expect((await setPassword(person, "short")).status).toBe(400);
    expect((await login(person.email, "")).status).toBe(400);
  });
});

describe("signing in with a password", () => {
  it("fails the same way for a wrong password, an unknown email and an account with no password", async () => {
    const withPassword = await signIn(app, "cleo");
    await setPassword(withPassword, "a long passphrase");
    const without = await signIn(app, "dan");

    const wrong = await login(withPassword.email, "not the password");
    const unknown = await login("nobody-here@example.test", "a long passphrase");
    const unset = await login(without.email, "a long passphrase");

    for (const reply of [wrong, unknown, unset]) expect(reply.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
    expect(unset.body).toEqual(wrong.body);
  });

  it("locks after five wrong tries, even for the right password, until the lock runs out", async () => {
    const person = await signIn(app, "eve");
    await setPassword(person, "a long passphrase");

    for (let i = 0; i < 5; i++) expect((await login(person.email, `wrong guess ${i}`)).status).toBe(401);
    expect((await login(person.email, "a long passphrase")).status).toBe(401);

    await sql("update users set password_locked_until = now() - interval '1 minute' where email = $1", [person.email]);
    expect((await login(person.email, "a long passphrase")).status).toBe(200);
  });

  it("starts counting again after a successful sign in", async () => {
    const person = await signIn(app, "finn");
    await setPassword(person, "a long passphrase");
    for (let i = 0; i < 4; i++) await login(person.email, "wrong guess");
    expect((await login(person.email, "a long passphrase")).status).toBe(200);
    for (let i = 0; i < 4; i++) await login(person.email, "wrong guess");
    expect((await login(person.email, "a long passphrase")).status).toBe(200);
  });
});

describe("changing and removing a password", () => {
  it("needs the current password, then signs every other device out", async () => {
    const first = await signIn(app, "gwen");
    await setPassword(first, "a long passphrase");
    const second = (await login(first.email, "a long passphrase")).body;
    const secondDevice = { ...first, token: second.accessToken, refreshToken: second.refreshToken };

    expect((await setPassword(secondDevice, "another long passphrase")).status).toBe(403);
    expect((await setPassword(secondDevice, "another long passphrase", "not it")).status).toBe(403);
    const changed = await setPassword(secondDevice, "another long passphrase", "a long passphrase");
    expect(changed.status).toBe(200);

    expect((await login(first.email, "a long passphrase")).status).toBe(401);
    expect((await login(first.email, "another long passphrase")).status).toBe(200);
    expect((await request(app, "POST", "/auth/refresh", { body: { refreshToken: first.refreshToken } })).status).toBe(401);
    expect((await request(app, "POST", "/auth/refresh", { body: { refreshToken: second.refreshToken } })).status).toBe(200);
  });

  it("removes a password when asked with the right one, and then it no longer signs in", async () => {
    const person = await signIn(app, "hal");
    await setPassword(person, "a long passphrase");

    const refused = await request(app, "DELETE", "/auth/password", { token: person.token, body: { password: "not it" } });
    expect(refused.status).toBe(403);
    const removed = await request<AuthUser>(app, "DELETE", "/auth/password", { token: person.token, body: { password: "a long passphrase" } });
    expect(removed.status).toBe(200);
    expect(removed.body.hasPassword).toBe(false);
    expect((await login(person.email, "a long passphrase")).status).toBe(401);
  });

  it("counts wrong current passwords toward the same lockout", async () => {
    const person = await signIn(app, "ivy");
    await setPassword(person, "a long passphrase");
    for (let i = 0; i < 5; i++) await setPassword(person, "another long passphrase", `wrong ${i}`);
    expect((await login(person.email, "a long passphrase")).status).toBe(401);
  });
});
