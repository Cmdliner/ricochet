import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  chatSettingsSchema,
  createChatSchema,
  searchPeopleQuerySchema,
  type ChatSettingsInput,
  type CreateChatInput,
  type SearchPeopleQuery,
} from "@ricochet/shared";
import { Auth, AuthGuard, type AuthContext } from "../auth/auth.guard.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { ChatsService } from "./chats.service.js";
import { PeopleService } from "./people.service.js";

@UseGuards(AuthGuard)
@Controller()
export class ChatsController {
  constructor(
    private readonly chats: ChatsService,
    private readonly people: PeopleService,
  ) {}

  @Get("people/search")
  search(@Auth() auth: AuthContext, @Query(new ZodValidationPipe(searchPeopleQuerySchema)) query: SearchPeopleQuery) {
    return this.people.search(auth.userId, query.q);
  }

  @Get("chats")
  list(@Auth() auth: AuthContext) {
    return this.chats.list(auth.userId);
  }

  @Post("chats")
  open(@Auth() auth: AuthContext, @Body(new ZodValidationPipe(createChatSchema)) body: CreateChatInput) {
    return this.chats.open(auth.userId, body.userId);
  }

  @Get("chats/:chatId")
  get(@Auth() auth: AuthContext, @Param("chatId", ParseUUIDPipe) chatId: string) {
    return this.chats.get(auth.userId, chatId);
  }

  @Patch("chats/:chatId/me")
  updateSettings(
    @Auth() auth: AuthContext,
    @Param("chatId", ParseUUIDPipe) chatId: string,
    @Body(new ZodValidationPipe(chatSettingsSchema)) body: ChatSettingsInput,
  ) {
    return this.chats.updateSettings(auth.userId, chatId, body);
  }
}
