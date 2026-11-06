export const LIMITS = {
  maxGroupSize: 40,
  voiceNoteMaxMs: 10 * 60 * 1000,
  videoNoteMaxMs: 60 * 1000,
  /** A recording shorter than this is discarded as an accidental tap. */
  minRecordingMs: 1000,
  messageBodyMax: 4000,
  voiceNoteMaxBytes: 25 * 1_000_000,
  videoNoteMaxBytes: 80 * 1_000_000,
  loginCodeLength: 6,
  loginCodeTtlMs: 10 * 60 * 1000,
  loginCodeMaxAttempts: 5,
  loginCodesPerHour: 5,
  loginCodeResendGapMs: 30 * 1000,
  /** Sign in sessions stay alive this long after last use. */
  refreshTokenTtlDays: 30,
  displayNameMax: 40,
  handleMin: 3,
  handleMax: 20,
} as const;
