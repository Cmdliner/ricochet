import { BadRequestException, type PipeTransform } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import type { ZodType, z } from "zod";

type Transport = "http" | "ws";

/**
 * Validates a request body or socket payload against a Zod schema from `@ricochet/shared`.
 * The same schema runs on the phone first, then here, so the rules cannot drift apart.
 */
export class ZodValidationPipe<S extends ZodType> implements PipeTransform<unknown, z.output<S>> {
  constructor(
    private readonly schema: S,
    private readonly transport: Transport = "http",
  ) {}

  transform(value: unknown): z.output<S> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    if (this.transport === "ws") throw new WsException({ message: "Invalid payload", issues });
    throw new BadRequestException({ message: "Invalid request", issues });
  }
}
