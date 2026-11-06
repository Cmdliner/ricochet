import { Injectable } from "@nestjs/common";
import { rooms } from "@ricochet/shared";
import type { Server } from "socket.io";

/** Something changed who may see what. Name one person to recheck all their open rooms, or one conversation to recheck everyone in it. */
export type AccessChange = { userId: string } | { conversationId: string };

/** The part of a socket we use. With the Redis adapter it may live on another server, which is why it is a thin handle. */
export type RoomSocket = { data: { userId?: string }; rooms: Set<string>; join(room: string): Promise<void> | void; leave(room: string): Promise<void> | void };

/** Lets services talk to the realtime layer without depending on it, since the gateway depends on them. */
@Injectable()
export class RealtimeBus {
  private server?: Server;
  private accessHandler?: (change: AccessChange) => void;

  attach(server: Server) {
    this.server = server;
  }

  toConversation(conversationId: string, event: string, payload: unknown) {
    this.server?.to(rooms.conversation(conversationId)).emit(event, payload);
  }

  toHub(hubId: string, event: string, payload: unknown) {
    this.server?.to(rooms.hub(hubId)).emit(event, payload);
  }

  toUser(userId: string, event: string, payload: unknown) {
    this.server?.to(rooms.user(userId)).emit(event, payload);
  }

  async socketsIn(room: string): Promise<RoomSocket[]> {
    return ((await this.server?.in(room).fetchSockets()) ?? []) as unknown as RoomSocket[];
  }

  onAccessChanged(handler: (change: AccessChange) => void) {
    this.accessHandler = handler;
  }

  accessChanged(change: AccessChange) {
    this.accessHandler?.(change);
  }
}
