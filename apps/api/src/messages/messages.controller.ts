import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  listMessagesQuerySchema,
  reactionEmojiSchema,
  sendMessageSchema,
  type ListMessagesQuery,
  type SendMessageInput,
} from "@ricochet/shared";
import type { Response } from "express";
import { Auth, AuthGuard, type AuthContext } from "../auth/auth.guard.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { MessagesService } from "./messages.service.js";

@UseGuards(AuthGuard)
@Controller()
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get("conversations/:conversationId/messages")
  list(
    @Auth() auth: AuthContext,
    @Param("conversationId", ParseUUIDPipe) conversationId: string,
    @Query(new ZodValidationPipe(listMessagesQuerySchema)) query: ListMessagesQuery,
  ) {
    return this.messages.list(auth.userId, conversationId, query);
  }

  @Post("messages")
  async send(
    @Auth() auth: AuthContext,
    @Body(new ZodValidationPipe(sendMessageSchema)) body: SendMessageInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { message, created } = await this.messages.send(auth.userId, body);
    response.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return message;
  }

  @Put("messages/:messageId/reactions/:emoji")
  @HttpCode(HttpStatus.OK)
  addReaction(
    @Auth() auth: AuthContext,
    @Param("messageId", ParseUUIDPipe) messageId: string,
    @Param("emoji", new ZodValidationPipe(reactionEmojiSchema)) emoji: string,
  ) {
    return this.messages.react(auth.userId, messageId, emoji, true);
  }

  @Delete("messages/:messageId/reactions/:emoji")
  @HttpCode(HttpStatus.OK)
  removeReaction(
    @Auth() auth: AuthContext,
    @Param("messageId", ParseUUIDPipe) messageId: string,
    @Param("emoji", new ZodValidationPipe(reactionEmojiSchema)) emoji: string,
  ) {
    return this.messages.react(auth.userId, messageId, emoji, false);
  }
}
