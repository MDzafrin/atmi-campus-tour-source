"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  GraduationCap,
  Inbox,
  Loader2,
  Mail,
  MailCheck,
  Phone,
  RefreshCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReservationRow {
  id: string;
  code: string;
  tourType: string;
  programName: string;
  participants: number;
  date: string;
  timeSlot: string;
  name: string;
  institution: string;
  email: string;
  phone: string;
  notes: string | null;
  status: string;
  verifiedAt: string | null;
  createdAt: string;
}

interface EmailRow {
  id: string;
  toEmail: string;
  subject: string;
  bodyHtml: string;
  status: string;
  error: string | null;
  createdAt: string;
}

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const fmtSlot = (s: string) => `${s.replace(/\s*-\s*/, " – ")} WIB`;

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Tandai email notifikasi admin berdasarkan subjek (email pendaftar = kartu). */
function isAdminMail(subject: string): boolean {
  return (
    subject.includes("[Notifikasi Admin]") ||
    subject.includes("Menunggu Verifikasi") ||
    subject.includes("Notifikasi Admin")
  );
}

export function InboxView({ windowHours }: { windowHours: number }) {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<ReservationRow[] | null>(null);
  const [emails, setEmails] = useState<EmailRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [resRes, emRes] = await Promise.all([
        fetch("/api/admin/reservations", { cache: "no-store" }),
        fetch("/api/admin/emails", { cache: "no-store" }),
      ]);
      if (resRes.status === 401 || emRes.status === 401) {
        window.location.href = "/admin-atmi/login";
        return;
      }
      const resData = (await resRes.json()) as { reservations?: ReservationRow[] };
      const emData = (await emRes.json()) as { emails?: EmailRow[] };
      setReservations(resData.reservations ?? []);
      setEmails(emData.emails ?? []);
      setFailed(false);
    } catch {
      setFailed(true);
      setReservations((v) => v ?? []);
      setEmails((v) => v ?? []);
    }
  }, []);

  useEffect(() => {
    load();
    // Polling ringan: pendaftaran baru muncul sendiri seperti inbox sungguhan.
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  const verify = async (r: ReservationRow) => {
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/admin/reservations/${r.id}/verify`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        already?: boolean;
        emailStatus?: string;
      };
      if (res.ok && data.ok) {
        toast({
          title: data.already ? "Sudah terverifikasi" : "Pendaftaran disetujui",
          description: data.already
            ? `${r.code} sebelumnya sudah diverifikasi.`
            : `Kartu bukti pendaftaran (PDF) ${r.code} terkirim ke ${r.email} ${
                data.emailStatus === "SENT" ? "✓" : "(masuk antrean demo)"
              }`,
        });
        await load();
      } else {
        toast({
          title: "Gagal memverifikasi",
          description: "Coba lagi atau muat ulang halaman.",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Gagal memverifikasi", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const pending = (reservations ?? []).filter((r) => r.status !== "CONFIRMED");
  const verified = (reservations ?? []).filter((r) => {
    if (r.status !== "CONFIRMED") return false;
    const t = new Date(r.verifiedAt ?? r.createdAt).getTime();
    return Date.now() - t <= windowHours * 60 * 60 * 1000;
  });
  const autoHideText =
    windowHours === 48 ? "2×24 jam" : `${windowHours} jam`;

  return (
    <div className="space-y-8">
      {/* Penjelasan alur */}
      <div className="flex items-start gap-2.5 rounded-xl border border-atmi-navy/20 bg-atmi-cream p-4 text-sm text-atmi-navy">
        <MailCheck className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
        <p className="leading-relaxed">
          Pendaftar <strong>belum menerima email apa pun</strong> sebelum Anda
          memverifikasi. Klik <strong>Verifikasi</strong> untuk menyetujui
          pendaftaran — kartu bukti pendaftaran (PDF) otomatis terkirim ke email
          pendaftar. Entri terverifikasi hilang sendiri dari halaman ini setelah{" "}
          <strong>{autoHideText}</strong>.
        </p>
      </div>

      {/* ============ MENUNGGU VERIFIKASI ============ */}
      <section aria-labelledby="km-pending">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="km-pending" className="flex items-center gap-2 text-base font-extrabold text-atmi-navy">
            <Inbox className="h-4.5 w-4.5 text-atmi-red" aria-hidden="true" />
            Menunggu Verifikasi
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              {reservations === null ? "…" : pending.length}
            </span>
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            className="gap-1.5 text-xs font-semibold text-atmi-navy"
            aria-label="Muat ulang kotak masuk"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Muat Ulang
          </Button>
        </div>

        {reservations === null ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <BadgeCheck className="mx-auto h-9 w-9 text-green-600" aria-hidden="true" />
            <p className="mt-2 text-sm font-bold text-atmi-navy">
              Tidak ada pendaftaran yang menunggu
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pendaftaran baru dari website akan muncul di sini secara otomatis.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {pending.map((r) => (
              <li
                key={r.id}
                className="overflow-hidden rounded-xl border border-amber-300/70 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-amber-50/70 px-4 py-2.5 text-xs">
                  <span className="rounded-full bg-atmi-red px-2.5 py-0.5 font-bold text-white">
                    PENDAFTARAN BARU
                  </span>
                  <span className="font-mono text-[13px] font-bold text-atmi-red">
                    {r.code}
                  </span>
                  <span className="text-muted-foreground">
                    masuk {fmtDateTime(r.createdAt)}
                  </span>
                </div>
                <div className="px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.institution}
                      </p>
                    </div>
                    <Button
                      onClick={() => verify(r)}
                      disabled={busyId === r.id}
                      aria-label={`Verifikasi pendaftaran ${r.code}`}
                      className="h-9 gap-1.5 bg-atmi-navy px-4 text-xs font-bold text-white hover:bg-atmi-navy-dark"
                    >
                      {busyId === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BadgeCheck className="h-4 w-4" />
                      )}
                      Verifikasi &amp; Kirim Kartu
                    </Button>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <div>
                      <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
                        <GraduationCap className="h-3.5 w-3.5 text-atmi-red" aria-hidden="true" /> Program
                      </dt>
                      <dd className="mt-0.5 font-semibold text-foreground">
                        {r.programName || r.tourType}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
                        <CalendarDays className="h-3.5 w-3.5 text-atmi-red" aria-hidden="true" /> Tanggal
                      </dt>
                      <dd className="mt-0.5 font-semibold text-foreground">
                        {fmtDate(r.date)}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
                        <Clock className="h-3.5 w-3.5 text-atmi-red" aria-hidden="true" /> Sesi
                      </dt>
                      <dd className="mt-0.5 font-semibold text-foreground">
                        {fmtSlot(r.timeSlot)}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
                        <Users className="h-3.5 w-3.5 text-atmi-red" aria-hidden="true" /> Peserta
                      </dt>
                      <dd className="mt-0.5 font-semibold text-foreground">
                        {r.participants} orang
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                    <a
                      href={`mailto:${r.email}`}
                      className="flex items-center gap-1.5 font-semibold text-atmi-navy hover:text-atmi-red"
                    >
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {r.email}
                    </a>
                    <a
                      href={`https://wa.me/${r.phone.replace(/[^0-9]/g, "").replace(/^0/, "62")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-atmi-red"
                    >
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {r.phone}
                    </a>
                  </div>

                  <p className="mt-3 rounded-lg bg-atmi-cream px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                    Belum ada email ke pendaftar — kartu bukti pendaftaran (PDF)
                    baru dikirim otomatis setelah Anda menekan tombol Verifikasi.
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {failed ? (
          <p className="mt-2 text-xs text-amber-700">
            Gagal memuat data — coba tekan Muat Ulang.
          </p>
        ) : null}
      </section>

      {/* ============ SUDAH DIVERIFIKASI (hilang otomatis) ============ */}
      <section aria-labelledby="km-verified">
        <h2 id="km-verified" className="mb-1 flex items-center gap-2 text-base font-extrabold text-atmi-navy">
          <BadgeCheck className="h-4.5 w-4.5 text-green-600" aria-hidden="true" />
          Sudah Diverifikasi
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
            {reservations === null ? "…" : verified.length}
          </span>
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Tampil {autoHideText} setelah verifikasi, lalu hilang otomatis agar
          halaman tidak penuh.
        </p>

        {reservations !== null && verified.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-xs text-muted-foreground">
            Belum ada pendaftaran yang diverifikasi dalam {autoHideText} terakhir.
          </div>
        ) : (
          <ul className="space-y-3">
            {verified.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-green-200 bg-green-50/50 px-4 py-3"
                >
                  <span className="font-mono text-[13px] font-bold text-atmi-red">
                    {r.code}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {r.name}
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      ({r.institution})
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
                    <MailCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Kartu (PDF) terkirim ke {r.email}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    diverifikasi {fmtDateTime(r.verifiedAt ?? r.createdAt)}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* ============ ARSIP EMAIL ============ */}
      <section aria-labelledby="km-archive">
        <h2 id="km-archive" className="mb-1 flex items-center gap-2 text-base font-extrabold text-atmi-navy">
          <Mail className="h-4.5 w-4.5 text-atmi-navy" aria-hidden="true" />
          Arsip Email
          <span className="rounded-full bg-atmi-navy/10 px-2 py-0.5 text-xs font-bold text-atmi-navy">
            {emails === null ? "…" : emails.length}
          </span>
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Salinan email {autoHideText} terakhir — notifikasi admin (internal) dan
          kartu pendaftar.
        </p>

        {emails === null ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : emails.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-xs text-muted-foreground">
            Belum ada email dalam {autoHideText} terakhir.
          </div>
        ) : (
          <ul className="space-y-3">
            {emails.map((mail) => {
              const toAdmin = isAdminMail(mail.subject);
              return (
                <li
                  key={mail.id}
                  className="overflow-hidden rounded-xl border border-border bg-white shadow-sm [&_summary::-webkit-details-marker]:hidden"
                >
                  <details>
                    <summary className="cursor-pointer list-none select-none">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border bg-atmi-cream/60 px-4 py-3 text-xs">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 font-bold",
                            mail.status === "SENT"
                              ? "bg-green-100 text-green-700"
                              : mail.status === "FAILED"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700",
                          )}
                        >
                          {mail.status === "SENT"
                            ? "TERKIRIM"
                            : mail.status === "FAILED"
                              ? "GAGAL"
                              : "DEMO"}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 font-bold",
                            toAdmin
                              ? "bg-atmi-navy/10 text-atmi-navy"
                              : "bg-emerald-100 text-emerald-700",
                          )}
                        >
                          {toAdmin ? "KE ADMIN (internal)" : "KE PENDAFTAR"}
                        </span>
                        <span className="font-semibold text-atmi-navy">
                          {mail.toEmail}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(mail.createdAt).toLocaleString("id-ID")}
                        </span>
                        <span className="ml-auto font-semibold text-muted-foreground">
                          buka pratinjau ▾
                        </span>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-sm font-bold text-foreground">
                          {mail.subject}
                        </p>
                        {mail.error ? (
                          <p className="mt-1 text-xs text-amber-700">
                            Belum terkirim sungguhan — {mail.error}
                          </p>
                        ) : null}
                      </div>
                    </summary>
                    <div
                      className="max-h-[520px] overflow-y-auto border-t border-border bg-white [&_table]:max-w-full"
                      dangerouslySetInnerHTML={{ __html: mail.bodyHtml }}
                    />
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
