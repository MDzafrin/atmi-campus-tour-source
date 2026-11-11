import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.active !== undefined);

function unauthorized() {
  return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
}

function isUniqueError(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "P2002";
}

/** Ganti nama atau aktif/nonaktifkan satu bagian. */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const { id } = await params;
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "VALIDATION" }, { status: 400 });
    }
    await db.department.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isUniqueError(error)) {
      return NextResponse.json({ ok: false, error: "NAMA_DIPAKAI" }, { status: 400 });
    }
    console.error("[admin/departments/update] failed:", error);
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
}

/**
 * Hapus bagian beserta seluruh anggotanya. Program yang memakainya tidak ikut terhapus,
 * hanya kehilangan pilihan pendamping. Bagian terakhir tidak boleh dihapus.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const { id } = await params;
    const target = await db.department.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    if ((await db.department.count()) <= 1) {
      return NextResponse.json({ ok: false, error: "BAGIAN_TERAKHIR" }, { status: 400 });
    }
    await db.department.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/departments/delete] failed:", error);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
