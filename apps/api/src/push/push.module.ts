import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module.js";
import type { Env } from "../config/env.js";
import { RealtimeBusModule } from "../realtime/realtime-bus.module.js";
import { DevicesController } from "./devices.controller.js";
import { ExpoPushProvider } from "./expo-push-provider.js";
import { LogPushProvider } from "./log-push-provider.js";
import { PUSH_PROVIDER, type PushProvider } from "./push-provider.js";
import { PushService } from "./push.service.js";

/** The one place that picks the push provider. Everything else asks for `PushService`. */
@Module({
  imports: [AuthModule, RealtimeBusModule],
  controllers: [DevicesController],
  providers: [
    {
      provide: PUSH_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): PushProvider =>
        config.get("PUSH_PROVIDER", { infer: true }) === "log"
          ? new LogPushProvider()
          : new ExpoPushProvider(config.get("EXPO_PUSH_URL", { infer: true }), config.get("EXPO_ACCESS_TOKEN", { infer: true })),
    },
    PushService,
  ],
  exports: [PushService],
})
export class PushModule {}
