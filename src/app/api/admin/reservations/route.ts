import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** Daftar semua reservasi (terbaru dulu) — hanya untuk admin. */
export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const rows = await db.reservation.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, reservations: rows });
  } catch (error) {
    console.error("[admin/reservations] failed:", error);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
