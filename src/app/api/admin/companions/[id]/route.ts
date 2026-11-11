import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => v.name !== undefined || v.active !== undefined);

function unauthorized() {
  return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
}

/** Ganti nama atau aktif/nonaktifkan satu pendamping. */
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
    await db.companion.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/companions/update] failed:", error);
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
}

/** Hapus permanen. Reservasi lama tetap menampilkan namanya (disimpan sebagai salinan). */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const { id } = await params;
    await db.companion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/companions/delete] failed:", error);
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }
}
