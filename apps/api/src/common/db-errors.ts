/**
 * Postgres reports a duplicate value in a unique column with the error code 23505.
 * Drizzle sometimes wraps the driver's error, so the code can be one level down.
 */
export function isUniqueViolation(error: unknown): boolean {
  const code =
    (error as { code?: string } | null)?.code ?? (error as { cause?: { code?: string } } | null)?.cause?.code;
  return code === "23505";
}
