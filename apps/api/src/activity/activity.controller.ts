import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import {
  listActivityQuerySchema,
  markActivityReadSchema,
  respondToInviteSchema,
  type ListActivityQuery,
  type MarkActivityReadInput,
  type RespondToInviteInput,
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

  @Post(":activityId/respond")
  @HttpCode(HttpStatus.OK)
  respond(
    @Auth() auth: AuthContext,
    @Param("activityId", ParseUUIDPipe) activityId: string,
    @Body(new ZodValidationPipe(respondToInviteSchema)) body: RespondToInviteInput,
  ) {
    return this.activity.respond(auth.userId, activityId, body.accept);
  }
}
