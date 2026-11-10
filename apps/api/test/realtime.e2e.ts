import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  EVENTS,
  type ActivityNew,
  type ActivityPage,
  type ChatUpdated,
  type ChatView,
  type MessagePage,
  type MessageView,
  type UnreadSummary,
  type UnreadUpdate,
} from "@ricochet/shared";
import type { Socket } from "socket.io-client";
import {
  connectSocket,
  createHub,
  emit,
  joinHub,
  listPods,
  nextEvent,
  request,
  signIn,
  startApp,
  type Person,
  type TestApp,
} from "./harness.js";

type SendAck = { ok: true; created: boolean; message: MessageView } | { ok: false; error: unknown };

let app: TestApp;
let ada: Person;
let ben: Person;
let outsider: Person;
let podId: string;
const sockets: Socket[] = [];

async function socketFor(person: Person) {
  const socket = await connectSocket(app, person.token);
  sockets.push(socket);
  return socket;
}

const sendText = (socket: Socket, conversationId: string, body: string, clientId: string = randomUUID()) =>
  emit<SendAck>(socket, EVENTS.messageSend, { clientId, conversationId, type: "text", body });

beforeAll(async () => {
  app = await startApp();
  ada = await signIn(app, "ada");
  ben = await signIn(app, "ben");
  outsider = await signIn(app, "outsider");

  const hub = await createHub(app, ada, "Live Hub");
  await joinHub(app, ben, hub.inviteCode);
  const general = (await listPods(app, ada, hub.id)).find((pod) => pod.name === "general");
  podId = general!.id;
});

afterEach(() => {
  for (const socket of sockets.splice(0)) socket.close();
});
afterAll(() => app.close());

describe("connecting", () => {
  it("turns away a socket with no token or a bad one", async () => {
    await expect(connectSocket(app, "")).rejects.toThrow("Sign in to continue.");
    await expect(connectSocket(app, "garbage")).rejects.toThrow("Sign in to continue.");
  });

  it("only lets people open conversations they belong to", async () => {
    const stranger = await socketFor(outsider);
    const reply = await emit<{ ok: boolean }>(stranger, EVENTS.conversationOpen, { conversationId: podId });
    expect(reply.ok).toBe(false);

    const member = await socketFor(ben);
    expect((await emit<{ ok: boolean }>(member, EVENTS.conversationOpen, { conversationId: podId })).ok).toBe(true);
  });
});

describe("messages", () => {
  it("delivers a sent message to everyone who has the pod open, and stores it", async () => {
    const [a, b] = [await socketFor(ada), await socketFor(ben)];
    await emit(a, EVENTS.conversationOpen, { conversationId: podId });
    await emit(b, EVENTS.conversationOpen, { conversationId: podId });

    const arrived = nextEvent<MessageView>(b, EVENTS.messageNew, (m) => m.body === "hello pod");
    const ack = await sendText(a, podId, "hello pod");
    expect(ack.ok).toBe(true);
    if (!ack.ok) return;
    expect(ack.created).toBe(true);

    const message = await arrived;
    expect(message.id).toBe(ack.message.id);
    expect(message.senderId).toBe(ada.user.id);

    const history = await request<MessagePage>(app, "GET", `/conversations/${podId}/messages`, { token: ben.token });
    expect(history.body.items.some((m) => m.id === ack.message.id)).toBe(true);
  });

  it("treats a retry with the same clientId as the same message", async () => {
    const a = await socketFor(ada);
    const clientId = randomUUID();
    const first = await sendText(a, podId, "only once", clientId);
    const retry = await sendText(a, podId, "only once", clientId);

    expect(first.ok && retry.ok).toBe(true);
    if (!first.ok || !retry.ok) return;
    expect(first.created).toBe(true);
    expect(retry.created).toBe(false);
    expect(retry.message.id).toBe(first.message.id);

    const history = await request<MessagePage>(app, "GET", `/conversations/${podId}/messages?limit=100`, { token: ada.token });
    expect(history.body.items.filter((m) => m.clientId === clientId)).toHaveLength(1);
  });

  it("refuses to send into a conversation the sender is not part of", async () => {
    const stranger = await socketFor(outsider);
    const ack = await sendText(stranger, podId, "let me in");
    expect(ack.ok).toBe(false);

    const history = await request(app, "GET", `/conversations/${podId}/messages`, { token: outsider.token });
    expect(history.status).toBe(404);
  });

  it("rejects a message the schema does not allow", async () => {
    const a = await socketFor(ada);
    const ack = await emit<{ ok: boolean }>(a, EVENTS.messageSend, { clientId: randomUUID(), conversationId: podId, type: "text" });
    expect(ack.ok).toBe(false);
  });

  it("pages history newest first with a cursor", async () => {
    const a = await socketFor(ada);
    const hub = await createHub(app, ada, "Paging Hub");
    const pod = (await listPods(app, ada, hub.id))[0]!;
    for (const n of [1, 2, 3, 4, 5]) await sendText(a, pod.id, `message ${n}`);

    const first = await request<MessagePage>(app, "GET", `/conversations/${pod.id}/messages?limit=2`, { token: ada.token });
    expect(first.body.items.map((m) => m.body)).toEqual(["message 5", "message 4"]);
    expect(first.body.nextCursor).not.toBeNull();

    const second = await request<MessagePage>(app, "GET", `/conversations/${pod.id}/messages?limit=2&before=${first.body.nextCursor}`, {
      token: ada.token,
    });
    expect(second.body.items.map((m) => m.body)).toEqual(["message 3", "message 2"]);
  });
});

