import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { ensureSeed, toProgramDTO } from "@/lib/site-config";

export const dynamic = "force-dynamic";

const programSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "slug hanya huruf kecil, angka, dan tanda minus"),
  sortOrder: z.number().int().min(0).max(999),
  active: z.boolean(),
  highlight: z.boolean(),
  nameId: z.string().min(2).max(120),
  nameEn: z.string().max(120),
  descId: z.string().min(2).max(600),
  descEn: z.string().max(600),
  includesId: z.string().max(1000),
  includesEn: z.string().max(1000),
  durationMin: z.number().int().min(30).max(600),
  capacityMax: z.number().int().min(1).max(500),
  imageUrl: z.string().max(500),
});

/** Semua program (termasuk nonaktif) untuk dashboard. */
export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  await ensureSeed();
  const rows = await db.tourProgram.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ ok: true, programs: rows.map(toProgramDTO) });
}

/** Tambah program baru. */
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = programSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const exists = await db.tourProgram.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (exists) {
      return NextResponse.json(
        { ok: false, error: "SLUG_DIPAKAI" },
        { status: 400 },
      );
    }
    const created = await db.tourProgram.create({
      data: { ...parsed.data, nameEn: parsed.data.nameEn || parsed.data.nameId, descEn: parsed.data.descEn || parsed.data.descId },
    });
    return NextResponse.json({ ok: true, program: toProgramDTO(created) });
  } catch (error) {
    console.error("[admin/programs] failed:", error);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
