import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./config/env.js";
import { DbModule } from "./db/db.module.js";
import { HealthController } from "./health/health.controller.js";
import { JobsModule } from "./jobs/jobs.module.js";
import { RealtimeModule } from "./realtime/realtime.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, envFilePath: ["../../.env", ".env"] }),
    DbModule,
    JobsModule,
    RealtimeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
