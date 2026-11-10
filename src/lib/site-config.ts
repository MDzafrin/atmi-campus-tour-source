import { db } from "@/lib/db";
import { IMG } from "@/lib/images";

// ============================================================
// Konfigurasi situs + seed data awal (dipakai server-side saja)
// ============================================================

export interface SiteSettings {
  minParticipants: number;
  maxParticipants: number;
  durationMinutes: number;
  timeSlots: string[];
  openDates: string[];
  updatedAt: string;
}

export interface ProgramDTO {
  id: string;
  slug: string;
  sortOrder: number;
  active: boolean;
  highlight: boolean;
  nameId: string;
  nameEn: string;
  descId: string;
  descEn: string;
  includesId: string[];
  includesEn: string[];
  durationMin: number;
  capacityMax: number;
  imageUrl: string;
  departmentId: string | null;
  /** nama bagian pendamping (kosong kalau program belum punya bagian) */
  departmentName: string;
  /** pendamping AKTIF dari bagian program ini, siap ditampilkan di form */
  companions: CompanionDTO[];
}

export interface CompanionDTO {
  id: string;
  name: string;
}

const splitLines = (s: string): string[] =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

const splitCsv = (s: string): string[] =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const DEFAULT_PROGRAMS = [
  {
    slug: "general",
    sortOrder: 1,
    highlight: false,
    nameId: "General Course Tour",
    nameEn: "General Course Tour",
    descId:
      "Perkenalan mendalam tentang Politeknik ATMI Cikarang untuk sekolah, lembaga, perusahaan, dan masyarakat umum yang ingin melihat langsung kampus vokasi berbasis industri.",
    descEn:
      "An in-depth introduction to Politeknik ATMI Cikarang for schools, institutions, companies, and the general public who want to see an industry-based vocational campus up close.",
    includesId:
      "Welcome drink & pengenalan profil ATMI\nTur Teaching Factory & workshop produksi\nDemo proses machining & mekatronika\nSesi diskusi dengan perwakilan kampus",
    includesEn:
      "Welcome drink & ATMI profile introduction\nTeaching Factory & production workshop tour\nMachining & mechatronics process demo\nDiscussion session with campus representatives",
    durationMin: 150,
    capacityMax: 30,
    imageUrl: IMG.tourGeneral,
  },
  {
    slug: "student",
    sortOrder: 2,
    highlight: true,
    nameId: "Student Course Tour",
    nameEn: "Student Course Tour",
    descId:
      "Program khusus pelajar SMK/sederajat: merasakan kuliah praktik di ATMI, mencoba trial class, dan berkonsultasi soal jalur masuk perguruan vokasi industri.",
    descEn:
      "A special program for vocational high school students: experience hands-on lectures at ATMI, join a trial class, and consult about admission to an industrial polytechnic.",
    includesId:
      "Semua rangkaian General Course Tour\nTrial class singkat bersama dosen praktisi\nKonsultasi prodi & informasi pendaftaran\nKunjungan asrama mahasiswa tahun pertama",
    includesEn:
      "All General Course Tour sessions\nShort trial class with practitioner lecturers\nStudy program consultation & admission info\nFirst-year student dormitory visit",
    durationMin: 180,
    capacityMax: 30,
    imageUrl: IMG.tourStudent,
  },
];

/**
 * Bagian pendamping awal. Dibuat SEKALI saja (saat tabel Department masih kosong),
 * lalu dihubungkan ke program yang sudah ada. Nama anggota di bawah hanya contoh,
 * ganti lewat Table Editor Supabase sampai halaman dashboard-nya jadi.
 */
const DEFAULT_DEPARTMENTS = [
  {
    name: "Marketing",
    sortOrder: 1,
    members: ["Pendamping Marketing 1", "Pendamping Marketing 2"],
    matches: (slug: string) => slug === "student",
  },
  {
    name: "Produksi",
    sortOrder: 2,
    members: ["Pendamping Produksi 1", "Pendamping Produksi 2"],
    matches: (slug: string) => slug === "general",
  },
  {
    name: "Recycle",
    sortOrder: 3,
    members: ["Pendamping Recycle 1", "Pendamping Recycle 2"],
    matches: (slug: string) => slug.includes("recycle"),
  },
];

