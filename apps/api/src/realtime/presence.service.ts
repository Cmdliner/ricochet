import { Inject, Injectable } from "@nestjs/common";
import { hubMembers } from "@ricochet/db";
import { EVENTS, rooms, type PresenceUpdate } from "@ricochet/shared";
import { eq } from "drizzle-orm";
import { DRIZZLE, type Database } from "../db/db.module.js";
import { RealtimeBus } from "./realtime-bus.js";

export const PRESENCE_GRACE_MS = 5000;

const HUB_PREFIX = rooms.hub("");

@Injectable()
export class PresenceService {
  /** A person is online while they have at least one connection. Dropping to zero is only believed after this delay, so a signal blip does not flicker. */
  readonly graceMs = PRESENCE_GRACE_MS;

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly bus: RealtimeBus,
  ) {}

  async hubIdsOf(userId: string): Promise<string[]> {
    const rows = await this.db.select({ hubId: hubMembers.hubId }).from(hubMembers).where(eq(hubMembers.userId, userId));
    return rows.map((row) => row.hubId);
  }

  /** Puts a new connection into the rooms of every hub the person belongs to and tells those hubs they are online. */
  async connected(client: { join(room: string): Promise<void> | void }, userId: string): Promise<void> {
    const hubIds = await this.hubIdsOf(userId);
    for (const hubId of hubIds) await client.join(rooms.hub(hubId));
    this.announce(hubIds, { userId, online: true });
  }

  /** Waits out the grace period, then reports offline only if nobody from this person has reconnected, on any server. */
  disconnected(userId: string): void {
    setTimeout(() => {
      void this.announceIfGone(userId);
    }, this.graceMs).unref();
  }

  async announceIfGone(userId: string): Promise<void> {
    if ((await this.bus.socketsIn(rooms.user(userId))).length > 0) return;
    this.announce(await this.hubIdsOf(userId), { userId, online: false });
  }

  /** After joining or leaving a hub, brings every open connection of that person in line with their memberships. */
  async syncHubRooms(userId: string): Promise<void> {
    const hubIds = new Set(await this.hubIdsOf(userId));
    const sockets = await this.bus.socketsIn(rooms.user(userId));
    const joined = new Set<string>();
    const left = new Set<string>();

    for (const socket of sockets) {
      const current = [...socket.rooms].filter((name) => name.startsWith(HUB_PREFIX)).map((name) => name.slice(HUB_PREFIX.length));
      for (const hubId of hubIds) {
        if (current.includes(hubId)) continue;
        await socket.join(rooms.hub(hubId));
        joined.add(hubId);
      }
      for (const hubId of current) {
        if (hubIds.has(hubId)) continue;
        await socket.leave(rooms.hub(hubId));
        left.add(hubId);
      }
    }
    this.announce([...joined], { userId, online: true });
    this.announce([...left], { userId, online: false });
  }

  async onlineInHub(hubId: string): Promise<string[]> {
    const sockets = await this.bus.socketsIn(rooms.hub(hubId));
    return [...new Set(sockets.map((socket) => socket.data.userId).filter((id): id is string => !!id))];
  }

  private announce(hubIds: string[], update: PresenceUpdate) {
    for (const hubId of hubIds) this.bus.toHub(hubId, EVENTS.presenceUpdate, update);
  }
}
