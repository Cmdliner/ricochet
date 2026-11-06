import { Injectable, Logger, NotFoundException, type OnModuleInit } from "@nestjs/common";
import { rooms } from "@ricochet/shared";
import { ConversationAccessService } from "../messages/conversation-access.service.js";
import { RealtimeBus, type AccessChange } from "./realtime-bus.js";

const CONVERSATION_PREFIX = rooms.conversation("");

/**
 * Joining a room checks access once, so when access is taken away the sockets already inside have to be
 * rechecked and removed. Without this, a person removed from a private pod would keep receiving its messages.
 */
@Injectable()
export class RoomRevalidator implements OnModuleInit {
  private readonly log = new Logger(RoomRevalidator.name);

  constructor(
    private readonly bus: RealtimeBus,
    private readonly access: ConversationAccessService,
  ) {}

  onModuleInit() {
    this.bus.onAccessChanged((change) => {
      this.revalidate(change).catch((error: unknown) => this.log.error(`Could not recheck rooms: ${String(error)}`));
    });
  }

  async revalidate(change: AccessChange): Promise<void> {
    const room = "userId" in change ? rooms.user(change.userId) : rooms.conversation(change.conversationId);
    const sockets = await this.bus.socketsIn(room);

    for (const socket of sockets) {
      const userId = socket.data.userId;
      if (!userId) continue;
      const conversationIds =
        "conversationId" in change
          ? [change.conversationId]
          : [...socket.rooms].filter((name) => name.startsWith(CONVERSATION_PREFIX)).map((name) => name.slice(CONVERSATION_PREFIX.length));

      for (const conversationId of conversationIds) {
        if (!(await this.stillAllowed(userId, conversationId))) await socket.leave(rooms.conversation(conversationId));
      }
    }
  }

  private async stillAllowed(userId: string, conversationId: string): Promise<boolean> {
    try {
      await this.access.require(userId, conversationId);
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) return false;
      throw error;
    }
  }
}
