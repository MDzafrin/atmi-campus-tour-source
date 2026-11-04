import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminServer } from "@/lib/admin-auth";
import { ArrowLeft, Inbox } from "lucide-react";
import { InboxView } from "@/components/admin/inbox-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kotak Masuk (Admin) — ATMI Campus Tour",
  robots: { index: false },
};

/** Jangka waktu entri tampil di halaman ini (jam). Default 48 = 2x24 jam. */
function displayWindowHours(): number {
  const h = Number(process.env.KOTAK_MASUK_TAMPIL_JAM || 48);
  return Number.isFinite(h) && h > 0 ? h : 48;
}

export default async function KotakMasukPage() {
  // Halaman internal — hanya admin yang boleh masuk.
  const admin = await isAdminServer();
  if (!admin) redirect("/admin-atmi/login");

  return (
    <main className="min-h-screen bg-atmi-sand/50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin-atmi"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-atmi-navy hover:text-atmi-red"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard Admin
        </Link>

        <div className="mt-4 mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-atmi-navy/10">
            <Inbox className="h-6 w-6 text-atmi-navy" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-atmi-navy">Kotak Masuk</h1>
            <p className="text-xs text-muted-foreground">
              Verifikasi pendaftaran &amp; arsip email — halaman internal admin
            </p>
          </div>
        </div>

        <InboxView windowHours={displayWindowHours()} />
      </div>
    </main>
  );
}
