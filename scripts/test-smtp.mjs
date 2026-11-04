// ============================================================
// Tes kirim email sungguhan via SMTP (dipakai saat kredensial baru diisi)
// Jalankan: node scripts/test-smtp.mjs tujuan@gmail.com
// ============================================================
import { createTransport } from "nodemailer";
import { readFileSync } from "fs";

// Parse .env sederhana
const env = {};
for (const line of readFileSync("/home/z/my-project/.env", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const host = env.SMTP_HOST?.trim();
const port = Number(env.SMTP_PORT || "465");
const user = env.SMTP_USER?.trim();
const pass = env.SMTP_PASS;
const from = env.SMTP_FROM?.trim() || user;

if (!host || !user || !pass) {
  console.error("❌ SMTP belum lengkap di .env (SMTP_HOST / SMTP_USER / SMTP_PASS)");
  process.exit(1);
}

const to = process.argv[2] || user;
console.log(`Mengirim tes dari ${from} → ${to} via ${host}:${port} ...`);

try {
  const transport = createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  const info = await transport.sendMail({
    from,
    to,
    subject: "Tes SMTP — ATMI Campus Tour",
    html: `<p>Ini email tes dari website <b>ATMI Campus Tour</b>.</p>
           <p>Jika email ini sampai ke inbox Anda, berarti SMTP sudah aktif dan
           kartu reservasi pendaftar akan terkirim otomatis. 🎉</p>`,
  });
  console.log("✅ TERKIRIM! ID:", info.messageId);
} catch (e) {
  console.error("❌ GAGAL:", e.message);
  process.exit(1);
}
