import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { sendMail, smtpConfigured, appBaseUrl } from "@/lib/mailer";
import { buildCardEmail } from "@/lib/email-template";
import { buildReservationCardPdf } from "@/lib/reservation-card-pdf";

/**
 * Verifikasi (setujui) satu reservasi oleh admin.
 * Setelah status menjadi CONFIRMED, kartu reservasi (PDF) otomatis
 * dikirim ke email pendaftar beserta tautan unduhnya.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const reservation = await db.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }
    if (reservation.status === "CONFIRMED") {
      return NextResponse.json({ ok: true, already: true });
    }

    const verifiedAt = new Date();
    await db.reservation.update({
      where: { id },
      data: { status: "CONFIRMED", verifiedAt },
    });

    // --- Susun PDF kartu reservasi ---
    const pdfBytes = await buildReservationCardPdf({
      code: reservation.code,
      name: reservation.name,
      institution: reservation.institution,
      email: reservation.email,
      phone: reservation.phone,
      programName: reservation.programName,
      companionName: reservation.companionName,
      participants: reservation.participants,
      date: reservation.date,
      slot: reservation.timeSlot,
      verifiedAt,
    });
    const pdfBuffer = Buffer.from(pdfBytes);

    // --- Email kartu ke pendaftar (dengan lampiran PDF) ---
    const cardUrl = `${appBaseUrl()}/kartu/${reservation.verifyToken}`;
    const html = buildCardEmail({
      name: reservation.name,
      code: reservation.code,
      programName: reservation.programName,
      companionName: reservation.companionName,
      participants: reservation.participants,
      date: reservation.date,
      slot: reservation.timeSlot,
      cardUrl,
    });
    const subject = `Kartu Reservasi Campus Tour ATMI — ${reservation.code} (Terverifikasi)`;

    const mail = smtpConfigured()
      ? await sendMail({
          to: reservation.email,
          subject,
          html,
          attachments: [
            {
              filename: `Kartu-Reservasi-${reservation.code}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        })
      : ({ status: "QUEUED", error: "SMTP belum aktif — kartu tetap bisa diunduh via tautan" } as const);

    await db.emailLog.create({
      data: {
        toEmail: reservation.email,
        subject,
        bodyHtml: html,
        status: mail.status,
        error: mail.error ?? null,
      },
    });

    return NextResponse.json({ ok: true, emailStatus: mail.status });
  } catch (error) {
    console.error("[admin/reservations/verify] failed:", error);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
