import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { validateEnv } from "./config/env.js";
import { DbModule } from "./db/db.module.js";
import { JobsModule } from "./jobs/jobs.module.js";

/**
 * The background worker. Same codebase as the API, separate process, so heavy video work
 * never slows live traffic. Run with `pnpm --filter @ricochet/api start:worker`.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, envFilePath: ["../../.env", ".env"] }),
    DbModule,
    JobsModule,
  ],
})
class WorkerModule {}

const app = await NestFactory.createApplicationContext(WorkerModule);
app.enableShutdownHooks();
