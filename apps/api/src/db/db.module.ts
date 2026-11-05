import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as schema from "@ricochet/db";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Env } from "../config/env.js";

export const DRIZZLE = Symbol("DRIZZLE");
export type Database = NodePgDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): Database =>
        drizzle({
          client: new Pool({ connectionString: config.get("DATABASE_URL", { infer: true }) }),
          schema,
        }),
    },
  ],
  exports: [DRIZZLE],
})
export class DbModule {}
