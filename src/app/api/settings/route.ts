import { NextResponse } from "next/server";
import { getSettings, getActivePrograms } from "@/lib/site-config";

export const dynamic = "force-dynamic";

/** Endpoint publik: pengaturan formulir + daftar program aktif. */
export async function GET() {
  try {
    const [settings, programs] = await Promise.all([
      getSettings(),
      getActivePrograms(),
    ]);
    return NextResponse.json({ ok: true, settings, programs });
  } catch (error) {
    console.error("[settings] failed:", error);
    return NextResponse.json(
      { ok: false, error: "SERVER" },
      { status: 500 },
    );
  }
}
