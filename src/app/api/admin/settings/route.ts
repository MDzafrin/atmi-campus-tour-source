import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSettings } from "@/lib/site-config";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  minParticipants: z.number().int().min(1).max(200),
  maxParticipants: z.number().int().min(1).max(500),
  durationMinutes: z.number().int().min(30).max(600),
  timeSlots: z
    .array(z.string().regex(/^\d{1,2}[:.]\d{2}\s*-\s*\d{1,2}[:.]\d{2}$/))
    .min(1)
    .max(8),
  openDates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .max(400),
});

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const settings = await getSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function PUT(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const d = parsed.data;
    if (d.minParticipants > d.maxParticipants) {
      return NextResponse.json(
        { ok: false, error: "MIN_LEBIH_BESAR" },
        { status: 400 },
      );
    }
    // Normalisasi slot: "9:00-11:00" -> "09:00-11:00"
    const norm = (s: string) =>
      s
        .replace(/\./g, ":")
        .replace(/\s/g, "")
        .split("-")
        .map((t) => {
          const [h, m] = t.split(":");
          return `${String(Number(h)).padStart(2, "0")}:${m}`;
        })
        .join("-");

    const timeSlots = [...new Set(d.timeSlots.map(norm))];
    const openDates = [...new Set(d.openDates)].sort();

    await db.siteSetting.upsert({
      where: { id: 1 },
      update: {
        minParticipants: d.minParticipants,
        maxParticipants: d.maxParticipants,
        durationMinutes: d.durationMinutes,
        timeSlots: timeSlots.join(","),
        openDates: openDates.join(","),
      },
      create: {
        id: 1,
        minParticipants: d.minParticipants,
        maxParticipants: d.maxParticipants,
        durationMinutes: d.durationMinutes,
        timeSlots: timeSlots.join(","),
        openDates: openDates.join(","),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/settings] failed:", error);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
