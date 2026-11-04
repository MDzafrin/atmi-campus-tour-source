// Salin data dari db/custom.db (SQLite lama) ke database di DATABASE_URL (Supabase).
// Jalankan SETELAH `bun run db:push`:   bun scripts/migrate-sqlite-ke-supabase.ts
// Aman dijalankan ulang: baris yang sudah ada dilewati.
import { Database } from "bun:sqlite";
import { PrismaClient } from "@prisma/client";

const sqlite = new Database("db/custom.db", { readonly: true });
const db = new PrismaClient();

// SQLite menyimpan DateTime Prisma sebagai milidetik (integer)
const tgl = (v: unknown) => (v == null ? null : new Date(Number(v)));
const baca = (tabel: string) => sqlite.query(`SELECT * FROM "${tabel}"`).all() as any[];

async function main() {
  const setting = baca("SiteSetting")[0];
  if (setting) {
    const { updatedAt, ...data } = setting;
    await db.siteSetting.upsert({ where: { id: 1 }, update: data, create: data });
  }

  let programs = 0;
  for (const p of baca("TourProgram")) {
    const { createdAt, updatedAt, ...data } = p;
    await db.tourProgram.upsert({
      where: { slug: p.slug },
      update: { ...data, active: !!p.active, highlight: !!p.highlight },
      create: { ...data, active: !!p.active, highlight: !!p.highlight, createdAt: tgl(createdAt)! },
    });
    programs++;
  }

  const reservasi = await db.reservation.createMany({
    skipDuplicates: true,
    data: baca("Reservation").map((r) => ({
      ...r,
      verifiedAt: tgl(r.verifiedAt),
      createdAt: tgl(r.createdAt)!,
    })),
  });

  const email = await db.emailLog.createMany({
    skipDuplicates: true,
    data: baca("EmailLog").map((e) => ({ ...e, createdAt: tgl(e.createdAt)! })),
  });

  console.log(`SiteSetting: ${setting ? 1 : 0} | TourProgram: ${programs} | Reservation baru: ${reservasi.count} | EmailLog baru: ${email.count}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
