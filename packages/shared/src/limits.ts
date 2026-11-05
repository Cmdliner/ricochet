/** Product limits. One place, so the app, the API and the workers always agree. */
export const LIMITS = {
  /** Largest group chat. */
  maxGroupSize: 40,
  /** Voice note length cap: 10 minutes. */
  voiceNoteMaxMs: 10 * 60 * 1000,
  /** Video note length cap: 60 seconds. */
  videoNoteMaxMs: 60 * 1000,
  /** A recording shorter than this is discarded as an accidental tap. */
  minRecordingMs: 1000,
  messageBodyMax: 4000,
  /** Login code: six digits, valid for ten minutes, five tries. */
  loginCodeLength: 6,
  loginCodeTtlMs: 10 * 60 * 1000,
  loginCodeMaxAttempts: 5,
  /** At most this many codes per email per hour, and a short gap between them. */
  loginCodesPerHour: 5,
  loginCodeResendGapMs: 30 * 1000,
  /** Sign in sessions stay alive this long after last use. */
  refreshTokenTtlDays: 30,
  displayNameMax: 40,
  handleMin: 3,
  handleMax: 20,
} as const;
