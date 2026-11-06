import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module.js";
import { validateEnv } from "./config/env.js";
import { DbModule } from "./db/db.module.js";
import { HealthController } from "./health/health.controller.js";
import { HubsModule } from "./hubs/hubs.module.js";
import { JobsModule } from "./jobs/jobs.module.js";
import { RealtimeModule } from "./realtime/realtime.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, envFilePath: ["../../.env", ".env"] }),
    DbModule,
    AuthModule,
    UsersModule,
    HubsModule,
    JobsModule,
    RealtimeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
