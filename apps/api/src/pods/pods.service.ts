import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { conversations, hubMembers, participants, users, type Conversation } from "@ricochet/db";
import type {
  CreatePodInput,
  HubMember,
  HubRole,
  PodSettingsInput,
  PodView,
  UpdatePodInput,
} from "@ricochet/shared";
import { and, asc, eq, isNotNull, or } from "drizzle-orm";
import { isUniqueViolation } from "../common/db-errors.js";
import { DRIZZLE, type Database } from "../db/db.module.js";
import { HubsService } from "../hubs/hubs.service.js";
import { canEditHub } from "../hubs/permissions.js";
import { canSeePod } from "./permissions.js";

type PodAccess = { pod: Conversation & { hubId: string }; hubRole: HubRole };

const ROLE_ORDER: Record<HubRole, number> = { owner: 0, admin: 1, member: 2 };

@Injectable()
export class PodsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly hubs: HubsService,
  ) {}

  private viewQuery(userId: string) {
    return this.db
      .select({
        id: conversations.id,
        hubId: conversations.hubId,
        name: conversations.name,
        category: conversations.category,
        description: conversations.description,
        isPrivate: conversations.isPrivate,
        createdAt: conversations.createdAt,
        muted: participants.muted,
        mentionsOnly: participants.mentionsOnly,
      })
      .from(conversations)
      .leftJoin(
        participants,
        and(eq(participants.conversationId, conversations.id), eq(participants.userId, userId)),
      );
  }

  private toView(row: Awaited<ReturnType<PodsService["viewQuery"]>>[number]): PodView {
    return {
      id: row.id,
      hubId: row.hubId ?? "",
      name: row.name ?? "",
      category: row.category ?? "General",
      description: row.description,
      isPrivate: row.isPrivate,
      muted: row.muted ?? false,
      mentionsOnly: row.mentionsOnly ?? false,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async access(userId: string, podId: string): Promise<PodAccess> {
    const [pod] = await this.db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, podId), eq(conversations.type, "pod")))
      .limit(1);
    if (!pod?.hubId) throw new NotFoundException("Pod not found.");

    const hubRole = await this.hubs.roleOf(pod.hubId, userId);
    const [listed] = await this.db
      .select({ userId: participants.userId })
      .from(participants)
      .where(and(eq(participants.conversationId, podId), eq(participants.userId, userId)))
      .limit(1);

    if (!hubRole || !canSeePod(hubRole, pod, !!listed)) throw new NotFoundException("Pod not found.");
    return { pod: { ...pod, hubId: pod.hubId }, hubRole };
  }

  private async requireManage(userId: string, podId: string): Promise<PodAccess> {
    const access = await this.access(userId, podId);
    if (!canEditHub(access.hubRole)) throw new ForbiddenException("You do not have permission to do that in this hub.");
    return access;
  }

  async listForHub(userId: string, hubId: string): Promise<PodView[]> {
    const hubRole = await this.hubs.roleOf(hubId, userId);
    if (!hubRole) throw new NotFoundException("Hub not found.");
    const rows = await this.viewQuery(userId)
      .where(
        and(
          eq(conversations.hubId, hubId),
          eq(conversations.type, "pod"),
          hubRole === "owner" ? undefined : or(eq(conversations.isPrivate, false), isNotNull(participants.userId)),
        ),
      )
      .orderBy(asc(conversations.createdAt), asc(conversations.id));
    return rows.map((row) => this.toView(row));
  }

  async get(userId: string, podId: string): Promise<PodView> {
    await this.access(userId, podId);
    const [row] = await this.viewQuery(userId).where(eq(conversations.id, podId)).limit(1);
    if (!row) throw new NotFoundException("Pod not found.");
    return this.toView(row);
  }

  async create(userId: string, hubId: string, input: CreatePodInput): Promise<PodView> {
    await this.hubs.requireRole(hubId, userId, canEditHub);
    try {
      const podId = await this.db.transaction(async (tx) => {
        const [pod] = await tx
          .insert(conversations)
          .values({ type: "pod", hubId, ...input })
          .returning({ id: conversations.id });
        if (!pod) throw new Error("Could not create the pod.");
        if (input.isPrivate) await tx.insert(participants).values({ conversationId: pod.id, userId });
        return pod.id;
      });
      return await this.get(userId, podId);
    } catch (error) {
      throw this.nameTaken(error, input.name);
    }
  }

  async update(userId: string, podId: string, input: UpdatePodInput): Promise<PodView> {
    const { pod } = await this.requireManage(userId, podId);
    const becomesPrivate = input.isPrivate === true && !pod.isPrivate;
    try {
      await this.db.transaction(async (tx) => {
        await tx
          .update(conversations)
          .set({
            ...(input.name !== undefined && { name: input.name }),
            ...(input.category !== undefined && { category: input.category }),
            ...(input.description !== undefined && { description: input.description }),
            ...(input.isPrivate !== undefined && { isPrivate: input.isPrivate }),
          })
          .where(eq(conversations.id, podId));

        // Rows on an open pod only hold personal settings, so they must not turn into a guest list.
        if (becomesPrivate) {
          await tx.delete(participants).where(eq(participants.conversationId, podId));
          await tx.insert(participants).values({ conversationId: podId, userId });
        }
      });
    } catch (error) {
      throw this.nameTaken(error, input.name);
    }
    return this.get(userId, podId);
  }

  async remove(userId: string, podId: string): Promise<void> {
    await this.requireManage(userId, podId);
    await this.db.delete(conversations).where(eq(conversations.id, podId));
  }

  async updateSettings(userId: string, podId: string, input: PodSettingsInput): Promise<PodView> {
    await this.access(userId, podId);
    await this.db
      .insert(participants)
      .values({ conversationId: podId, userId, ...input })
      .onConflictDoUpdate({ target: [participants.conversationId, participants.userId], set: input });
    return this.get(userId, podId);
  }

  async listMembers(userId: string, podId: string): Promise<HubMember[]> {
    const { pod } = await this.access(userId, podId);
    const query = this.db
      .select({
        userId: users.id,
        displayName: users.displayName,
        handle: users.handle,
        avatarColor: users.avatarColor,
        role: hubMembers.role,
        joinedAt: hubMembers.joinedAt,
      })
      .from(hubMembers)
      .innerJoin(users, eq(users.id, hubMembers.userId));

    const rows = pod.isPrivate
      ? await query
          .innerJoin(
            participants,
            and(eq(participants.userId, hubMembers.userId), eq(participants.conversationId, podId)),
          )
          .where(eq(hubMembers.hubId, pod.hubId))
      : await query.where(eq(hubMembers.hubId, pod.hubId));

    return rows
      .map((row) => ({ ...row, joinedAt: row.joinedAt.toISOString() }))
      .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.displayName.localeCompare(b.displayName));
  }

  async addMember(actorId: string, podId: string, targetId: string): Promise<void> {
    const { pod } = await this.requireManage(actorId, podId);
    if (!pod.isPrivate) throw new ConflictException("Everyone in the hub is already in an open pod.");
    if (!(await this.hubs.roleOf(pod.hubId, targetId))) throw new NotFoundException("That person is not in this hub.");
    await this.db.insert(participants).values({ conversationId: podId, userId: targetId }).onConflictDoNothing();
  }

  async removeMember(actorId: string, podId: string, targetId: string): Promise<void> {
    const { pod } = await this.requireManage(actorId, podId);
    if (!pod.isPrivate) throw new ConflictException("Open pods include everyone in the hub.");
    const removed = await this.db
      .delete(participants)
      .where(and(eq(participants.conversationId, podId), eq(participants.userId, targetId)))
      .returning({ userId: participants.userId });
    if (removed.length === 0) throw new NotFoundException("That person is not in this pod.");
  }

  private nameTaken(error: unknown, name: string | undefined): unknown {
    if (isUniqueViolation(error)) return new ConflictException(`A pod called #${name} already exists in this hub.`);
    return error;
  }
}
