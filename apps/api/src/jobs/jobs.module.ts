import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { QUEUES } from "@ricochet/shared";
import type { Env } from "../config/env.js";
import { MessageViewModule } from "../messages/message-view.module.js";
import { RealtimeBusModule } from "../realtime/realtime-bus.module.js";
import { MediaProcessor } from "./media.processor.js";

@Module({
  imports: [
    MessageViewModule,
    RealtimeBusModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const url = new URL(config.get("REDIS_URL", { infer: true }));
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            password: url.password || undefined,
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: QUEUES.media },
      { name: QUEUES.push },
      { name: QUEUES.maintenance },
    ),
  ],
  providers: [MediaProcessor],
  exports: [BullModule],
})
export class JobsModule {}
