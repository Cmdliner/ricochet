import { Logger, UseFilters } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
} from "@nestjs/websockets";
import {
  conversationRefSchema,
  EVENTS,
  rooms,
  sendMessageSchema,
  type ConversationRef,
  type SendMessageInput,
} from "@ricochet/shared";
import type { Server, Socket } from "socket.io";
import { WsAckExceptionFilter } from "../common/ws-ack-exception.filter.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { MessagesService } from "../messages/messages.service.js";
import { RealtimeBus } from "./realtime-bus.js";
import { authenticateSocket } from "./socket-auth.js";
import { TypingTracker } from "./typing-tracker.js";

const userIdOf = (client: Socket) => client.data.userId as string;
const TYPING_TTL_MS = 5000;
const typingKey = (client: Socket, conversationId: string) => `${client.id}:${conversationId}`;

/** Rooms: `user:{id}` carries everything for one person; `conversation:{id}` is joined only while that pod or chat is open. */
@UseFilters(WsAckExceptionFilter)
@WebSocketGateway({ transports: ["websocket"], cors: { origin: true } })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly log = new Logger(RealtimeGateway.name);
  private readonly typing = new TypingTracker(TYPING_TTL_MS);

  constructor(
    private readonly jwt: JwtService,
    private readonly messages: MessagesService,
    private readonly bus: RealtimeBus,
  ) {}

  afterInit(server: Server) {
    this.bus.attach(server);
    // A middleware error becomes `connect_error` on the client, so a bad token never gets a socket at all.
    server.use(async (client, next) => {
      const auth = await authenticateSocket(this.jwt, client.handshake.auth.token);
      if (!auth) return next(new Error("Sign in to continue."));
      client.data.userId = auth.userId;
      client.data.sessionId = auth.sessionId;
      next();
    });
  }

  async handleConnection(client: Socket) {
    const userId = userIdOf(client);
    await client.join(rooms.user(userId));
    this.log.debug(`connected ${client.id} as ${userId}`);
  }

  handleDisconnect(client: Socket) {
    this.typing.flush(`${client.id}:`);
    this.log.debug(`disconnected ${client.id}`);
  }

  @SubscribeMessage(EVENTS.conversationOpen)
  async open(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(conversationRefSchema, "ws")) body: ConversationRef,
  ) {
    await this.messages.requireAccess(userIdOf(client), body.conversationId);
    await client.join(rooms.conversation(body.conversationId));
    return { ok: true };
  }

  @SubscribeMessage(EVENTS.conversationClose)
  async close(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(conversationRefSchema, "ws")) body: ConversationRef,
  ) {
    this.stopTyping(client, body.conversationId);
    await client.leave(rooms.conversation(body.conversationId));
    return { ok: true };
  }

  @SubscribeMessage(EVENTS.typingStart)
  typingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(conversationRefSchema, "ws")) body: ConversationRef,
  ) {
    const room = rooms.conversation(body.conversationId);
    // Having joined the room already proves access, so there is no database check on every keystroke.
    if (!client.rooms.has(room)) throw new WsException("Open the conversation first.");

    const notice = { conversationId: body.conversationId, userId: userIdOf(client) };
    const isNew = this.typing.start(typingKey(client, body.conversationId), () =>
      client.to(room).emit(EVENTS.typingStop, notice),
    );
    if (isNew) client.to(room).emit(EVENTS.typingStart, notice);
    return { ok: true };
  }

  @SubscribeMessage(EVENTS.typingStop)
  typingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(conversationRefSchema, "ws")) body: ConversationRef,
  ) {
    this.stopTyping(client, body.conversationId);
    return { ok: true };
  }

  @SubscribeMessage(EVENTS.messageSend)
  async send(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(sendMessageSchema, "ws")) body: SendMessageInput,
  ) {
    const { message, created } = await this.messages.send(userIdOf(client), body);
    this.stopTyping(client, body.conversationId);
    return { ok: true, created, message };
  }

  private stopTyping(client: Socket, conversationId: string) {
    if (!this.typing.stop(typingKey(client, conversationId))) return;
    client
      .to(rooms.conversation(conversationId))
      .emit(EVENTS.typingStop, { conversationId, userId: userIdOf(client) });
  }
}
