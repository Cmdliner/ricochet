import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../config/env.js";
import { LocalMediaController } from "./local-media.controller.js";
import { LocalMediaStorage } from "./local-media-storage.js";
import { MEDIA_STORAGE, type MediaStorage } from "./media-storage.js";
import { MediaService } from "./media.service.js";
import { R2MediaStorage } from "./r2-media-storage.js";

/** The one place that picks the provider. Everything else asks for `MediaService` and never learns which one it got. */
@Global()
@Module({
  controllers: [LocalMediaController],
  providers: [
    {
      provide: MEDIA_STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): MediaStorage => {
        if (config.get("MEDIA_PROVIDER", { infer: true }) === "r2") {
          return new R2MediaStorage({
            accountId: config.get("R2_ACCOUNT_ID", { infer: true }) ?? "",
            accessKeyId: config.get("R2_ACCESS_KEY_ID", { infer: true }) ?? "",
            secretAccessKey: config.get("R2_SECRET_ACCESS_KEY", { infer: true }) ?? "",
            publicBucket: config.get("R2_PUBLIC_BUCKET", { infer: true }) ?? "",
            privateBucket: config.get("R2_PRIVATE_BUCKET", { infer: true }) ?? "",
            publicBaseUrl: config.get("R2_PUBLIC_URL", { infer: true }) ?? "",
          });
        }
        return new LocalMediaStorage(config.get("MEDIA_LOCAL_DIR", { infer: true }), config.get("JWT_SECRET", { infer: true }));
      },
    },
    MediaService,
  ],
  exports: [MEDIA_STORAGE, MediaService],
})
export class MediaModule {}
