import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminToken,
  checkPassword,
  sessionCookieOptions,
} from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { password?: string };
    if (!body.password || !checkPassword(body.password)) {
      return NextResponse.json(
        { ok: false, error: "PASSWORD_SALAH" },
        { status: 401 },
      );
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, adminToken(), sessionCookieOptions());
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
