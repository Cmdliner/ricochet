import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module.js";
import type { Env } from "./config/env.js";
import { RedisIoAdapter } from "./realtime/redis-io.adapter.js";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  // Behind a proxy every request arrives from the proxy's address. Naming how many proxies sit in front lets the rate
  // limits see the real caller. Left at 0 when nothing is in front, because then the header could be forged.
  const proxies = config.get("TRUST_PROXY_HOPS", { infer: true });
  if (proxies > 0) app.set("trust proxy", proxies);

  const adapter = new RedisIoAdapter(app);
  adapter.connectToRedis(config.get("REDIS_URL", { infer: true }));
  app.useWebSocketAdapter(adapter);

  // Browsers (the app's web build, used in development) need CORS. Phones do not.
  if (config.get("NODE_ENV", { infer: true }) !== "production") app.enableCors();

  app.enableShutdownHooks();
  await app.listen(config.get("PORT", { infer: true }));
}

await bootstrap();
