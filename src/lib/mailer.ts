import nodemailer from "nodemailer";

// ============================================================
// Mailer — kirim email sungguhan via SMTP.
// Kredensial dibaca dari .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// Jika SMTP_HOST kosong → email TIDAK hilang: tersimpan di EmailLog
// dengan status QUEUED dan bisa dilihat di halaman /kotak-masuk (mode demo).
// ============================================================

export interface MailAttachment {
  filename: string;
  content: Buffer; // isi file
  contentType: string;
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  attachments?: MailAttachment[];
}

export interface MailResult {
  status: "SENT" | "QUEUED" | "FAILED";
  error?: string;
}

export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_HOST.trim());
}

function getTransport() {
  const port = Number(process.env.SMTP_PORT || "465");
  const host = process.env.SMTP_HOST!.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
    auth: user ? { user, pass } : undefined,
  });
}

export async function sendMail(input: MailInput): Promise<MailResult> {
  if (!smtpConfigured()) {
    return { status: "QUEUED", error: "SMTP belum dikonfigurasi (mode demo)" };
  }
  try {
    const transport = getTransport();
    const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER || "no-reply@example.com";
    await transport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
    return { status: "SENT" };
  } catch (e) {
    return {
      status: "FAILED",
      error: e instanceof Error ? e.message : "Gagal mengirim email",
    };
  }
}

/** URL dasar untuk link di email (verifikasi dsb). */
export function appBaseUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
