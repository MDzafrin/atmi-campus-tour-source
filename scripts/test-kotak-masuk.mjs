/* Uji kotak masuk: pending muncul, verifikasi kirim kartu, entri >2x24 jam hilang */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const BASE = "http://localhost:3000";

async function main() {
  // 1) Buat reservasi PENDING langsung di DB (tanpa email notifikasi)
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  const code = `ATMI-UJI-${rnd}`;
  const r = await db.reservation.create({
    data: {
      code,
      verifyToken: crypto.randomUUID(),
      tourType: "student-course-tour",
      programName: "Student Course Tour",
      participants: 20,
      date: "2026-11-10",
      timeSlot: "09:00-11:00",
      name: "Uji Kotak Masuk",
      institution: "SMA Tes Inbox",
      email: "panjiarie4806@gmail.com",
      phone: "081295187492",
    },
  });
  console.log("1) reservasi PENDING dibuat:", r.code, "| status:", r.status);

  // 2) Backdate reservasi terverifikasi tertua agar terverifikasi 3 hari lalu
  const target = await db.reservation.findFirst({
    where: { status: "CONFIRMED", code: { not: code } },
    orderBy: { verifiedAt: "asc" },
  });
  const tigaHariLalu = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const old = await db.reservation.update({
    where: { id: target.id },
    data: { verifiedAt: tigaHariLalu },
  });
  console.log("2)", old.code, "di-backdate verifiedAt ->", old.verifiedAt.toISOString(), "(3 hari lalu)");

  // 3) Login admin + verifikasi reservasi uji via API (yang dipakai tombol UI)
  const login = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "atmi2026" }),
  });
  const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
  const ver = await fetch(`${BASE}/api/admin/reservations/${r.id}/verify`, {
    method: "POST",
    headers: { cookie },
  });
  const verData = await ver.json();
  console.log("3) verifikasi:", ver.status, JSON.stringify(verData), "-> kartu terkirim ke pendaftar");

  // 4) Cek logika filter 48 jam yang dipakai halaman kotak masuk
  const rows = await db.reservation.findMany();
  const windowMs = 48 * 60 * 60 * 1000;
  const pending = rows.filter((x) => x.status !== "CONFIRMED");
  const verifiedVisible = rows.filter((x) => {
    if (x.status !== "CONFIRMED") return false;
    const t = new Date(x.verifiedAt ?? x.createdAt).getTime();
    return Date.now() - t <= windowMs;
  });
  console.log("4) tampil di Kotak Masuk -> menunggu:", pending.length, "| sudah terverifikasi (<=48 jam):", verifiedVisible.length);
  console.log("   Z5NJ (3 hari lalu) ikut tampil?", verifiedVisible.some((x) => x.code === "ATMI-20261103-Z5NJ") ? "YA (SALAH)" : "TIDAK (BENAR - hilang otomatis)");
  console.log("   kartu uji", r.code, "ada di daftar terverifikasi?", verifiedVisible.some((x) => x.code === r.code) ? "YA (BENAR)" : "TIDAK (SALAH)");

  await db.$disconnect();
}

main().catch((e) => {
  console.error("GAGAL:", e);
  process.exit(1);
});
