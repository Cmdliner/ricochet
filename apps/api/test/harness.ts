import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { ThrottlerGuard } from "@nestjs/throttler";
import type { AuthResponse, AuthUser, HubView, PodView } from "@ricochet/shared";
import { io, type Socket } from "socket.io-client";
// The tests run the compiled API, because Nest's dependency injection needs the type metadata that `tsc` emits.
import { AppModule } from "../dist/app.module.js";
import { MailService } from "../dist/mail/mail.service.js";
import { RedisIoAdapter } from "../dist/realtime/redis-io.adapter.js";

type SentCode = { to: string; code: string; link: string };

/** Stands in for the real mail service, so a test can read the code that would have been emailed. */
class Mailbox {
  readonly sent: SentCode[] = [];

  async sendLoginCode(mail: SentCode) {
    this.sent.push(mail);
  }

  codeFor(email: string): string {
    const mail = [...this.sent].reverse().find((m) => m.to === email.toLowerCase());
    if (!mail) throw new Error(`No code was sent to ${email}`);
    return mail.code;
  }
}

export type TestApp = {
  url: string;
  mailbox: Mailbox;
  close: () => Promise<void>;
};

export async function startApp(): Promise<TestApp> {
  const mailbox = new Mailbox();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MailService)
    .useValue(mailbox)
    // Every test signs in from the same address, which the real per-IP limit would refuse.
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app: INestApplication = moduleRef.createNestApplication();
  const adapter = new RedisIoAdapter(app);
  adapter.connectToRedis(app.get(ConfigService).get<string>("REDIS_URL")!);
  app.useWebSocketAdapter(adapter);
  app.enableShutdownHooks();
  await app.listen(0);

  const { port } = app.getHttpServer().address() as { port: number };
  return { url: `http://127.0.0.1:${port}`, mailbox, close: () => app.close() };
}

export type Reply<T = unknown> = { status: number; body: T };

export async function request<T = unknown>(
  app: TestApp,
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {},
): Promise<Reply<T>> {
  const response = await fetch(`${app.url}${path}`, {
    method,
    headers: {
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  return { status: response.status, body: (text ? JSON.parse(text) : null) as T };
}

export type Person = AuthResponse & { token: string; email: string };

export const uniqueEmail = (name: string) => `${name}-${randomUUID().slice(0, 8)}@example.test`;

/** The same two calls the phone makes: ask for a code, then trade it for a session. */
export async function signIn(app: TestApp, name: string): Promise<Person> {
  const email = uniqueEmail(name);
  const asked = await request(app, "POST", "/auth/request-code", { body: { email } });
  if (asked.status !== 202) throw new Error(`request-code answered ${asked.status}`);
  const verified = await request<AuthResponse>(app, "POST", "/auth/verify", {
    body: { email, code: app.mailbox.codeFor(email) },
  });
  if (verified.status !== 200) throw new Error(`verify answered ${verified.status}`);

  // New accounts are not findable, and cannot be chatted with, until onboarding sets a name and handle.
  const profile = await request<AuthUser>(app, "PATCH", "/me", {
    token: verified.body.accessToken,
    body: { displayName: name, handle: `${name}_${randomUUID().slice(0, 6)}`.toLowerCase().replace(/[^a-z0-9_]/g, "") },
  });
  if (profile.status !== 200) throw new Error(`profile update answered ${profile.status}`);
  return { ...verified.body, user: profile.body, token: verified.body.accessToken, email };
}

export async function createHub(app: TestApp, owner: Person, name = "Crit Club") {
  const reply = await request<HubView>(app, "POST", "/hubs", {
    token: owner.token,
    body: { name, color: "coral", starterPods: ["general", "announcements"] },
  });
  if (reply.status !== 201) throw new Error(`create hub answered ${reply.status}`);
  return reply.body;
}

export async function listPods(app: TestApp, person: Person, hubId: string) {
  const reply = await request<PodView[]>(app, "GET", `/hubs/${hubId}/pods`, { token: person.token });
  if (reply.status !== 200) throw new Error(`list pods answered ${reply.status}`);
  return reply.body;
}

export async function joinHub(app: TestApp, person: Person, inviteCode: string) {
  const reply = await request(app, "POST", "/hubs/join", { token: person.token, body: { code: inviteCode } });
  if (reply.status >= 300) throw new Error(`join answered ${reply.status}`);
}

export function connectSocket(app: TestApp, token: string): Promise<Socket> {
  const socket = io(app.url, { transports: ["websocket"], auth: { token }, forceNew: true, reconnection: false });
  return new Promise((resolve, reject) => {
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", (error) => reject(error));
  });
}

/** Start listening before you trigger the event, or it can arrive before anyone is waiting. */
export function nextEvent<T>(socket: Socket, event: string, matches: (payload: T) => boolean = () => true, ms = 4000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, listener);
      reject(new Error(`No "${event}" event within ${ms}ms`));
    }, ms);
    const listener = (payload: T) => {
      if (!matches(payload)) return;
      clearTimeout(timer);
      socket.off(event, listener);
      resolve(payload);
    };
    socket.on(event, listener);
  });
}

export async function emit<T = { ok: boolean; [key: string]: unknown }>(socket: Socket, event: string, payload: unknown): Promise<T> {
  return (await socket.timeout(5000).emitWithAck(event, payload)) as T;
}
