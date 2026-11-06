import { describe, expect, it, vi } from "vitest";
import { ExpoPushProvider, outcomeOf } from "./expo-push-provider.js";
import { describeMessagePush } from "./push-format.js";

describe("describeMessagePush", () => {
  it("leads with the pod and hub, and puts the sender in the body", () => {
    expect(describeMessagePush({ sender: "Ada", type: "text", body: "ship it", pod: "general", hub: "Crit Club", mentioned: false })).toEqual({
      title: "#general · Crit Club",
      body: "Ada: ship it",
    });
  });

  it("says so when someone was mentioned", () => {
    expect(describeMessagePush({ sender: "Ada", type: "text", body: "@bob look", pod: "general", hub: "Crit Club", mentioned: true }).body).toBe(
      "Ada mentioned you: @bob look",
    );
  });

  it("leads with the person in a chat, and names recordings instead of showing nothing", () => {
    expect(describeMessagePush({ sender: "Ada", type: "voice", body: null, pod: null, hub: null, mentioned: false })).toEqual({
      title: "Ada",
      body: "Voice note",
    });
    expect(describeMessagePush({ sender: "Ada", type: "video", body: null, pod: null, hub: null, mentioned: false }).body).toBe("Video note");
  });
});

describe("ExpoPushProvider", () => {
  const message = (to: string) => ({ to, title: "t", body: "b", data: {} });
  const reply = (tickets: unknown[]) => new Response(JSON.stringify({ data: tickets }), { status: 200 });

  it("maps each ticket to the device it belongs to, and marks dead devices", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      reply([{ status: "ok" }, { status: "error", details: { error: "DeviceNotRegistered" } }, { status: "error", message: "rate limited" }]),
    );
    const provider = new ExpoPushProvider("http://expo.test", undefined, fetchImpl);
    expect(await provider.send([message("a"), message("b"), message("c")])).toEqual([
      { to: "a", status: "ok" },
      { to: "b", status: "invalid-token" },
      { to: "c", status: "failed" },
    ]);
  });

  it("sends at most 100 notifications per request", async () => {
    const fetchImpl = vi.fn().mockImplementation(async (_url: string, init: { body: string }) => reply((JSON.parse(init.body) as unknown[]).map(() => ({ status: "ok" }))));
    const provider = new ExpoPushProvider("http://expo.test", undefined, fetchImpl);
    const outcomes = await provider.send(Array.from({ length: 250 }, (_, i) => message(`t${i}`)));
    expect(outcomes).toHaveLength(250);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("reports failure, without throwing, when Expo cannot be reached", async () => {
    const provider = new ExpoPushProvider("http://expo.test", undefined, vi.fn().mockRejectedValue(new Error("offline")));
    expect(await provider.send([message("a")])).toEqual([{ to: "a", status: "failed" }]);
  });

  it("sends the access token when one is set", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply([{ status: "ok" }]));
    await new ExpoPushProvider("http://expo.test", "secret", fetchImpl).send([message("a")]);
    const init = fetchImpl.mock.calls[0]?.[1] as { headers: Record<string, string> };
    expect(init.headers).toMatchObject({ authorization: "Bearer secret" });
  });
});

describe("outcomeOf", () => {
  it("treats a missing ticket as a failure", () => {
    expect(outcomeOf("a", undefined)).toEqual({ to: "a", status: "failed" });
  });
});
