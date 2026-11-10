import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSettings, getActivePrograms } from "@/lib/site-config";
import { sendMail, smtpConfigured, appBaseUrl } from "@/lib/mailer";
import { buildAdminNotifyEmail } from "@/lib/email-template";

const reservationSchema = z.object({
  tourType: z.string().min(1).max(60),
  participants: z.number().int().min(1).max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.string().min(3).max(40),
  name: z.string().min(2).max(120),
  institution: z.string().min(2).max(160),
  email: z.string().email().max(160),
  phone: z.string().min(9).max(17),
  notes: z.string().max(500).nullable().optional(),
  companionId: z.string().max(60).nullable().optional(),
});

function buildCode() {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ATMI-${ymd}-${rand}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = reservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const data = parsed.data;

    // --- Validasi terhadap pengaturan dari dashboard ---
    const [settings, programs] = await Promise.all([
      getSettings(),
      getActivePrograms(),
    ]);

    const program = programs.find((p) => p.slug === data.tourType);
    if (!program) {
      return NextResponse.json(
        { ok: false, error: "PROGRAM_NOT_FOUND" },
        { status: 400 },
      );
    }

    // Pendamping (opsional) harus anggota aktif dari bagian milik program ini.
    const companion = data.companionId
      ? program.companions.find((c) => c.id === data.companionId)
      : undefined;
    if (data.companionId && !companion) {
      return NextResponse.json(
        { ok: false, error: "COMPANION_INVALID" },
        { status: 400 },
      );
    }

    const effectiveMax = program.capacityMax || settings.maxParticipants;
    if (
      data.participants < settings.minParticipants ||
      data.participants > effectiveMax
    ) {
      return NextResponse.json(
        { ok: false, error: "PARTICIPANTS_OUT_OF_RANGE" },
        { status: 400 },
      );
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (!settings.openDates.includes(data.date) || data.date < todayStr) {
      return NextResponse.json(
        { ok: false, error: "DATE_CLOSED" },
        { status: 400 },
      );
    }

    if (!settings.timeSlots.includes(data.timeSlot)) {
      return NextResponse.json(
        { ok: false, error: "SLOT_INVALID" },
        { status: 400 },
      );
    }

    // --- Simpan reservasi (status PENDING = menunggu verifikasi admin) ---
    const reservation = await db.reservation.create({
      data: {
        code: buildCode(),
        verifyToken: crypto.randomUUID(),
        tourType: data.tourType,
        programName: program.nameId,
        participants: data.participants,
        date: data.date,
        timeSlot: data.timeSlot,
        name: data.name,
        institution: data.institution,
        email: data.email,
        phone: data.phone,
        notes: data.notes ?? null,
        companionId: companion?.id ?? null,
        companionName: companion?.name ?? "",
      },
    });

    // --- Notifikasi ke ADMIN (bukan ke pendaftar) ---
    // Pendaftar baru menerima kartu SETELAH admin memverifikasi di Kotak Masuk.
    const adminEmail = process.env.ADMIN_EMAIL?.trim() || "";
    const inboxUrl = `${appBaseUrl()}/kotak-masuk`;
    const html = buildAdminNotifyEmail({
      code: reservation.code,
      name: reservation.name,
      institution: reservation.institution,
      email: reservation.email,
      phone: reservation.phone,
      programName: reservation.programName,
      participants: reservation.participants,
      date: reservation.date,
      slot: reservation.timeSlot,
      inboxUrl,
    });

    const subject = `[Notifikasi Admin] Pendaftaran Baru Menunggu Verifikasi — ${reservation.code}`;
    const mail = adminEmail
      ? await sendMail({ to: adminEmail, subject, html })
      : ({ status: "QUEUED", error: "ADMIN_EMAIL belum diisi — notifikasi hanya tampil di Kotak Masuk Demo" } as const);

    await db.emailLog.create({
      data: {
        toEmail: adminEmail || "admin@atmi (kotak masuk demo)",
        subject,
        bodyHtml: html,
        status: mail.status,
        error: mail.error ?? null,
      },
    });

    // Respon TIDAK menyertakan kode reservasi — kartu dikirim setelah verifikasi admin.
    return NextResponse.json({
      ok: true,
      email: reservation.email,
      emailMode: smtpConfigured() && adminEmail ? mail.status : "DEMO_INBOX",
    });
  } catch (error) {
    console.error("[reservations] failed:", error);
    return NextResponse.json(
      { ok: false, error: "SERVER" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const count = await db.reservation.count();
    return NextResponse.json({ ok: true, count });
  } catch {
    return NextResponse.json({ ok: false, count: 0 }, { status: 200 });
  }
}
