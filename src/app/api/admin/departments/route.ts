import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

const createSchema = z.object({
  name: z.string().trim().min(2).max(60),
});

function unauthorized() {
  return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
}

function isUniqueError(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "P2002";
}

/** Semua bagian beserta anggotanya (termasuk yang nonaktif) dan program yang memakainya. */
export async function GET(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const rows = await db.department.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        members: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        programs: {
          select: { id: true, nameId: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });
    return NextResponse.json({
      ok: true,
      departments: rows.map((d) => ({
        id: d.id,
        name: d.name,
        active: d.active,
        sortOrder: d.sortOrder,
        members: d.members.map((m) => ({
          id: m.id,
          name: m.name,
          active: m.active,
          sortOrder: m.sortOrder,
        })),
        programs: d.programs,
      })),
    });
  } catch (error) {
    console.error("[admin/departments/list] failed:", error);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}

/** Buat bagian baru. */
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "VALIDATION" }, { status: 400 });
    }
    const last = await db.department.aggregate({ _max: { sortOrder: true } });
    const created = await db.department.create({
      data: {
        name: parsed.data.name,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (error) {
    if (isUniqueError(error)) {
      return NextResponse.json({ ok: false, error: "NAMA_DIPAKAI" }, { status: 400 });
    }
    console.error("[admin/departments/create] failed:", error);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
