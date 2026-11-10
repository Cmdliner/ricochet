import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { rooms } from "@ricochet/shared";
import { Emitter } from "@socket.io/redis-emitter";
import { Redis } from "ioredis";
import type { Server } from "socket.io";
import type { Env } from "../config/env.js";

/** Something changed who may see what. Name one person to recheck all their open rooms, or one conversation to recheck everyone in it. */
export type AccessChange = { userId: string } | { conversationId: string };

/** The part of a socket we use. With the Redis adapter it may live on another server, which is why it is a thin handle. */
export type RoomSocket = { data: { userId?: string }; rooms: Set<string>; join(room: string): Promise<void> | void; leave(room: string): Promise<void> | void };

type Broadcaster = {
  to(room: string): { except(rooms: string[]): { emit(event: string, payload: unknown): unknown }; emit(event: string, payload: unknown): unknown };
};

/** Lets services talk to the realtime layer without depending on it, since the gateway depends on them. */
@Injectable()
export class RealtimeBus {
  private server?: Server;
  private emitter?: Emitter;
  private accessHandler?: (change: AccessChange) => void;

  constructor(private readonly config: ConfigService<Env, true>) {}

  attach(server: Server) {
    this.server = server;
  }

  /**
   * The socket server when this process has one. The media worker has none, so it publishes through Redis
   * and the API's socket servers deliver the event.
   */
  private get out(): Broadcaster {
    if (this.server) return this.server;
    this.emitter ??= new Emitter(new Redis(this.config.get("REDIS_URL", { infer: true })));
    return this.emitter;
  }

  toConversation(conversationId: string, event: string, payload: unknown) {
    this.out.to(rooms.conversation(conversationId)).emit(event, payload);
  }

  /** Everyone with the conversation open, except these people. Used so someone who blocked the sender never receives the message live. */
  toConversationExcept(conversationId: string, event: string, payload: unknown, exceptUserIds: string[]) {
    const room = this.out.to(rooms.conversation(conversationId));
    (exceptUserIds.length > 0 ? room.except(exceptUserIds.map((id) => rooms.user(id))) : room).emit(event, payload);
  }

  toHub(hubId: string, event: string, payload: unknown) {
    this.out.to(rooms.hub(hubId)).emit(event, payload);
  }

  toUser(userId: string, event: string, payload: unknown) {
    this.out.to(rooms.user(userId)).emit(event, payload);
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
