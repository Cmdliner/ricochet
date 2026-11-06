import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { conversations, hubMembers, hubs, users } from "@ricochet/db";
import type {
  CreateHubInput,
  HubIcon,
  HubMember,
  HubRole,
  HubView,
  PatchHubInput,
  StarterPod,
} from "@ricochet/shared";
import { and, eq, sql } from "drizzle-orm";
import { isUniqueViolation } from "../common/db-errors.js";
import { DRIZZLE, type Database } from "../db/db.module.js";
import { generateInviteCode } from "./invite-code.js";
import { canChangeRoles, canDeleteHub, canEditHub, canRemoveMember } from "./permissions.js";

const STARTER_PODS: Record<StarterPod, { category: string; description: string }> = {
  general: { category: "Social", description: "Everything else" },
  announcements: { category: "Start here", description: "News from the hub team" },
  "off-topic": { category: "Social", description: "Memes, music and the weather" },
};

const ROLE_ORDER: Record<HubRole, number> = { owner: 0, admin: 1, member: 2 };

const MAX_CODE_ATTEMPTS = 5;

@Injectable()
export class HubsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  private readonly viewColumns = {
    id: hubs.id,
    name: hubs.name,
    description: hubs.description,
    color: hubs.color,
    icon: hubs.icon,
    inviteCode: hubs.inviteCode,
    createdAt: hubs.createdAt,
    myRole: hubMembers.role,
    memberCount: sql<number>`(select count(*)::int from ${hubMembers} where ${hubMembers.hubId} = ${hubs.id})`,
    podCount: sql<number>`(select count(*)::int from ${conversations} where ${conversations.hubId} = ${hubs.id} and ${conversations.type} = 'pod' and not ${conversations.isPrivate})`,
  };

  private toView(row: {
    id: string;
    name: string;
    description: string;
    color: HubView["color"];
    icon: string;
    inviteCode: string;
    createdAt: Date;
    myRole: HubRole;
    memberCount: number;
    podCount: number;
  }): HubView {
    // The icon is checked against the shared list on the way in, so the cast here is safe.
    return { ...row, icon: row.icon as HubIcon, createdAt: row.createdAt.toISOString() };
  }

  async listMine(userId: string): Promise<HubView[]> {
    const rows = await this.db
      .select(this.viewColumns)
      .from(hubMembers)
      .innerJoin(hubs, eq(hubs.id, hubMembers.hubId))
      .where(eq(hubMembers.userId, userId))
      .orderBy(hubs.createdAt);
    return rows.map((row) => this.toView(row));
  }

  // A hub you are not in answers "not found", not "forbidden": forbidden would confirm the id exists.
  async getView(userId: string, hubId: string): Promise<HubView> {
    const [row] = await this.db
      .select(this.viewColumns)
      .from(hubMembers)
      .innerJoin(hubs, eq(hubs.id, hubMembers.hubId))
      .where(and(eq(hubMembers.userId, userId), eq(hubs.id, hubId)))
      .limit(1);
    if (!row) throw new NotFoundException("Hub not found.");
    return this.toView(row);
  }

  private async roleOf(hubId: string, userId: string): Promise<HubRole | null> {
    const [row] = await this.db
      .select({ role: hubMembers.role })
      .from(hubMembers)
      .where(and(eq(hubMembers.hubId, hubId), eq(hubMembers.userId, userId)))
      .limit(1);
    return row?.role ?? null;
  }

  private async requireRole(hubId: string, userId: string, allowed: (role: HubRole) => boolean): Promise<HubRole> {
    const role = await this.roleOf(hubId, userId);
    if (!role) throw new NotFoundException("Hub not found.");
    if (!allowed(role)) throw new ForbiddenException("You do not have permission to do that in this hub.");
    return role;
  }

  async create(userId: string, input: CreateHubInput): Promise<HubView> {
    for (let attempt = 1; ; attempt++) {
      try {
        const hubId = await this.db.transaction(async (tx) => {
          const [hub] = await tx
            .insert(hubs)
            .values({
              name: input.name,
              color: input.color,
              icon: input.icon ?? "rocket",
              ownerId: userId,
              inviteCode: generateInviteCode(),
            })
            .returning({ id: hubs.id });
          if (!hub) throw new Error("Could not create the hub.");

          await tx.insert(hubMembers).values({ hubId: hub.id, userId, role: "owner" });
          await tx.insert(conversations).values(
            input.starterPods.map((name) => ({
              type: "pod" as const,
              hubId: hub.id,
              name,
              category: STARTER_PODS[name].category,
              description: STARTER_PODS[name].description,
            })),
          );
          return hub.id;
        });
        return this.getView(userId, hubId);
      } catch (error) {
        // The only thing that can collide here is the invite code. Pick another and try again.
        if (isUniqueViolation(error) && attempt < MAX_CODE_ATTEMPTS) continue;
        throw error;
      }
    }
  }

  async update(userId: string, hubId: string, input: PatchHubInput): Promise<HubView> {
    await this.requireRole(hubId, userId, canEditHub);
    await this.db
      .update(hubs)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.color !== undefined && { color: input.color }),
        ...(input.icon !== undefined && { icon: input.icon }),
      })
      .where(eq(hubs.id, hubId));
    return this.getView(userId, hubId);
  }

  async regenerateInviteCode(userId: string, hubId: string): Promise<HubView> {
    await this.requireRole(hubId, userId, canEditHub);
    for (let attempt = 1; ; attempt++) {
      try {
        await this.db.update(hubs).set({ inviteCode: generateInviteCode() }).where(eq(hubs.id, hubId));
        return this.getView(userId, hubId);
      } catch (error) {
        if (isUniqueViolation(error) && attempt < MAX_CODE_ATTEMPTS) continue;
        throw error;
      }
    }
  }

  /** Deleting the hub removes its members, pods and messages too: the foreign keys cascade. */
  async remove(userId: string, hubId: string): Promise<void> {
    await this.requireRole(hubId, userId, canDeleteHub);
    await this.db.delete(hubs).where(eq(hubs.id, hubId));
  }

  async join(userId: string, code: string): Promise<HubView> {
    const [hub] = await this.db.select({ id: hubs.id }).from(hubs).where(eq(hubs.inviteCode, code)).limit(1);
    if (!hub) throw new NotFoundException("That invite code does not match a hub.");
    await this.db.insert(hubMembers).values({ hubId: hub.id, userId, role: "member" }).onConflictDoNothing();
    return this.getView(userId, hub.id);
  }

  async leave(userId: string, hubId: string): Promise<void> {
    const role = await this.roleOf(hubId, userId);
    if (!role) throw new NotFoundException("Hub not found.");
    if (role === "owner") {
      throw new ConflictException("Owners cannot leave their hub. Delete it instead.");
    }
    await this.db.delete(hubMembers).where(and(eq(hubMembers.hubId, hubId), eq(hubMembers.userId, userId)));
  }

  async listMembers(userId: string, hubId: string): Promise<HubMember[]> {
    if (!(await this.roleOf(hubId, userId))) throw new NotFoundException("Hub not found.");
    const rows = await this.db
      .select({
        userId: users.id,
        displayName: users.displayName,
        handle: users.handle,
        avatarColor: users.avatarColor,
        role: hubMembers.role,
        joinedAt: hubMembers.joinedAt,
      })
      .from(hubMembers)
      .innerJoin(users, eq(users.id, hubMembers.userId))
      .where(eq(hubMembers.hubId, hubId));

    return rows
      .map((row) => ({ ...row, joinedAt: row.joinedAt.toISOString() }))
      .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.displayName.localeCompare(b.displayName));
  }

  async setRole(actorId: string, hubId: string, targetId: string, role: "admin" | "member"): Promise<void> {
    await this.requireRole(hubId, actorId, canChangeRoles);
    const targetRole = await this.roleOf(hubId, targetId);
    if (!targetRole) throw new NotFoundException("That person is not in this hub.");
    if (targetRole === "owner") throw new ConflictException("The owner's role cannot be changed.");
    await this.db
      .update(hubMembers)
      .set({ role })
      .where(and(eq(hubMembers.hubId, hubId), eq(hubMembers.userId, targetId)));
  }

  async removeMember(actorId: string, hubId: string, targetId: string): Promise<void> {
    if (actorId === targetId) throw new ConflictException("To leave a hub, use leave instead.");
    const actorRole = await this.roleOf(hubId, actorId);
    if (!actorRole) throw new NotFoundException("Hub not found.");
    const targetRole = await this.roleOf(hubId, targetId);
    if (!targetRole) throw new NotFoundException("That person is not in this hub.");
    if (!canRemoveMember(actorRole, targetRole)) {
      throw new ForbiddenException("You do not have permission to remove that person.");
    }
    await this.db.delete(hubMembers).where(and(eq(hubMembers.hubId, hubId), eq(hubMembers.userId, targetId)));
  }
}
