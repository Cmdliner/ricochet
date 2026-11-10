import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  EVENTS,
  type ActivityPage,
  type ChatView,
  type MessagePage,
  type MessageView,
  type Person as PersonView,
  type PersonResult,
  type UnreadSummary,
} from "@ricochet/shared";
import { Client } from "pg";
import type { Socket } from "socket.io-client";
import { TEST_DATABASE_URL } from "./env.js";
import { connectSocket, createHub, emit, joinHub, listPods, nextEvent, request, signIn, startApp, type Person, type TestApp } from "./harness.js";

type SendAck = { ok: true; created: boolean; message: MessageView } | { ok: false; error: unknown };

let app: TestApp;
const sockets: Socket[] = [];
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function socketFor(person: Person) {
  const socket = await connectSocket(app, person.token);
  sockets.push(socket);
  return socket;
}

const sendText = (socket: Socket, conversationId: string, body: string) =>
  emit<SendAck>(socket, EVENTS.messageSend, { clientId: randomUUID(), conversationId, type: "text", body });

const block = (by: Person, target: Person) => request(app, "PUT", `/blocks/${target.user.id}`, { token: by.token });
const unblock = (by: Person, target: Person) => request(app, "DELETE", `/blocks/${target.user.id}`, { token: by.token });
const history = async (person: Person, conversationId: string) =>
  (await request<MessagePage>(app, "GET", `/conversations/${conversationId}/messages?limit=50`, { token: person.token })).body.items;
const unread = async (person: Person) => (await request<UnreadSummary>(app, "GET", "/unread", { token: person.token })).body;

beforeAll(async () => {
  app = await startApp();
});
afterEach(() => {
  for (const socket of sockets.splice(0)) socket.close();
});
afterAll(() => app.close());

describe("blocking", () => {
  it("blocks and unblocks, and lists who is blocked", async () => {
    const [ada, ben] = [await signIn(app, "ada"), await signIn(app, "ben")];

    expect((await block(ada, ben)).status).toBe(204);
    expect((await block(ada, ben)).status).toBe(204);
    const listed = await request<PersonView[]>(app, "GET", "/blocks", { token: ada.token });
    expect(listed.body.map((p) => p.id)).toEqual([ben.user.id]);
    expect((await request<PersonView[]>(app, "GET", "/blocks", { token: ben.token })).body).toEqual([]);

    expect((await unblock(ada, ben)).status).toBe(204);
    expect((await request<PersonView[]>(app, "GET", "/blocks", { token: ada.token })).body).toEqual([]);
  });

  it("refuses to block yourself or someone who does not exist", async () => {
    const ada = await signIn(app, "ada");
    expect((await block(ada, ada)).status).toBe(400);
    expect((await request(app, "PUT", `/blocks/${randomUUID()}`, { token: ada.token })).status).toBe(404);
  });
});

