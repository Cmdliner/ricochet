import { z } from "zod";

export const REPORT_REASONS = ["spam", "harassment", "inappropriate", "impersonation", "other"] as const;
export const reportReasonSchema = z.enum(REPORT_REASONS);
export type ReportReason = z.infer<typeof reportReasonSchema>;

export const REPORT_DETAILS_MAX = 500;

/** Report a message, or a person. A message report is about whoever sent it. */
export const createReportSchema = z
  .object({
    messageId: z.uuid().optional(),
    userId: z.uuid().optional(),
    reason: reportReasonSchema,
    details: z.string().trim().max(REPORT_DETAILS_MAX, `Keep it under ${REPORT_DETAILS_MAX} characters.`).optional(),
  })
  .refine((report) => (report.messageId === undefined) !== (report.userId === undefined), {
    message: "Say whether you are reporting a message or a person.",
  });
export type CreateReportInput = z.infer<typeof createReportSchema>;

export const reportCreatedSchema = z.object({ id: z.uuid() });
export type ReportCreated = z.infer<typeof reportCreatedSchema>;
