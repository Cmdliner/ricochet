import { Controller, Get, Inject } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DRIZZLE, type Database } from "../db/db.module.js";

@Controller("health")
export class HealthController {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  @Get()
  async check() {
    let database: "up" | "down" = "up";
    try {
      await this.db.execute(sql`select 1`);
    } catch {
      database = "down";
    }
    return { status: database === "up" ? "ok" : "degraded", database, uptimeSeconds: Math.round(process.uptime()) };
  }
}