describe("blocked people in a pod", () => {
  it("hides what they write from the blocker, and only from the blocker", async () => {
    const [owner, ada, ben, cleo] = [await signIn(app, "owner"), await signIn(app, "ada"), await signIn(app, "ben"), await signIn(app, "cleo")];
    const hub = await createHub(app, owner, "Block Hub");
    for (const person of [ada, ben, cleo]) await joinHub(app, person, hub.inviteCode);
    const pod = (await listPods(app, owner, hub.id))[0]!;
    await block(ben, ada);

    const [a, b, c] = [await socketFor(ada), await socketFor(ben), await socketFor(cleo)];
    for (const socket of [a, b, c]) await emit(socket, EVENTS.conversationOpen, { conversationId: pod.id });
    const benHeard: MessageView[] = [];
    b.on(EVENTS.messageNew, (message: MessageView) => benHeard.push(message));

    const cleoHears = nextEvent<MessageView>(c, EVENTS.messageNew, (m) => m.body === "hello everyone");
    expect((await sendText(a, pod.id, "hello everyone")).ok).toBe(true);
    await cleoHears;
    await pause(300);

    expect(benHeard).toHaveLength(0);
    expect((await history(ben, pod.id)).some((m) => m.body === "hello everyone")).toBe(false);
    expect((await history(cleo, pod.id)).some((m) => m.body === "hello everyone")).toBe(true);
    expect((await unread(ben)).conversations.some((u) => u.conversationId === pod.id)).toBe(false);
    expect((await unread(cleo)).conversations.some((u) => u.conversationId === pod.id)).toBe(true);

    await unblock(ben, ada);
    expect((await history(ben, pod.id)).some((m) => m.body === "hello everyone")).toBe(true);
  });

  it("sends no mention, reply or reaction notifications to the blocker", async () => {
    const [owner, ada, ben] = [await signIn(app, "owner"), await signIn(app, "ada"), await signIn(app, "ben")];
    const hub = await createHub(app, owner, "Quiet Hub");
    for (const person of [ada, ben]) await joinHub(app, person, hub.inviteCode);
    const pod = (await listPods(app, owner, hub.id))[0]!;
    await block(ben, ada);

    const [a, b] = [await socketFor(ada), await socketFor(ben)];
    const mine = await sendText(b, pod.id, "does anyone know?");
    if (!mine.ok) throw new Error("send failed");

    await sendText(a, pod.id, `@${ben.user.handle} yes`);
    const reply = await emit<SendAck>(a, EVENTS.messageSend, { clientId: randomUUID(), conversationId: pod.id, type: "text", body: "I do", replyToId: mine.message.id });
    expect(reply.ok).toBe(true);
    await request(app, "PUT", `/messages/${mine.message.id}/reactions/${encodeURIComponent("🔥")}`, { token: ada.token });
    await pause(500);

    const inbox = await request<ActivityPage>(app, "GET", "/activity", { token: ben.token });
    expect(inbox.body.items).toEqual([]);
    expect((await unread(ben)).activity).toBe(0);
  });

  it("will not let someone invite a person who blocked them", async () => {
    const [owner, ben] = [await signIn(app, "owner"), await signIn(app, "ben")];
    const hub = await createHub(app, owner, "Invite Hub");
    await block(ben, owner);

    const reply = await request(app, "POST", `/hubs/${hub.id}/invites`, { token: owner.token, body: { userId: ben.user.id } });
    expect(reply.status).toBe(404);
  });
});

describe("blocked people in private chats", () => {
  it("makes someone who blocked you look like someone who does not exist", async () => {
    const [ada, ben] = [await signIn(app, "ada"), await signIn(app, "ben")];
    await block(ben, ada);

    expect((await request(app, "POST", "/chats", { token: ada.token, body: { userId: ben.user.id } })).status).toBe(404);
    const searched = await request<PersonResult[]>(app, "GET", `/people/search?q=${ben.user.handle}`, { token: ada.token });
    expect(searched.body.map((p) => p.id)).not.toContain(ben.user.id);
    const reverse = await request<PersonResult[]>(app, "GET", `/people/search?q=${ada.user.handle}`, { token: ben.token });
    expect(reverse.body.map((p) => p.id)).not.toContain(ada.user.id);
  });

  it("saves what a blocked person sends without it ever reaching the blocker, and stops the blocker replying", async () => {
    const [ada, ben] = [await signIn(app, "ada"), await signIn(app, "ben")];
    const chat = (await request<ChatView>(app, "POST", "/chats", { token: ada.token, body: { userId: ben.user.id } })).body;
    const [a, b] = [await socketFor(ada), await socketFor(ben)];
    await emit(a, EVENTS.conversationOpen, { conversationId: chat.id });
    await emit(b, EVENTS.conversationOpen, { conversationId: chat.id });
    expect((await sendText(a, chat.id, "before the block")).ok).toBe(true);

    await block(ben, ada);
    const benHeard: MessageView[] = [];
    b.on(EVENTS.messageNew, (message: MessageView) => benHeard.push(message));

    // The blocked person is not told: the send succeeds, and they see it in their own history.
    const silent = await sendText(a, chat.id, "are you there?");
    expect(silent.ok).toBe(true);
    await pause(400);
    expect(benHeard).toHaveLength(0);
    expect((await history(ada, chat.id)).some((m) => m.body === "are you there?")).toBe(true);
    expect((await history(ben, chat.id)).some((m) => m.body === "are you there?")).toBe(false);
    expect((await unread(ben)).conversations.some((u) => u.conversationId === chat.id)).toBe(false);

    // A blocked chat leaves the list, but opening it directly still says why the composer is off.
    expect((await request<ChatView[]>(app, "GET", "/chats", { token: ben.token })).body.some((c) => c.id === chat.id)).toBe(false);
    const benChat = (await request<ChatView>(app, "GET", `/chats/${chat.id}`, { token: ben.token })).body;
    expect(benChat.blocked).toBe(true);
    expect(benChat.lastMessage).toBeNull();
    const adaChat = (await request<ChatView[]>(app, "GET", "/chats", { token: ada.token })).body.find((c) => c.id === chat.id);
    expect(adaChat?.blocked).toBe(false);

    // The blocker has to unblock before writing back.
    expect((await sendText(b, chat.id, "hello?")).ok).toBe(false);
    await unblock(ben, ada);
    expect((await sendText(b, chat.id, "hello?")).ok).toBe(true);
    expect((await request<ChatView[]>(app, "GET", "/chats", { token: ben.token })).body.some((c) => c.id === chat.id)).toBe(true);
  });
});

