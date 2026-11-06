import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from "@nestjs/common";
import {
  listActivityQuerySchema,
  markActivityReadSchema,
  type ListActivityQuery,
  type MarkActivityReadInput,
} from "@ricochet/shared";
import { Auth, AuthGuard, type AuthContext } from "../auth/auth.guard.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { ActivityService } from "./activity.service.js";

@UseGuards(AuthGuard)
@Controller("activity")
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get()
  list(@Auth() auth: AuthContext, @Query(new ZodValidationPipe(listActivityQuerySchema)) query: ListActivityQuery) {
    return this.activity.list(auth.userId, query);
  }

  @Post("read")
  @HttpCode(HttpStatus.OK)
  markRead(@Auth() auth: AuthContext, @Body(new ZodValidationPipe(markActivityReadSchema)) body: MarkActivityReadInput) {
    return this.activity.markRead(auth.userId, body);
  }
}
