import { Logger, UseFilters } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from "@nestjs/websockets";
import {
  conversationRefSchema,
  EVENTS,
  rooms,
  sendMessageSchema,
  type ConversationRef,
  type SendMessageInput,
} from "@ricochet/shared";
import type { Socket } from "socket.io";
import { WsAckExceptionFilter } from "../common/ws-ack-exception.filter.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";

/** Rooms: `user:{id}` carries everything for one person; `conversation:{id}` is joined only while that pod or chat is open. */
@UseFilters(WsAckExceptionFilter)
@WebSocketGateway({ transports: ["websocket"], cors: { origin: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly log = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket) {
    // TODO(auth): verify the JWT from `client.handshake.auth.token`, then join `rooms.user(userId)`.
    this.log.debug(`connected ${client.id}`);
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
