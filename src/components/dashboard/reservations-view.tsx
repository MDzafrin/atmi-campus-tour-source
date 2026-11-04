"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  Inbox,
  Loader2,
  Mail,
  MailCheck,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
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

export function ReservationsView() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ReservationRow[] | null>(null);
  const [error, setError] = useState(false);
  const [programFilter, setProgramFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<ReservationRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/admin/reservations", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/admin-atmi/login";
        return;
      }
      const data = (await res.json()) as { reservations?: ReservationRow[] };
      setRows(data.reservations ?? []);
    } catch {
      setError(true);
      setRows([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const programOptions = useMemo(() => {
    const names = new Set<string>();
    (rows ?? []).forEach((r) => {
      if (r.programName) names.add(r.programName);
      else names.add(r.tourType);
    });
    return [...names].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows ?? [];
    if (programFilter !== "all") {
      list = list.filter(
        (r) => (r.programName || r.tourType) === programFilter,
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.code, r.name, r.institution, r.email, r.phone]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return list;
  }, [rows, programFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const list = rows ?? [];
    return {
      total: list.length,
      pending: list.filter((r) => r.status === "PENDING").length,
      confirmed: list.filter((r) => r.status === "CONFIRMED").length,
      participants: list
        .filter((r) => r.status === "CONFIRMED")
        .reduce((acc, r) => acc + r.participants, 0),
    };
  }, [rows]);

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/admin/reservations/${deleting.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({
          title: "Reservasi dihapus",
          description: `${deleting.code} — ${deleting.name} telah dihapus permanen.`,
        });
        setDeleting(null);
        await load();
      } else {
        toast({
          title: "Gagal menghapus",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Gagal menghapus", variant: "destructive" });
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistik */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Reservasi", value: stats.total, icon: Inbox },
          { label: "Menunggu Verifikasi", value: stats.pending, icon: Mail },
          { label: "Terverifikasi", value: stats.confirmed, icon: Users },
          { label: "Peserta Terkonfirmasi", value: stats.participants, icon: CalendarDays },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <s.icon className="h-4 w-4 text-atmi-red" aria-hidden="true" />
              {s.label}
            </div>
            <p className="mt-1.5 text-2xl font-extrabold text-atmi-navy">
              {rows === null ? "—" : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter + pencarian */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode reservasi, nama, institusi, email, no. HP..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-full md:w-52" aria-label="Filter program">
              <SelectValue placeholder="Semua Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Program</SelectItem>
              {programOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48" aria-label="Filter status">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="PENDING">Menunggu Verifikasi</SelectItem>
              <SelectItem value="CONFIRMED">Terverifikasi</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={load}
            aria-label="Muat ulang data"
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {rows === null ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Inbox className="mx-auto h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-atmi-navy">
              {error ? "Gagal memuat data" : "Tidak ada reservasi"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {error
                ? "Coba klik tombol muat ulang."
                : "Pendaftar baru akan muncul di sini setelah mengisi formulir di website."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-atmi-cream/60 text-[11px] font-bold tracking-wider text-atmi-navy uppercase">
                  <th className="px-4 py-3">Kode Reservasi</th>
                  <th className="px-4 py-3">Pemohon</th>
                  <th className="px-4 py-3">Kontak</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Jadwal</th>
                  <th className="px-4 py-3 text-center">Peserta</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/60 align-top last:border-0 hover:bg-atmi-sand/30"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-[13px] font-bold whitespace-nowrap text-atmi-red">
                        {r.code}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        daftar {fmtDateTime(r.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-foreground">{r.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {r.institution}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <a
                        href={`mailto:${r.email}`}
                        className="flex items-center gap-1.5 font-semibold break-all text-atmi-navy hover:text-atmi-red"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {r.email}
                      </a>
                      <a
                        href={`https://wa.me/${r.phone.replace(/[^0-9]/g, "").replace(/^0/, "62")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center gap-1.5 text-muted-foreground hover:text-atmi-red"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {r.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-foreground">
                      {r.programName || r.tourType}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-foreground">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-atmi-red" aria-hidden="true" />
                        {fmtDate(r.date)}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {fmtSlot(r.timeSlot)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-foreground">
                      {r.participants}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap",
                          r.status === "CONFIRMED"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {r.status === "CONFIRMED" ? "Terverifikasi" : "Menunggu Verifikasi"}
                      </span>
                      {r.status === "CONFIRMED" ? (
                        <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-green-700">
                          <MailCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
                          Kartu (PDF) terkirim ke email pendaftar
                        </span>
                      ) : (
                        <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-atmi-navy">
                          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                          <a
                            href="/kotak-masuk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-dotted underline-offset-2 hover:text-atmi-red"
                          >
                            Verifikasi di Kotak Masuk
                          </a>
                        </span>
                      )}
                      {r.notes ? (
                        <span className="mt-1 block max-w-36 text-[11px] text-muted-foreground italic">
                          “{r.notes}”
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(r)}
                          aria-label={`Hapus reservasi ${r.code}`}
                          className="text-muted-foreground hover:bg-atmi-red/10 hover:text-atmi-red"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Konfirmasi hapus permanen */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus reservasi ini secara permanen?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? (
                <>
                  Reservasi <strong className="font-mono">{deleting.code}</strong> atas nama{" "}
                  <strong>{deleting.name}</strong> ({deleting.institution}) akan dihapus
                  permanen dari database. Tindakan ini tidak bisa dibatalkan — gunakan
                  bila pihak pendaftar membatalkan kunjungan.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteBusy}
              className="bg-atmi-red text-white hover:bg-atmi-red-dark"
            >
              {deleteBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" /> Ya, Hapus Permanen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
