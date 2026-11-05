import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module.js";
import type { Env } from "./config/env.js";
import { RedisIoAdapter } from "./realtime/redis-io.adapter.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  const adapter = new RedisIoAdapter(app);
  adapter.connectToRedis(config.get("REDIS_URL", { infer: true }));
  app.useWebSocketAdapter(adapter);

  // Browsers (the app's web build, used in development) need CORS. Phones do not.
  if (config.get("NODE_ENV", { infer: true }) !== "production") app.enableCors();

  app.enableShutdownHooks();
  await app.listen(config.get("PORT", { infer: true }));
}

await bootstrap();
