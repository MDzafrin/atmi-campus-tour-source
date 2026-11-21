import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizePhone, type WaKind } from "@/lib/whatsapp-format";

/** Berapa kali satu pesan boleh dicoba kirim sebelum ditandai gagal. */
export const WA_MAX_ATTEMPTS = 3;

/** Pesan hanya masuk antrean kalau WA_ENABLED=true di environment. */
export function waEnabled(): boolean {
  return process.env.WA_ENABLED === "true";
}

/**
 * Masukkan pesan ke antrean. Pengiriman sebenarnya dilakukan wa-worker.
 * Tidak melempar error ke pemanggil kalau WhatsApp dimatikan.
 */
export async function queueWhatsApp(input: {
  reservationId: string;
  phone: string;
  kind: WaKind;
  body: string;
}): Promise<void> {
  if (!waEnabled()) return;
  const to = normalizePhone(input.phone);
  await db.waMessage.create({
    data: to
      ? {
          reservationId: input.reservationId,
          toPhone: to,
          kind: input.kind,
          body: input.body,
          status: "PENDING",
        }
      : {
          reservationId: input.reservationId,
          toPhone: input.phone.slice(0, 30),
          kind: input.kind,
          body: input.body,
          status: "FAILED",
          error: "NOMOR_TIDAK_VALID",
        },
  });
}

const sha = (s: string) => crypto.createHash("sha256").update(s).digest();

/**
 * Cek kunci rahasia dari wa-worker (header x-wa-secret).
 * Mengembalikan response error kalau tidak sah, atau null kalau boleh lanjut.
 */
export function rejectUnlessWorker(req: Request): NextResponse | null {
  const secret = process.env.WA_WORKER_SECRET ?? "";
  if (secret.length < 16) {
    return NextResponse.json({ ok: false, error: "WA_NOT_CONFIGURED" }, { status: 503 });
  }
  const got = req.headers.get("x-wa-secret") ?? "";
  if (!crypto.timingSafeEqual(sha(got), sha(secret))) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  return null;
}
