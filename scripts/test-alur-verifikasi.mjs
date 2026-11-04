/* Uji alur: daftar -> admin verifikasi -> kartu PDF ke pendaftar */
import { PrismaClient } from "@prisma/client";

const BASE = "http://localhost:3000";

async function main() {
  const db = new PrismaClient();

  console.log("=== LANGKAH 1: Pendaftar mengisi formulir ===");
  const today = new Date();
  const dates = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  const cfg = await fetch(`${BASE}/api/settings`).then((r) => r.json()).catch(() => null);
  const openDates = cfg?.settings?.openDates?.length ? cfg.settings.openDates : dates;
  const slots = cfg?.settings?.timeSlots?.length ? cfg.settings.timeSlots : ["09:00-11:00"];
  const prog = cfg?.programs?.[0]?.slug || "student-course-tour";

  const email = "panjiarie4806@gmail.com";
  const reg = await fetch(`${BASE}/api/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tourType: prog,
      participants: 25,
      date: openDates[0],
      timeSlot: slots[0],
      name: "Uji Alur Verifikasi",
      institution: "SMA Uji Coba Alur",
      email,
      phone: "081295187492",
      notes: "Tes alur baru: kartu hanya terkirim setelah verifikasi admin",
    }),
  });
  const regData = await reg.json();
  console.log("status API   :", reg.status);
  console.log("emailMode    :", regData.emailMode);
  console.log("respon contains code?", "code" in regData ? "YA (harusnya TIDAK)" : "TIDAK (benar)");

  const newest = await db.reservation.findFirst({ orderBy: { createdAt: "desc" } });
  console.log("kode         :", newest.code, "| status:", newest.status);

  const logsAfterReg = await db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 3 });
  console.log("\n--- Email setelah mendaftar (3 terakhir) ---");
  for (const l of logsAfterReg) {
    console.log(`  -> ${l.toEmail} | ${l.subject} | ${l.status}`);
  }
  const sentToRegistrant = logsAfterReg.some(
    (l) => l.toEmail === email && !l.subject.includes("Notifikasi Admin"),
  );
  console.log("\nADA email kartu ke pendaftar sebelum verifikasi?", sentToRegistrant ? "YA (SALAH!)" : "TIDAK (BENAR)");

  console.log("\n=== LANGKAH 2: Admin verifikasi di dashboard ===");
  const login = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD || "atmi2026" }),
  });
  const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
  console.log("login admin  :", login.status, cookie ? "(cookie ok)" : "(tanpa cookie!)");

  const ver = await fetch(`${BASE}/api/admin/reservations/${newest.id}/verify`, {
    method: "POST",
    headers: { cookie },
  });
  const verData = await ver.json();
  console.log("verifikasi   :", ver.status, JSON.stringify(verData));

  const after = await db.reservation.findUnique({ where: { id: newest.id } });
  console.log("status kini  :", after.status);

  const logsAfterVer = await db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 2 });
  console.log("\n--- Email setelah verifikasi (2 terakhir) ---");
  for (const l of logsAfterVer) {
    console.log(`  -> ${l.toEmail} | ${l.subject} | ${l.status}${l.error ? " | " + l.error : ""}`);
  }

  console.log("\n=== LANGKAH 3: Unduh PDF kartu ===");
  const pdfRes = await fetch(`${BASE}/kartu/${after.verifyToken}`);
  const buf = Buffer.from(await pdfRes.arrayBuffer());
  console.log("HTTP         :", pdfRes.status, "| Content-Type:", pdfRes.headers.get("content-type"));
  console.log("ukuran PDF   :", buf.length, "bytes | header PDF?", buf.subarray(0, 4).toString() === "%PDF" ? "YA" : "TIDAK!");

  console.log("\n=== LANGKAH 4: /kotak-masuk wajib login admin ===");
  const anon = await fetch(`${BASE}/kotak-masuk`, { redirect: "manual" });
  console.log("tanpa login  : HTTP", anon.status, "-> location:", anon.headers.get("location"));
  const withCookie = await fetch(`${BASE}/kotak-masuk`, { headers: { cookie }, redirect: "manual" });
  console.log("dengan login : HTTP", withCookie.status);

  await db.$disconnect();
}

main().catch((e) => {
  console.error("TEST GAGAL:", e);
  process.exit(1);
});
