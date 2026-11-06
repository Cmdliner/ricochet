import { Body, Controller, HttpCode, HttpStatus, Post, Put, UseGuards } from "@nestjs/common";
import {
  registerDeviceSchema,
  unregisterDeviceSchema,
  type RegisterDeviceInput,
  type UnregisterDeviceInput,
} from "@ricochet/shared";
import { Auth, AuthGuard, type AuthContext } from "../auth/auth.guard.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import { PushService } from "./push.service.js";

@UseGuards(AuthGuard)
@Controller("devices")
export class DevicesController {
  constructor(private readonly push: PushService) {}

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(@Auth() auth: AuthContext, @Body(new ZodValidationPipe(registerDeviceSchema)) body: RegisterDeviceInput) {
    await this.push.registerDevice(auth.userId, body);
  }

  @Post("unregister")
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregister(@Auth() auth: AuthContext, @Body(new ZodValidationPipe(unregisterDeviceSchema)) body: UnregisterDeviceInput) {
    await this.push.unregisterDevice(auth.userId, body.pushToken);
  }
}
