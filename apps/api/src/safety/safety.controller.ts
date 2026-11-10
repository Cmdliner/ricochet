import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { createReportSchema, type CreateReportInput } from "@ricochet/shared";
import { Auth, AuthGuard, type AuthContext } from "../auth/auth.guard.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { SafetyService } from "./safety.service.js";

@UseGuards(AuthGuard)
@Controller()
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}

  @Get("blocks")
  list(@Auth() auth: AuthContext) {
    return this.safety.listBlocked(auth.userId);
  }

  @Put("blocks/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async block(@Auth() auth: AuthContext, @Param("userId", ParseUUIDPipe) userId: string) {
    await this.safety.block(auth.userId, userId);
  }

  @Delete("blocks/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblock(@Auth() auth: AuthContext, @Param("userId", ParseUUIDPipe) userId: string) {
    await this.safety.unblock(auth.userId, userId);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("reports")
  create(@Auth() auth: AuthContext, @Body(new ZodValidationPipe(createReportSchema)) body: CreateReportInput) {
    return this.safety.report(auth.userId, body);
  }
}
