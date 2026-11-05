import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LIMITS } from "@ricochet/shared";
import nodemailer, { type Transporter } from "nodemailer";
import type { Env } from "../config/env.js";

type LoginCodeMail = { to: string; code: string; link: string };

@Injectable()
export class MailService {
  private readonly log = new Logger(MailService.name);
  private readonly transport: Transporter;
  private readonly from: string;

  constructor(config: ConfigService<Env, true>) {
    const user = config.get("SMTP_USER", { infer: true });
    const pass = config.get("SMTP_PASS", { infer: true });
    this.from = config.get("MAIL_FROM", { infer: true });
    this.transport = nodemailer.createTransport({
      host: config.get("SMTP_HOST", { infer: true }),
      port: config.get("SMTP_PORT", { infer: true }),
      secure: config.get("SMTP_SECURE", { infer: true }),
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendLoginCode({ to, code, link }: LoginCodeMail) {
    const minutes = LIMITS.loginCodeTtlMs / 60_000;
    const text = [
      `Your Ricochet code is ${code}.`,
      "",
      `Or open this link on your phone: ${link}`,
      "",
      `It works for ${minutes} minutes and only once. If you did not ask for it, you can ignore this email.`,
    ].join("\n");

    const html = `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:#100e0d;font-family:Arial,Helvetica,sans-serif;color:#f6f1ea">
  <table role="presentation" width="100%" style="max-width:440px;margin:0 auto">
    <tr><td style="font-size:22px;font-weight:700;padding-bottom:24px">ricochet</td></tr>
    <tr><td style="background:#181513;border:1px solid #322c28;border-radius:20px;padding:28px">
      <p style="margin:0 0 8px;color:#aaa196;font-size:14px">Your sign in code</p>
      <p style="margin:0 0 20px;font-size:38px;letter-spacing:10px;font-weight:700">${code}</p>
      <a href="${link}" style="display:inline-block;background:#e9714e;color:#1f0c05;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">Open Ricochet</a>
      <p style="margin:20px 0 0;color:#aaa196;font-size:13px;line-height:1.5">It works for ${minutes} minutes and only once. If you did not ask for it, you can ignore this email.</p>
    </td></tr>
  </table>
</body></html>`;

    await this.transport.sendMail({ from: this.from, to, subject: `${code} is your Ricochet code`, text, html });
    this.log.log(`sign in code sent to ${to}`);
  }
}
