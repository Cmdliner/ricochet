import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { updateProfileSchema, type UpdateProfileInput } from "@ricochet/shared";
import { Auth, AuthGuard, type AuthContext } from "../auth/auth.guard.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { UsersService } from "./users.service.js";

@UseGuards(AuthGuard)
@Controller("me")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  me(@Auth() auth: AuthContext) {
    return this.users.getMe(auth.userId);
  }

  @Patch()
  update(
    @Auth() auth: AuthContext,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.users.updateMe(auth.userId, body);
  }
}
