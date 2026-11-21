"use strict";

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { processBatch, toIntl } = require("./lib");

const APP_URL = (process.env.WA_APP_URL || "").replace(/\/$/, "");
const SECRET = process.env.WA_WORKER_SECRET || "";
const POLL_MS = Math.max(Number(process.env.WA_POLL_SECONDS || 10), 3) * 1000;
const MIN_DELAY_MS = Math.max(Number(process.env.WA_MIN_DELAY_SECONDS || 5), 1) * 1000;
const MAX_DELAY_MS = Math.max(Number(process.env.WA_MAX_DELAY_SECONDS || 15) * 1000, MIN_DELAY_MS);
const DAILY_CAP = Math.max(Number(process.env.WA_DAILY_CAP || 100), 1);
const BLOCKED = (process.env.WA_BLOCKED_NUMBERS || "6281288331700")
  .split(",")
  .map(toIntl)
  .filter(Boolean);
const STATE_FILE = path.join(__dirname, "wa-state.json");

if (!APP_URL || SECRET.length < 16) {
  console.error("Isi WA_APP_URL dan WA_WORKER_SECRET (minimal 16 karakter) di file .env dulu.");
  process.exit(1);
}

const log = (...a) => console.log(new Date().toLocaleTimeString("id-ID"), ...a);

// ---------- Batas harian (disimpan ke file supaya tidak hilang saat restart) ----------
const today = () => new Date().toLocaleDateString("sv-SE"); // yyyy-MM-dd, waktu lokal
function readState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    return s.date === today() ? s : { date: today(), count: 0 };
  } catch {
    return { date: today(), count: 0 };
  }
}
function addSent(n) {
  const s = readState();
  s.count += n;
  fs.writeFileSync(STATE_FILE, JSON.stringify(s));
}

// ---------- Panggilan ke aplikasi web ----------
async function api(method, pathname, body) {
  const res = await fetch(APP_URL + pathname, {
    method,
    headers: { "content-type": "application/json", "x-wa-secret": SECRET },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${method} ${pathname} -> HTTP ${res.status}`);
  return res.json();
}

// ---------- WhatsApp ----------
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, ".wwebjs_auth") }),
  puppeteer: { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] },
});

let ready = false;
let busy = false;

client.on("qr", (qr) => {
  log("Pindai QR ini dengan WhatsApp NOMOR KHUSUS (Perangkat tertaut > Tautkan perangkat):");
  qrcode.generate(qr, { small: true });
});
client.on("authenticated", () => log("Login WhatsApp berhasil."));
client.on("auth_failure", (m) => log("Login gagal:", m));
client.on("disconnected", (reason) => {
  ready = false;
  log("Terputus dari WhatsApp:", reason, "- jalankan ulang program ini.");
});

client.on("ready", async () => {
  const number = client.info && client.info.wid ? client.info.wid.user : "";
  if (BLOCKED.includes(number)) {
    log(`BERHENTI: nomor ${number} ada di daftar terlarang (WA_BLOCKED_NUMBERS).`);
    log("Hapus folder .wwebjs_auth, lalu jalankan ulang dan pindai QR dengan nomor khusus.");
    await client.destroy();
    process.exit(1);
  }
  ready = true;
  log(`Siap. Mengirim sebagai nomor ${number}. Mengecek antrean tiap ${POLL_MS / 1000} detik.`);
});

async function tick() {
  if (!ready || busy) return;
  busy = true;
  try {
    const remaining = DAILY_CAP - readState().count;
    if (remaining <= 0) {
      log(`Batas harian (${DAILY_CAP}) tercapai. Menunggu besok.`);
      return;
    }
    const result = await processBatch({
      api,
      client,
      limit: Math.min(5, remaining),
      minDelayMs: MIN_DELAY_MS,
      maxDelayMs: MAX_DELAY_MS,
      log,
    });
    if (result.sent > 0) addSent(result.sent);
  } catch (e) {
    log("Gagal mengecek antrean:", e.message);
  } finally {
    busy = false;
  }
}

setInterval(tick, POLL_MS);
process.on("SIGINT", async () => {
  log("Menutup...");
  try {
    await client.destroy();
  } finally {
    process.exit(0);
  }
});

log("Memulai WhatsApp...");
client.initialize();