async function seedDepartments(): Promise<void> {
  if ((await db.department.count()) > 0) return;
  const programs = await db.tourProgram.findMany({
    select: { id: true, slug: true },
  });
  for (const d of DEFAULT_DEPARTMENTS) {
    const dept = await db.department.create({
      data: {
        name: d.name,
        sortOrder: d.sortOrder,
        members: {
          create: d.members.map((name, i) => ({ name, sortOrder: i + 1 })),
        },
      },
    });
    const ids = programs.filter((p) => d.matches(p.slug)).map((p) => p.id);
    if (ids.length > 0) {
      await db.tourProgram.updateMany({
        where: { id: { in: ids }, departmentId: null },
        data: { departmentId: dept.id },
      });
    }
  }
}

/** Tanggal buka default: 30 hari kerja (Senin–Jumat) ke depan, skip Sabtu/Minggu. */
function defaultOpenDates(): string[] {
  const dates: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (dates.length < 30) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      );
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

let seeded: Promise<void> | null = null;

/** Pastikan ada 1 baris SiteSetting + minimal 2 program visit. Idempotent. */
export async function ensureSeed(): Promise<void> {
  if (!seeded) {
    seeded = (async () => {
      await db.siteSetting.upsert({
        where: { id: 1 },
        update: {},
        create: {
          id: 1,
          minParticipants: 10,
          maxParticipants: 30,
          durationMinutes: 150,
          timeSlots: "09:00-11:00,13:30-15:30",
          openDates: defaultOpenDates().join(","),
        },
      });
      const count = await db.tourProgram.count();
      if (count === 0) {
        for (const p of DEFAULT_PROGRAMS) {
          await db.tourProgram.create({ data: p });
        }
      }
      // Gagal di sini tidak boleh merobohkan situs; pilihan pendamping saja yang kosong.
      await seedDepartments().catch((e) => {
        console.error("[seed departemen] gagal:", e);
      });
    })().catch((e) => {
      seeded = null; // boleh dicoba lagi
      throw e;
    });
  }
  return seeded;
}

export async function getSettings(): Promise<SiteSettings> {
  await ensureSeed();
  const s = await db.siteSetting.findUnique({ where: { id: 1 } });
  return {
    minParticipants: s?.minParticipants ?? 10,
    maxParticipants: s?.maxParticipants ?? 30,
    durationMinutes: s?.durationMinutes ?? 150,
    timeSlots: splitCsv(s?.timeSlots ?? ""),
    openDates: splitCsv(s?.openDates ?? ""),
    updatedAt: (s?.updatedAt ?? new Date()).toISOString(),
  };
}

export function toProgramDTO(p: {
  id: string;
  slug: string;
  sortOrder: number;
  active: boolean;
  highlight: boolean;
  nameId: string;
  nameEn: string;
  descId: string;
  descEn: string;
  includesId: string;
  includesEn: string;
  durationMin: number;
  capacityMax: number;
  imageUrl: string;
  departmentId?: string | null;
  department?: {
    name: string;
    active: boolean;
    members: { id: string; name: string; active: boolean }[];
  } | null;
}): ProgramDTO {
  return {
    id: p.id,
    slug: p.slug,
    sortOrder: p.sortOrder,
    active: p.active,
    highlight: p.highlight,
    nameId: p.nameId,
    nameEn: p.nameEn,
    descId: p.descId,
    descEn: p.descEn,
    includesId: splitLines(p.includesId),
    includesEn: splitLines(p.includesEn),
    durationMin: p.durationMin,
    capacityMax: p.capacityMax,
    imageUrl: p.imageUrl,
    departmentId: p.departmentId ?? null,
    departmentName: p.department?.name ?? "",
    companions:
      p.department && p.department.active
        ? p.department.members
            .filter((m) => m.active)
            .map((m) => ({ id: m.id, name: m.name }))
        : [],
  };
}

export async function getActivePrograms(): Promise<ProgramDTO[]> {
  await ensureSeed();
  const rows = await db.tourProgram.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      department: {
        include: {
          members: {
            where: { active: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });
  return rows.map(toProgramDTO);
}
