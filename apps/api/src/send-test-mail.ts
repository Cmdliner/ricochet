import nodemailer from "nodemailer";

/**
 * Sends one email through the mail settings the server is using, so a wrong password, an unverified domain or a blocked
 * port shows up now, not when the first person tries to sign in.
 *
 *   docker compose exec api node dist/send-test-mail.js you@example.com
 */
const to = process.argv[2];
if (!to) {
  console.error("Usage: node dist/send-test-mail.js <your email address>");
  process.exit(1);
}

const host = process.env.SMTP_HOST ?? "localhost";
const secure = process.env.SMTP_SECURE === "true";
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.MAIL_FROM ?? "Ricochet <no-reply@ricochet.local>";

const transport = nodemailer.createTransport({
  host,
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure,
  requireTLS: !secure && process.env.NODE_ENV === "production",
  auth: user && pass ? { user, pass } : undefined,
});

try {
  await transport.verify();
  console.log(`Connected to ${host} and signed in.`);
  const sent = await transport.sendMail({
    from,
    to,
    subject: "Ricochet test email",
    text: "If you can read this, the server can send sign-in codes. You can ignore this message.",
  });
  console.log(`Sent to ${to} (${sent.messageId}). Check the inbox, and the spam folder if it is not there.`);
} catch (error) {
  console.error("The test email failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
