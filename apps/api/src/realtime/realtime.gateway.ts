import { Logger, UseFilters } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
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
import { authenticateSocket } from "./socket-auth.js";

/** Rooms: `user:{id}` carries everything for one person; `conversation:{id}` is joined only while that pod or chat is open. */
@UseFilters(WsAckExceptionFilter)
@WebSocketGateway({ transports: ["websocket"], cors: { origin: true } })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly log = new Logger(RealtimeGateway.name);

  constructor(private readonly jwt: JwtService) {}

  afterInit(server: Server) {
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
    const userId = client.data.userId as string;
    await client.join(rooms.user(userId));
    this.log.debug(`connected ${client.id} as ${userId}`);
  }

  handleDisconnect(client: Socket) {
    this.log.debug(`disconnected ${client.id}`);
  }

  @SubscribeMessage(EVENTS.conversationOpen)
  async open(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(conversationRefSchema, "ws")) body: ConversationRef,
  ) {
    // TODO(auth): confirm this user may read the conversation before joining.
    await client.join(rooms.conversation(body.conversationId));
    return { ok: true };
  }

  @SubscribeMessage(EVENTS.conversationClose)
  async close(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ZodValidationPipe(conversationRefSchema, "ws")) body: ConversationRef,
  ) {
    await client.leave(rooms.conversation(body.conversationId));
    return { ok: true };
  }

  @SubscribeMessage(EVENTS.messageSend)
  send(@MessageBody(new ZodValidationPipe(sendMessageSchema, "ws")) body: SendMessageInput) {
    // TODO(messages): call MessagesService.create(), which saves once per clientId, then emits
    // EVENTS.messageNew to rooms.conversation(body.conversationId). The ack carries the saved id.
    return { ok: true, clientId: body.clientId };
  }
}
