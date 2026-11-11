import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

const createSchema = z.object({
  departmentId: z.string().min(1).max(60),
  name: z.string().trim().min(2).max(80),
});

/** Tambah satu pendamping ke sebuah bagian. */
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "VALIDATION" }, { status: 400 });
    }
    const { departmentId, name } = parsed.data;
    const department = await db.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    const last = await db.companion.aggregate({
      where: { departmentId },
      _max: { sortOrder: true },
    });
    const created = await db.companion.create({
      data: { departmentId, name, sortOrder: (last._max.sortOrder ?? 0) + 1 },
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (error) {
    console.error("[admin/companions/create] failed:", error);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
