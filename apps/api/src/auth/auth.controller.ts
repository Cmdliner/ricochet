import { Body, Controller, Delete, HttpCode, HttpStatus, Post, Put, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import {
  passwordLoginSchema,
  refreshSessionSchema,
  removePasswordSchema,
  requestLoginCodeSchema,
  setPasswordSchema,
  verifyLoginCodeSchema,
  type PasswordLoginInput,
  type RefreshSessionInput,
  type RemovePasswordInput,
  type RequestLoginCodeInput,
  type SetPasswordInput,
  type VerifyLoginCodeInput,
} from "@ricochet/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { Auth, AuthGuard, type AuthContext } from "./auth.guard.js";
import { AuthService } from "./auth.service.js";

/** Rate limits here are per IP. The service adds per-email limits on top. */
@UseGuards(ThrottlerGuard)
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("request-code")
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async requestCode(@Body(new ZodValidationPipe(requestLoginCodeSchema)) body: RequestLoginCodeInput) {
    await this.auth.requestCode(body.email);
    return { ok: true };
  }

  @Post("verify")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  verify(@Body(new ZodValidationPipe(verifyLoginCodeSchema)) body: VerifyLoginCodeInput) {
    return this.auth.verifyCode(body.email, body.code);
  }

  @Post("password-login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  passwordLogin(@Body(new ZodValidationPipe(passwordLoginSchema)) body: PasswordLoginInput) {
    return this.auth.loginWithPassword(body.email, body.password);
  }

  @Put("password")
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  setPassword(@Auth() auth: AuthContext, @Body(new ZodValidationPipe(setPasswordSchema)) body: SetPasswordInput) {
    return this.auth.setPassword(auth.userId, auth.sessionId, body);
  }

  @Delete("password")
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  removePassword(@Auth() auth: AuthContext, @Body(new ZodValidationPipe(removePasswordSchema)) body: RemovePasswordInput) {
    return this.auth.removePassword(auth.userId, body.password);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  refresh(@Body(new ZodValidationPipe(refreshSessionSchema)) body: RefreshSessionInput) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async logout(@Body(new ZodValidationPipe(refreshSessionSchema)) body: RefreshSessionInput) {
    await this.auth.logout(body.refreshToken);
  }
}
