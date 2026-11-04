import { db } from "@/lib/db";
import { buildReservationCardPdf } from "@/lib/reservation-card-pdf";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kartu Reservasi — ATMI Campus Tour",
  robots: { index: false },
};

/**
 * Unduh / pratinjau PDF Kartu Reservasi via token rahasia dari email.
 * ?download=1 memaksa unduh; tanpa parameter dibuka langsung di browser.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const reservation = await db.reservation.findUnique({
    where: { verifyToken: token },
  });

  if (!reservation || reservation.status !== "CONFIRMED" || !reservation.verifiedAt) {
    return new Response(
      "Kartu belum tersedia — pendaftaran belum diverifikasi atau tautan tidak valid.",
      { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const pdf = await buildReservationCardPdf({
    code: reservation.code,
    name: reservation.name,
    institution: reservation.institution,
    email: reservation.email,
    phone: reservation.phone,
    programName: reservation.programName,
    participants: reservation.participants,
    date: reservation.date,
    slot: reservation.timeSlot,
    verifiedAt: reservation.verifiedAt,
  });

  const download = new URL(req.url).searchParams.get("download") === "1";
  const filename = `Kartu-Reservasi-${reservation.code}.pdf`;

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
