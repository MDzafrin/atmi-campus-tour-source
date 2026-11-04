import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { toProgramDTO } from "@/lib/site-config";

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

/** Update satu program. */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = programSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const slugTaken = await db.tourProgram.findFirst({
      where: { slug: parsed.data.slug, NOT: { id } },
    });
    if (slugTaken) {
      return NextResponse.json(
        { ok: false, error: "SLUG_DIPAKAI" },
        { status: 400 },
      );
    }
    const updated = await db.tourProgram.update({
      where: { id },
      data: { ...parsed.data, nameEn: parsed.data.nameEn || parsed.data.nameId, descEn: parsed.data.descEn || parsed.data.descId },
    });
    return NextResponse.json({ ok: true, program: toProgramDTO(updated) });
  } catch (error) {
    console.error("[admin/programs/update] failed:", error);
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
}

/** Hapus permanen program (tidak boleh kalau masih program terakhir yang aktif). */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const activeCount = await db.tourProgram.count({ where: { active: true } });
    const target = await db.tourProgram.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    if (target.active && activeCount <= 1) {
      return NextResponse.json(
        { ok: false, error: "PROGRAM_TERAKHIR" },
        { status: 400 },
      );
    }
    await db.tourProgram.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/programs/delete] failed:", error);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
