import { Injectable } from "@nestjs/common";
import { rooms } from "@ricochet/shared";
import type { Server } from "socket.io";

/** Lets services announce events without depending on the gateway, which depends on them. The gateway hands over the server once it exists. */
@Injectable()
export class RealtimeBus {
  private server?: Server;

  attach(server: Server) {
    this.server = server;
  }

  toConversation(conversationId: string, event: string, payload: unknown) {
    this.server?.to(rooms.conversation(conversationId)).emit(event, payload);
  }

  toUser(userId: string, event: string, payload: unknown) {
    this.server?.to(rooms.user(userId)).emit(event, payload);
  }
}