describe("reporting", () => {
  it("saves a report of a message, with what it said, and one of a person", async () => {
    const [owner, ada, ben] = [await signIn(app, "owner"), await signIn(app, "ada"), await signIn(app, "ben")];
    const hub = await createHub(app, owner, "Report Hub");
    for (const person of [ada, ben]) await joinHub(app, person, hub.inviteCode);
    const pod = (await listPods(app, owner, hub.id))[0]!;
    const a = await socketFor(ada);
    const sent = await sendText(a, pod.id, "buy my thing at example.com");
    if (!sent.ok) throw new Error("send failed");

    const filed = await request<{ id: string }>(app, "POST", "/reports", {
      token: ben.token,
      body: { messageId: sent.message.id, reason: "spam", details: "Posted three times" },
    });
    expect(filed.status).toBe(201);
    const person = await request<{ id: string }>(app, "POST", "/reports", { token: ben.token, body: { userId: ada.user.id, reason: "harassment" } });
    expect(person.status).toBe(201);

    const db = new Client({ connectionString: TEST_DATABASE_URL });
    await db.connect();
    try {
      const row = (await db.query("select * from reports where id = $1", [filed.body.id])).rows[0];
      expect(row).toMatchObject({
        reporter_id: ben.user.id,
        reported_user_id: ada.user.id,
        message_id: sent.message.id,
        message_body: "buy my thing at example.com",
        reason: "spam",
        details: "Posted three times",
        status: "open",
      });
    } finally {
      await db.end();
    }
  });

  it("refuses reports that make no sense", async () => {
    const [owner, ada, stranger] = [await signIn(app, "owner"), await signIn(app, "ada"), await signIn(app, "stranger")];
    const hub = await createHub(app, owner, "Rules Hub");
    await joinHub(app, ada, hub.inviteCode);
    const pod = (await listPods(app, owner, hub.id))[0]!;
    const own = await sendText(await socketFor(ada), pod.id, "my own words");
    if (!own.ok) throw new Error("send failed");

    const post = (body: unknown, as: Person = ada) => request(app, "POST", "/reports", { token: as.token, body });
    expect((await post({ messageId: own.message.id, reason: "spam" })).status).toBe(400);
    expect((await post({ userId: ada.user.id, reason: "spam" })).status).toBe(400);
    expect((await post({ userId: owner.user.id, messageId: own.message.id, reason: "spam" })).status).toBe(400);
    expect((await post({ reason: "spam" })).status).toBe(400);
    expect((await post({ userId: owner.user.id, reason: "not-a-reason" })).status).toBe(400);
    expect((await post({ userId: randomUUID(), reason: "spam" })).status).toBe(404);
    // Someone outside the hub cannot report a message they could never see.
    expect((await post({ messageId: own.message.id, reason: "spam" }, stranger)).status).toBe(404);
  });

  it("limits how many reports one person can send in an hour", async () => {
    const [ada, ben] = [await signIn(app, "ada"), await signIn(app, "ben")];
    for (let i = 0; i < 20; i++) {
      const reply = await request(app, "POST", "/reports", { token: ada.token, body: { userId: ben.user.id, reason: "spam" } });
      expect(reply.status).toBe(201);
    }
    const over = await request(app, "POST", "/reports", { token: ada.token, body: { userId: ben.user.id, reason: "spam" } });
    expect(over.status).toBe(429);
  });
});
