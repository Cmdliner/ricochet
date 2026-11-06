import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { conversations, participants, type Conversation } from "@ricochet/db";
import { and, eq } from "drizzle-orm";
import { DRIZZLE, type Database } from "../db/db.module.js";
import { PodsService } from "../pods/pods.service.js";

export type ConversationAccess = { id: string; type: Conversation["type"]; hubId: string | null; isPrivate: boolean };

@Injectable()
export class ConversationAccessService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly pods: PodsService,
  ) {}

  async require(userId: string, conversationId: string): Promise<ConversationAccess> {
    const [conversation] = await this.db
      .select({
        id: conversations.id,
        type: conversations.type,
        hubId: conversations.hubId,
        isPrivate: conversations.isPrivate,
      })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    if (!conversation) throw new NotFoundException("Conversation not found.");

    if (conversation.type === "pod") {
      await this.pods.access(userId, conversationId);
      return conversation;
    }
    const [member] = await this.db
      .select({ userId: participants.userId })
      .from(participants)
      .where(and(eq(participants.conversationId, conversationId), eq(participants.userId, userId)))
      .limit(1);
    if (!member) throw new NotFoundException("Conversation not found.");
    return conversation;
  }
}
