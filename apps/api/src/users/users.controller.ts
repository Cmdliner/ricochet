import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from "@nestjs/common";
import {
  avatarUploadRequestSchema,
  confirmAvatarSchema,
  updateProfileSchema,
  type AvatarUploadRequest,
  type ConfirmAvatarInput,
  type UpdateProfileInput,
} from "@ricochet/shared";
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

  @Post("avatar/upload")
  @HttpCode(HttpStatus.OK)
  requestAvatarUpload(
    @Auth() auth: AuthContext,
    @Body(new ZodValidationPipe(avatarUploadRequestSchema)) body: AvatarUploadRequest,
  ) {
    return this.users.requestAvatarUpload(auth.userId, body);
  }

  @Post("avatar")
  @HttpCode(HttpStatus.OK)
  confirmAvatar(@Auth() auth: AuthContext, @Body(new ZodValidationPipe(confirmAvatarSchema)) body: ConfirmAvatarInput) {
    return this.users.confirmAvatar(auth.userId, body.key);
  }

  @Delete("avatar")
  removeAvatar(@Auth() auth: AuthContext) {
    return this.users.removeAvatar(auth.userId);
  }
}
