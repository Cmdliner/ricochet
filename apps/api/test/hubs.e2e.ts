import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { HubMember, HubView, PodView } from "@ricochet/shared";
import { createHub, joinHub, listPods, request, signIn, startApp, type Person, type TestApp } from "./harness.js";

let app: TestApp;
let owner: Person;
let member: Person;
let outsider: Person;

beforeAll(async () => {
  app = await startApp();
  owner = await signIn(app, "owner");
  member = await signIn(app, "member");
  outsider = await signIn(app, "outsider");
});
afterAll(() => app.close());

describe("hubs", () => {
  it("creates a hub with its starter pods and makes the creator the owner", async () => {
    const hub = await createHub(app, owner, "Starter Hub");
    expect(hub.myRole).toBe("owner");
    expect(hub.memberCount).toBe(1);

    const pods = await listPods(app, owner, hub.id);
    expect(pods.map((pod) => pod.name).sort()).toEqual(["announcements", "general"]);

    const mine = await request<HubView[]>(app, "GET", "/hubs", { token: owner.token });
    expect(mine.body.some((h) => h.id === hub.id)).toBe(true);
  });

  it("lets someone join with the invite code, in any letter case", async () => {
    const hub = await createHub(app, owner, "Join Hub");
    const joined = await request<HubView>(app, "POST", "/hubs/join", {
      token: member.token,
      body: { code: hub.inviteCode.toLowerCase() },
    });
    expect(joined.status).toBe(200);
    expect(joined.body.id).toBe(hub.id);
    expect(joined.body.myRole).toBe("member");

    const members = await request<HubMember[]>(app, "GET", `/hubs/${hub.id}/members`, { token: owner.token });
    expect(members.body.map((m) => m.userId).sort()).toEqual([owner.user.id, member.user.id].sort());
  });

  it("refuses a code that does not exist", async () => {
    const reply = await request(app, "POST", "/hubs/join", { token: member.token, body: { code: "ZZZZZZZ" } });
    expect(reply.status).toBe(404);
  });

  it("keeps a hub hidden from people who are not in it", async () => {
    const hub = await createHub(app, owner, "Hidden Hub");
    expect((await request(app, "GET", `/hubs/${hub.id}`, { token: outsider.token })).status).toBe(404);
    expect((await request(app, "GET", `/hubs/${hub.id}/pods`, { token: outsider.token })).status).toBe(404);
    expect((await request(app, "GET", `/hubs/${hub.id}/members`, { token: outsider.token })).status).toBe(404);
  });

  it("lets only the owner delete or re-key a hub, and only owner or admins edit it", async () => {
    const hub = await createHub(app, owner, "Rules Hub");
    await joinHub(app, member, hub.inviteCode);

    const rename = await request(app, "PATCH", `/hubs/${hub.id}`, { token: member.token, body: { name: "Mine now" } });
    expect(rename.status).toBe(403);
    expect((await request(app, "DELETE", `/hubs/${hub.id}`, { token: member.token })).status).toBe(403);
    expect((await request(app, "POST", `/hubs/${hub.id}/invite-code`, { token: member.token })).status).toBe(403);

    const renamed = await request<HubView>(app, "PATCH", `/hubs/${hub.id}`, { token: owner.token, body: { name: "Renamed" } });
    expect(renamed.status).toBe(200);
    expect(renamed.body.name).toBe("Renamed");

    const rekeyed = await request<HubView>(app, "POST", `/hubs/${hub.id}/invite-code`, { token: owner.token });
    expect(rekeyed.body.inviteCode).not.toBe(hub.inviteCode);
    const oldCode = await request(app, "POST", "/hubs/join", { token: outsider.token, body: { code: hub.inviteCode } });
    expect(oldCode.status).toBe(404);
  });

  it("promotes a member to admin, and admins can then edit the hub", async () => {
    const hub = await createHub(app, owner, "Promote Hub");
    await joinHub(app, member, hub.inviteCode);

    const promoted = await request(app, "PATCH", `/hubs/${hub.id}/members/${member.user.id}`, {
      token: owner.token,
      body: { role: "admin" },
    });
    expect(promoted.status).toBe(204);

    const edit = await request(app, "PATCH", `/hubs/${hub.id}`, { token: member.token, body: { description: "Edited by an admin" } });
    expect(edit.status).toBe(200);

    const selfPromote = await request(app, "PATCH", `/hubs/${hub.id}/members/${outsider.user.id}`, {
      token: member.token,
      body: { role: "admin" },
    });
    expect(selfPromote.status).toBeGreaterThanOrEqual(400);
  });

  it("removes a member who leaves, and stops them seeing the hub", async () => {
    const hub = await createHub(app, owner, "Leave Hub");
    await joinHub(app, member, hub.inviteCode);

    expect((await request(app, "POST", `/hubs/${hub.id}/leave`, { token: member.token })).status).toBe(204);
    expect((await request(app, "GET", `/hubs/${hub.id}`, { token: member.token })).status).toBe(404);
  });

  it("deletes a hub for good when the owner asks", async () => {
    const hub = await createHub(app, owner, "Doomed Hub");
    expect((await request(app, "DELETE", `/hubs/${hub.id}`, { token: owner.token })).status).toBe(204);
    expect((await request(app, "GET", `/hubs/${hub.id}`, { token: owner.token })).status).toBe(404);
  });
});

describe("private pods", () => {
  it("shows an owner every pod, and a member only the ones they were added to", async () => {
    const hub = await createHub(app, owner, "Secrets Hub");
    await joinHub(app, member, hub.inviteCode);

    const created = await request<PodView>(app, "POST", `/hubs/${hub.id}/pods`, {
      token: owner.token,
      body: { name: "core-team", category: "Team", description: "", isPrivate: true },
    });
    expect(created.status).toBe(201);
    const podId = created.body.id;

    const ownerSees = await listPods(app, owner, hub.id);
    const memberSees = await listPods(app, member, hub.id);
    expect(ownerSees.some((pod) => pod.id === podId)).toBe(true);
    expect(memberSees.some((pod) => pod.id === podId)).toBe(false);
    expect((await request(app, "GET", `/pods/${podId}`, { token: member.token })).status).toBe(404);

    const added = await request(app, "POST", `/pods/${podId}/members`, { token: owner.token, body: { userId: member.user.id } });
    expect(added.status).toBe(204);
    expect((await listPods(app, member, hub.id)).some((pod) => pod.id === podId)).toBe(true);

    const removed = await request(app, "DELETE", `/pods/${podId}/members/${member.user.id}`, { token: owner.token });
    expect(removed.status).toBe(204);
    expect((await listPods(app, member, hub.id)).some((pod) => pod.id === podId)).toBe(false);
  });

  it("does not let a plain member create pods", async () => {
    const hub = await createHub(app, owner, "Pods Hub");
    await joinHub(app, member, hub.inviteCode);
    const reply = await request(app, "POST", `/hubs/${hub.id}/pods`, {
      token: member.token,
      body: { name: "sneaky", category: "Team", description: "", isPrivate: false },
    });
    expect(reply.status).toBe(403);
  });
});
