import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { blocks, messages, reports, users } from "@ricochet/db";
import type { CreateReportInput, Person, ReportCreated } from "@ricochet/shared";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { DRIZZLE, type Database } from "../db/db.module.js";
import { MediaService } from "../media/media.service.js";
import { ConversationAccessService } from "../messages/conversation-access.service.js";

const REPORTS_PER_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;

@Injectable()
export class SafetyService {
  private readonly log = new Logger(SafetyService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly access: ConversationAccessService,
    private readonly media: MediaService,
  ) {}

  async block(userId: string, targetId: string): Promise<void> {
    if (targetId === userId) throw new BadRequestException("You cannot block yourself.");
    const [target] = await this.db.select({ id: users.id }).from(users).where(eq(users.id, targetId)).limit(1);
    if (!target) throw new NotFoundException("Person not found.");
    await this.db.insert(blocks).values({ blockerId: userId, blockedId: targetId }).onConflictDoNothing();
  }

  async unblock(userId: string, targetId: string): Promise<void> {
    await this.db.delete(blocks).where(and(eq(blocks.blockerId, userId), eq(blocks.blockedId, targetId)));
  }

  async listBlocked(userId: string): Promise<Person[]> {
    const rows = await this.db
      .select({ id: users.id, displayName: users.displayName, handle: users.handle, avatarColor: users.avatarColor, avatarKey: users.avatarKey })
      .from(blocks)
      .innerJoin(users, eq(users.id, blocks.blockedId))
      .where(eq(blocks.blockerId, userId))
      .orderBy(asc(users.displayName));
    return rows.map(({ avatarKey, ...person }) => ({ ...person, avatarUrl: this.media.publicUrl(avatarKey) }));
  }

  /** Reports are for a moderator to read later. Nobody else is told, and the reported person never is. */
  async report(userId: string, input: CreateReportInput): Promise<ReportCreated> {
    const [counted] = await this.db
      .select({ recent: sql<number>`count(*)::int` })
      .from(reports)
      .where(and(eq(reports.reporterId, userId), gt(reports.createdAt, new Date(Date.now() - HOUR_MS))));
    if ((counted?.recent ?? 0) >= REPORTS_PER_HOUR) {
      throw new HttpException({ message: "You have sent a lot of reports. Try again in a while." }, HttpStatus.TOO_MANY_REQUESTS);
    }

    const target = input.messageId ? await this.messageTarget(userId, input.messageId) : await this.personTarget(input.userId ?? "");
    if (target.reportedUserId === userId) throw new BadRequestException("You cannot report yourself.");

    const [created] = await this.db
      .insert(reports)
      .values({ reporterId: userId, ...target, reason: input.reason, details: input.details ?? "" })
      .returning({ id: reports.id });
    if (!created) throw new Error("Could not save the report.");
    this.log.warn(`report ${created.id}: ${input.reason} against ${target.reportedUserId}`);
    return created;
  }

  private async personTarget(targetId: string) {
    const [person] = await this.db.select({ id: users.id }).from(users).where(eq(users.id, targetId)).limit(1);
    if (!person) throw new NotFoundException("Person not found.");
    return { reportedUserId: person.id, messageId: null, conversationId: null, messageBody: null };
  }

  /** Only a message the reporter could see can be reported, and its text is copied so it survives if the message is later removed. */
  private async messageTarget(userId: string, messageId: string) {
    const [message] = await this.db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
    if (!message) throw new NotFoundException("Message not found.");
    await this.access.require(userId, message.conversationId);
    return { reportedUserId: message.senderId, messageId: message.id, conversationId: message.conversationId, messageBody: message.body };
  }
}