describe("typing", () => {
  it("tells the others in the pod, and refuses typing in a pod that is not open", async () => {
    const [a, b] = [await socketFor(ada), await socketFor(ben)];
    await emit(a, EVENTS.conversationOpen, { conversationId: podId });
    await emit(b, EVENTS.conversationOpen, { conversationId: podId });

    const noticed = nextEvent<{ userId: string }>(b, EVENTS.typingStart);
    expect((await emit<{ ok: boolean }>(a, EVENTS.typingStart, { conversationId: podId })).ok).toBe(true);
    expect((await noticed).userId).toBe(ada.user.id);

    await emit(a, EVENTS.conversationClose, { conversationId: podId });
    const refused = await emit<{ ok: boolean }>(a, EVENTS.typingStart, { conversationId: podId });
    expect(refused.ok).toBe(false);
  });
});

describe("unread counts", () => {
  it("counts for the recipient, and clears when they mark it read", async () => {
    const hub = await createHub(app, ada, "Unread Hub");
    await joinHub(app, ben, hub.inviteCode);
    const pod = (await listPods(app, ada, hub.id))[0]!;
    const [a, b] = [await socketFor(ada), await socketFor(ben)];

    const counted = nextEvent<UnreadUpdate>(b, EVENTS.unreadUpdate, (u) => u.conversationId === pod.id && u.unread === 1);
    const ack = await sendText(a, pod.id, "anyone here?");
    await counted;

    const summary = await request<UnreadSummary>(app, "GET", "/unread", { token: ben.token });
    expect(summary.body.conversations).toContainEqual({ conversationId: pod.id, unread: 1 });

    const own = await request<UnreadSummary>(app, "GET", "/unread", { token: ada.token });
    expect(own.body.conversations.some((c) => c.conversationId === pod.id)).toBe(false);

    if (!ack.ok) throw new Error("send failed");
    const cleared = nextEvent<UnreadUpdate>(b, EVENTS.unreadUpdate, (u) => u.conversationId === pod.id && u.unread === 0);
    const read = await emit<{ ok: boolean }>(b, EVENTS.conversationRead, { conversationId: pod.id, lastReadId: ack.message.id });
    expect(read.ok).toBe(true);
    await cleared;

    const after = await request<UnreadSummary>(app, "GET", "/unread", { token: ben.token });
    expect(after.body.conversations.some((c) => c.conversationId === pod.id)).toBe(false);
  });
});

