import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rejectUnlessWorker, WA_MAX_ATTEMPTS } from "@/lib/whatsapp";

const bodySchema = z.object({
  status: z.enum(["SENT", "FAILED"]),
  error: z.string().max(300).optional(),
  retry: z.boolean().optional(),
});

/** wa-worker melaporkan hasil kirim satu pesan. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = rejectUnlessWorker(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "VALIDATION" }, { status: 400 });
    }
    const msg = await db.waMessage.findUnique({ where: { id } });
    if (!msg) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    const { status, error, retry } = parsed.data;
    if (status === "SENT") {
      await db.waMessage.update({
        where: { id },
        data: { status: "SENT", sentAt: new Date(), error: null },
      });
    } else {
      const again = retry === true && msg.attempts < WA_MAX_ATTEMPTS;
      await db.waMessage.update({
        where: { id },
        data: { status: again ? "PENDING" : "FAILED", error: error ?? null },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[wa/outbox/report] failed:", error);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
