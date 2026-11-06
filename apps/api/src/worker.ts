import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { validateEnv } from "./config/env.js";
import { DbModule } from "./db/db.module.js";
import { MediaModule } from "./media/media.module.js";
import { JobsModule } from "./jobs/jobs.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, envFilePath: ["../../.env", ".env"] }),
    DbModule,
    MediaModule,
    JobsModule,
  ],
})
class WorkerModule {}

const app = await NestFactory.createApplicationContext(WorkerModule);
app.enableShutdownHooks();
