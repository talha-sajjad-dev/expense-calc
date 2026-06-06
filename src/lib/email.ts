import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

let transporter: Transporter | null = null;

function getSmtpConfig() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s/g, "");
  if (!user || !pass) return null;

  return {
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  };
}

function createSmtpTransporter() {
  const config = getSmtpConfig();
  if (!config) return null;
  return nodemailer.createTransport(config);
}

function getTransporter() {
  if (!transporter) {
    transporter = createSmtpTransporter();
  }
  return transporter;
}

function resetTransporter() {
  transporter = null;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const transport = getTransporter();
  if (!transport) {
    console.warn("[email] SMTP_USER / SMTP_PASS not set — skipping:", subject);
    return { skipped: true as const, to };
  }

  const from =
    process.env.EMAIL_FROM ?? `SplitFlat <${process.env.SMTP_USER}>`;

  const attempt = async (retry: boolean) => {
    try {
      await transport.sendMail({ from, to, subject, html });
      return { success: true as const, to };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send email";
      if (retry) {
        resetTransporter();
        const fresh = getTransporter();
        if (!fresh) return { error: message, to };
        try {
          await fresh.sendMail({ from, to, subject, html });
          return { success: true as const, to };
        } catch (retryErr) {
          const retryMessage =
            retryErr instanceof Error
              ? retryErr.message
              : "Failed to send email";
          console.error("[email] send failed after retry:", to, retryMessage);
          return { error: retryMessage, to };
        }
      }
      console.error("[email] send failed:", to, message);
      return { error: message, to };
    }
  };

  const first = await attempt(false);
  if ("success" in first && first.success) return first;
  return attempt(true);
}

/** Send one email per recipient — Gmail is more reliable than a single multi-to send. */
export async function sendEmailToMany(
  recipients: string[],
  subject: string,
  html: string
) {
  const unique = [...new Set(recipients.map((e) => e.trim().toLowerCase()))].filter(
    Boolean
  );
  if (unique.length === 0) {
    return { sent: 0, failed: 0, results: [] as const };
  }

  const results = [];
  for (let i = 0; i < unique.length; i++) {
    const result = await sendEmail({ to: unique[i], subject, html });
    results.push(result);
    if (i < unique.length - 1) {
      await delay(400);
    }
  }

  const sent = results.filter((r) => "success" in r && r.success).length;
  const failed = results.length - sent;

  if (failed > 0) {
    console.warn(
      `[email] ${sent}/${results.length} delivered for "${subject}"`,
      results.filter((r) => "error" in r)
    );
  } else {
    console.log(`[email] ${sent}/${results.length} delivered for "${subject}"`);
  }

  return { sent, failed, results };
}
