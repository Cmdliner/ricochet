// Drizzle may wrap the driver error, so the code can be on .cause.
export function isUniqueViolation(error: unknown): boolean {
  const code =
    (error as { code?: string } | null)?.code ?? (error as { cause?: { code?: string } } | null)?.cause?.code;
  return code === "23505";
}
