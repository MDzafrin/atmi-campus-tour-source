import { createHash } from "crypto";
import { cookies } from "next/headers";

// ============================================================
// Auth dashboard admin — password tunggal via cookie httpOnly.
// Password diatur di .env: ADMIN_PASSWORD (default: atmi2026)
// ============================================================

export const ADMIN_COOKIE = "atmi_admin_session";
const SALT = "atmi-campus-tour-dashboard-v1";

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "atmi2026";
}

/** Token sesi = hash(password + salt). Berubah otomatis kalau password diganti. */
export function adminToken(): string {
  return createHash("sha256").update(adminPassword() + SALT).digest("hex");
}

export function checkPassword(input: string): boolean {
  return input === adminPassword();
}

/** Cek dari Route Handler (Request) */
export function isAdminRequest(req: Request): boolean {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_COOKIE}=`));
  return match?.slice(ADMIN_COOKIE.length + 1) === adminToken();
}

/** Cek dari Server Component / halaman */
export async function isAdminServer(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === adminToken();
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 8, // sesi 8 jam
  };
}