describe("activity inbox", () => {
  it("notifies someone who is mentioned, and lets them clear it", async () => {
    const [a, b] = [await socketFor(ada), await socketFor(ben)];

    const note = nextEvent<ActivityNew>(b, EVENTS.activityNew, (n) => n.item.kind === "mention");
    await sendText(a, podId, `@${ben.user.handle} can you look at this?`);
    const { item } = await note;
    expect(item.actor?.id).toBe(ada.user.id);
    expect(item.read).toBe(false);

    const inbox = await request<ActivityPage>(app, "GET", "/activity", { token: ben.token });
    expect(inbox.body.items.some((i) => i.id === item.id)).toBe(true);

    const summary = await request<UnreadSummary>(app, "GET", "/unread", { token: ben.token });
    expect(summary.body.activity).toBeGreaterThan(0);

    await request(app, "POST", "/activity/read", { token: ben.token, body: { all: true } });
    const cleared = await request<UnreadSummary>(app, "GET", "/unread", { token: ben.token });
    expect(cleared.body.activity).toBe(0);
  });

  it("does not treat an email address as a mention", async () => {
    const a = await socketFor(ada);
    const before = (await request<UnreadSummary>(app, "GET", "/unread", { token: ben.token })).body.activity;
    await sendText(a, podId, `write to me@${ben.user.handle}.example`);
    const after = (await request<UnreadSummary>(app, "GET", "/unread", { token: ben.token })).body.activity;
    expect(after).toBe(before);
  });

  it("tells a message's author when someone reacts to it", async () => {
    const [a, b] = [await socketFor(ada), await socketFor(ben)];
    const ack = await sendText(a, podId, "react to me");
    if (!ack.ok) throw new Error("send failed");

    const note = nextEvent<ActivityNew>(a, EVENTS.activityNew, (n) => n.item.kind === "reaction");
    const reacted = await request<MessageView>(app, "PUT", `/messages/${ack.message.id}/reactions/${encodeURIComponent("🔥")}`, { token: ben.token });
    expect(reacted.body.reactions).toEqual([{ emoji: "🔥", userIds: [ben.user.id] }]);
    expect((await note).item.emoji).toBe("🔥");

    const removed = await request<MessageView>(app, "DELETE", `/messages/${ack.message.id}/reactions/${encodeURIComponent("🔥")}`, { token: ben.token });
    expect(removed.body.reactions).toEqual([]);
    b.close();
  });
});

describe("private chats", () => {
  it("opens one chat per pair of people, however many times it is asked", async () => {
    const first = await request<ChatView>(app, "POST", "/chats", { token: ada.token, body: { userId: ben.user.id } });
    const again = await request<ChatView>(app, "POST", "/chats", { token: ben.token, body: { userId: ada.user.id } });
    expect(first.status).toBeLessThan(300);
    expect(again.body.id).toBe(first.body.id);
  });

  it("delivers messages and the chat list update, and keeps outsiders out", async () => {
    const chat = (await request<ChatView>(app, "POST", "/chats", { token: ada.token, body: { userId: ben.user.id } })).body;
    const [a, b] = [await socketFor(ada), await socketFor(ben)];
    await emit(a, EVENTS.conversationOpen, { conversationId: chat.id });
    await emit(b, EVENTS.conversationOpen, { conversationId: chat.id });

    const listed = nextEvent<ChatUpdated>(b, EVENTS.chatUpdated, (u) => u.conversationId === chat.id);
    const delivered = nextEvent<MessageView>(b, EVENTS.messageNew, (m) => m.body === "psst");
    await sendText(a, chat.id, "psst");
    expect((await delivered).conversationId).toBe(chat.id);
    expect((await listed).lastMessage.body).toBe("psst");

    const stranger = await socketFor(outsider);
    expect((await emit<{ ok: boolean }>(stranger, EVENTS.conversationOpen, { conversationId: chat.id })).ok).toBe(false);
    expect((await request(app, "GET", `/conversations/${chat.id}/messages`, { token: outsider.token })).status).toBe(404);
  });
});
