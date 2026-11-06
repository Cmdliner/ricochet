import { Inject, Injectable } from "@nestjs/common";
import { attachments, messages, reactions, type Attachment, type Message } from "@ricochet/db";
import type { MediaView, MessageView } from "@ricochet/shared";
import { eq, inArray } from "drizzle-orm";
import { DRIZZLE, type Database } from "../db/db.module.js";
import { MediaService } from "../media/media.service.js";
import { groupReactions } from "./reactions.js";

/** Turns saved messages into what the apps receive: reactions grouped, and media with fresh links. Used by the API and by the media worker. */
@Injectable()
export class MessageViewService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly media: MediaService,
  ) {}

  async mediaView(attachment: Attachment): Promise<MediaView> {
    const playable = attachment.status !== "failed";
    return {
      status: attachment.status,
      durationMs: attachment.durationMs,
      waveform: attachment.waveform,
      url: playable ? await this.media.downloadUrl(attachment.storageKey) : null,
      posterUrl: attachment.posterKey ? await this.media.downloadUrl(attachment.posterKey) : null,
    };
  }

  async views(rows: Message[]): Promise<MessageView[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);
    const [reactionRows, attachmentRows] = await Promise.all([
      this.db.select().from(reactions).where(inArray(reactions.messageId, ids)),
      this.db.select().from(attachments).where(inArray(attachments.messageId, ids)),
    ]);
    const grouped = groupReactions(reactionRows);
    const mediaById = new Map(await Promise.all(attachmentRows.map(async (row) => [row.messageId, await this.mediaView(row)] as const)));

    return rows.map((row) => ({
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      type: row.type,
      body: row.body,
      clientId: row.clientId,
      createdAt: row.createdAt.toISOString(),
      reactions: grouped.get(row.id) ?? [],
      media: mediaById.get(row.id) ?? null,
    }));
  }

  async viewOf(messageId: string): Promise<MessageView | null> {
    const [row] = await this.db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
    if (!row) return null;
    return (await this.views([row]))[0] ?? null;
  }
}
