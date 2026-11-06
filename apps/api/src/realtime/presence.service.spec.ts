import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "../db/db.module.js";
import { PresenceService } from "./presence.service.js";
import type { RealtimeBus } from "./realtime-bus.js";

describe("PresenceService offline grace", () => {
  let connections: number;
  let toHub: ReturnType<typeof vi.fn>;
  let service: PresenceService;

  beforeEach(() => {
    vi.useFakeTimers();
    connections = 0;
    toHub = vi.fn();
    const bus = {
      socketsIn: () => Promise.resolve(Array.from({ length: connections }, () => ({}))),
      toHub,
    } as unknown as RealtimeBus;
    service = new PresenceService({} as Database, bus);
    vi.spyOn(service, "hubIdsOf").mockResolvedValue(["hub-1"]);
  });
  afterEach(() => vi.useRealTimers());

  it("reports offline once the grace period passes with no connections", async () => {
    service.disconnected("user-1");
    await vi.advanceTimersByTimeAsync(service.graceMs - 1);
    expect(toHub).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(toHub).toHaveBeenCalledWith("hub-1", "presence:update", { userId: "user-1", online: false });
  });

  it("stays quiet when the person reconnects inside the grace period", async () => {
    service.disconnected("user-1");
    connections = 1;
    await vi.advanceTimersByTimeAsync(service.graceMs);
    expect(toHub).not.toHaveBeenCalled();
  });

  it("stays online while another device is still connected", async () => {
    connections = 1;
    service.disconnected("user-1");
    await vi.advanceTimersByTimeAsync(service.graceMs);
    expect(toHub).not.toHaveBeenCalled();
  });
});
