"use strict";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomBetween = (min, max) => Math.floor(min + Math.random() * (max - min + 1));

/** "0812-8833-1700", "+62 812 8833 1700" -> "6281288331700" */
function toIntl(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  return d;
}

/**
 * Ambil satu batch pesan dari server, kirim satu per satu dengan jeda acak,
 * lalu laporkan hasil tiap pesan ke server.
 *
 * `api(method, path, body)` dan `client` (getNumberId, sendMessage) disuntikkan
 * dari luar supaya logika ini bisa diuji tanpa WhatsApp sungguhan.
 */
async function processBatch({
  api,
  client,
  limit,
  minDelayMs,
  maxDelayMs,
  log = console.log,
  sleepFn = sleep,
}) {
  const res = await api("GET", `/api/wa/outbox?limit=${limit}`);
  const messages = (res && res.messages) || [];
  let sent = 0;

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    try {
      const numberId = await client.getNumberId(m.to);
      if (!numberId) {
        await api("POST", `/api/wa/outbox/${m.id}`, {
          status: "FAILED",
          error: "NOMOR_TIDAK_ADA_DI_WHATSAPP",
          retry: false,
        });
        log(`[gagal] ${m.to}: nomor tidak terdaftar di WhatsApp`);
      } else {
        await client.sendMessage(numberId._serialized, m.body);
        await api("POST", `/api/wa/outbox/${m.id}`, { status: "SENT" });
        sent++;
        log(`[terkirim] ke ${m.to}`);
      }
    } catch (e) {
      const msg = String((e && e.message) || e).slice(0, 250);
      log(`[error] ${m.to}: ${msg}`);
      try {
        await api("POST", `/api/wa/outbox/${m.id}`, { status: "FAILED", error: msg, retry: true });
      } catch (reportError) {
        log(`[error] gagal melapor ke server: ${String(reportError.message || reportError)}`);
      }
    }
    if (i < messages.length - 1) await sleepFn(randomBetween(minDelayMs, maxDelayMs));
  }
  return { claimed: messages.length, sent };
}

module.exports = { processBatch, toIntl, randomBetween };
