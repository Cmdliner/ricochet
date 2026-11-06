import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ActivityModule } from "./activity/activity.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { validateEnv } from "./config/env.js";
import { DbModule } from "./db/db.module.js";
import { HealthController } from "./health/health.controller.js";
import { HubsModule } from "./hubs/hubs.module.js";
import { MessagesModule } from "./messages/messages.module.js";
import { PodsModule } from "./pods/pods.module.js";
import { JobsModule } from "./jobs/jobs.module.js";
import { RealtimeModule } from "./realtime/realtime.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, envFilePath: ["../../.env", ".env"] }),
    DbModule,
    AuthModule,
    UsersModule,
    ActivityModule,
    HubsModule,
    PodsModule,
    MessagesModule,
    JobsModule,
    RealtimeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
