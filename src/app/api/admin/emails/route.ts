import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * Arsip email untuk halaman Kotak Masuk (khusus admin).
 * Hanya menampilkan email dalam jangka waktu tampil (default 2x24 jam)
 * supaya halaman tidak menumpuk.
 */
export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const hours = Number(process.env.KOTAK_MASUK_TAMPIL_JAM || 48);
    const windowMs = (Number.isFinite(hours) && hours > 0 ? hours : 48) * 60 * 60 * 1000;
    const since = new Date(Date.now() - windowMs);

    const rows = await db.emailLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({ ok: true, emails: rows });
  } catch (error) {
    console.error("[admin/emails] failed:", error);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
