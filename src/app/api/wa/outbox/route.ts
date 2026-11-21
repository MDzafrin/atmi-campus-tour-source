import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rejectUnlessWorker, WA_MAX_ATTEMPTS } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * Dipanggil wa-worker untuk mengambil pesan yang menunggu.
 * Pesan yang diambil langsung ditandai SENDING supaya tidak terkirim dua kali.
 */
export async function GET(req: Request) {
  const denied = rejectUnlessWorker(req);
  if (denied) return denied;
  try {
    const limitParam = Number(new URL(req.url).searchParams.get("limit") ?? 5);
    const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 5, 1), 10);

    // Pesan yang tersangkut di SENDING lebih dari 5 menit (worker mati di tengah jalan).
    const stuckBefore = new Date(Date.now() - 5 * 60 * 1000);
    await db.waMessage.updateMany({
      where: { status: "SENDING", updatedAt: { lt: stuckBefore }, attempts: { gte: WA_MAX_ATTEMPTS } },
      data: { status: "FAILED", error: "TIMEOUT" },
    });
    await db.waMessage.updateMany({
      where: { status: "SENDING", updatedAt: { lt: stuckBefore } },
      data: { status: "PENDING" },
    });

    const pending = await db.waMessage.findMany({
      where: { status: "PENDING", attempts: { lt: WA_MAX_ATTEMPTS } },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    const claimed: { id: string; to: string; body: string }[] = [];
    for (const m of pending) {
      const r = await db.waMessage.updateMany({
        where: { id: m.id, status: "PENDING" },
        data: { status: "SENDING", attempts: { increment: 1 } },
      });
      if (r.count === 1) claimed.push({ id: m.id, to: m.toPhone, body: m.body });
    }
    return NextResponse.json({ ok: true, messages: claimed });
  } catch (error) {
    console.error("[wa/outbox] failed:", error);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
