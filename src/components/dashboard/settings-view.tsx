"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CalendarDays,
  Clock,
  Loader2,
  Plus,
  Save,
  Timer,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface SettingsState {
  minParticipants: number;
  maxParticipants: number;
  durationMinutes: number;
  timeSlots: string[];
  openDates: string[];
}

const SLOT_RE = /^\d{1,2}[:.]\d{2}\s*-\s*\d{1,2}[:.]\d{2}$/;

function parseYMD(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function SettingsView() {
  const { toast } = useToast();
  const [s, setS] = useState<SettingsState | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setS({
            minParticipants: data.settings.minParticipants,
            maxParticipants: data.settings.maxParticipants,
            durationMinutes: data.settings.durationMinutes,
            timeSlots: data.settings.timeSlots,
            openDates: data.settings.openDates,
          });
        }
      })
      .catch(() =>
        toast({ title: "Gagal memuat pengaturan", variant: "destructive" }),
      );
  }, []);

  const save = async (section: string) => {
    if (!s) return;
    setSaving(section);

    // Validasi ringan sebelum kirim
    if (s.minParticipants < 1 || s.maxParticipants < 1) {
      toast({ title: "Jumlah peserta harus minimal 1", variant: "destructive" });
      setSaving(null);
      return;
    }
    if (s.minParticipants > s.maxParticipants) {
      toast({
        title: "Minimal peserta tidak boleh lebih besar dari maksimal",
        variant: "destructive",
      });
      setSaving(null);
      return;
    }
    if (s.timeSlots.length === 0) {
      toast({ title: "Minimal harus ada satu sesi waktu", variant: "destructive" });
      setSaving(null);
      return;
    }
    const badSlot = s.timeSlots.find((t) => !SLOT_RE.test(t.trim()));
    if (badSlot) {
      toast({
        title: "Format sesi tidak valid",
        description: `"${badSlot}" — gunakan format HH:MM-HH:MM, contoh: 09:00-11:00`,
        variant: "destructive",
      });
      setSaving(null);
      return;
    }

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minParticipants: Number(s.minParticipants),
          maxParticipants: Number(s.maxParticipants),
          durationMinutes: Number(s.durationMinutes),
          timeSlots: s.timeSlots,
          openDates: s.openDates,
        }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (res.ok && data.ok) {
        toast({ title: "Pengaturan disimpan", description: "Formulir reservasi di website langsung mengikuti pengaturan baru." });
      } else {
        toast({ title: "Gagal menyimpan pengaturan", variant: "destructive" });
      }
    } catch {
      toast({ title: "Gagal menyimpan pengaturan", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  if (!s) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const hours = s.durationMinutes / 60;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* 1. Jumlah peserta */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <header className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-atmi-navy/10">
            <Users className="h-4.5 w-4.5 text-atmi-navy" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-atmi-navy">Jumlah Peserta</h2>
            <p className="text-xs text-muted-foreground">
              Batas minimal & maksimal peserta per pendaftaran
            </p>
          </div>
        </header>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="minP" className="text-xs font-bold">Minimal</Label>
            <Input
              id="minP"
              type="number"
              min={1}
              value={s.minParticipants}
              onChange={(e) =>
                setS({ ...s, minParticipants: Number(e.target.value) })
              }
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="maxP" className="text-xs font-bold">Maksimal</Label>
            <Input
              id="maxP"
              type="number"
              min={1}
              value={s.maxParticipants}
              onChange={(e) =>
                setS({ ...s, maxParticipants: Number(e.target.value) })
              }
              className="mt-1.5"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Catatan: kapasitas per program di halaman Program Visit bisa
          membatasi angka maksimal ini lebih jauh.
        </p>
        <Button
          onClick={() => save("peserta")}
          disabled={saving !== null}
          className="mt-4 bg-atmi-navy font-bold text-white hover:bg-atmi-navy-dark"
        >
          {saving === "peserta" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Simpan Jumlah Peserta
        </Button>
      </section>

      {/* 2. Durasi visit */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <header className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-atmi-navy/10">
            <Timer className="h-4.5 w-4.5 text-atmi-navy" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-atmi-navy">Durasi Visit</h2>
            <p className="text-xs text-muted-foreground">
              Durasi standar kunjungan (dipakai default program baru)
            </p>
          </div>
        </header>
        <div className="mt-4 max-w-40">
          <Label htmlFor="durasi" className="text-xs font-bold">Durasi (menit)</Label>
          <Input
            id="durasi"
            type="number"
            min={30}
            max={600}
            step={15}
            value={s.durationMinutes}
            onChange={(e) =>
              setS({ ...s, durationMinutes: Number(e.target.value) })
            }
            className="mt-1.5"
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Setara <strong className="text-atmi-navy">{hours.toLocaleString("id-ID", { maximumFractionDigits: 2 })} jam</strong>{" "}
          per kunjungan. Durasi tiap program bisa dibedakan di halaman Program Visit.
        </p>
        <Button
          onClick={() => save("durasi")}
          disabled={saving !== null}
          className="mt-4 bg-atmi-navy font-bold text-white hover:bg-atmi-navy-dark"
        >
          {saving === "durasi" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Simpan Durasi
        </Button>
      </section>

      {/* 3. Sesi waktu */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <header className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-atmi-navy/10">
            <Clock className="h-4.5 w-4.5 text-atmi-navy" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-atmi-navy">Sesi Waktu</h2>
            <p className="text-xs text-muted-foreground">
              Pilihan jam kunjungan di formulir — format HH:MM-HH:MM
            </p>
          </div>
        </header>
        <ul className="mt-4 space-y-2">
          {s.timeSlots.map((slot, i) => (
            <li key={i} className="flex items-center gap-2">
              <Input
                value={slot}
                onChange={(e) => {
                  const next = [...s.timeSlots];
                  next[i] = e.target.value;
                  setS({ ...s, timeSlots: next });
                }}
                placeholder="09:00-11:00"
                aria-label={`Sesi waktu ${i + 1}`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setS({
                    ...s,
                    timeSlots: s.timeSlots.filter((_, idx) => idx !== i),
                  })
                }
                disabled={s.timeSlots.length <= 1}
                aria-label={`Hapus sesi ${slot}`}
                className="shrink-0 text-muted-foreground hover:text-atmi-red"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setS({ ...s, timeSlots: [...s.timeSlots, ""] })}
          className="mt-3 font-semibold text-atmi-navy"
        >
          <Plus className="h-4 w-4" /> Tambah Sesi
        </Button>
        <Button
          onClick={() => save("sesi")}
          disabled={saving !== null}
          className="mt-4 ml-2 bg-atmi-navy font-bold text-white hover:bg-atmi-navy-dark"
        >
          {saving === "sesi" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Simpan Sesi
        </Button>
      </section>

      {/* 4. Tanggal buka */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <header className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-atmi-navy/10">
            <CalendarDays className="h-4.5 w-4.5 text-atmi-navy" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-atmi-navy">
              Tanggal Visit yang Dibuka
            </h2>
            <p className="text-xs text-muted-foreground">
              Klik tanggal di kalender untuk membuka/menutup — pendaftar hanya
              bisa memilih tanggal yang dibuka di sini
            </p>
          </div>
        </header>

        <div className="mt-4 flex flex-col gap-4 md:flex-row">
          <div className="rounded-lg border border-border p-2">
            <Calendar
              mode="multiple"
              locale={idLocale}
              selected={s.openDates.map(parseYMD)}
              onSelect={(dates) =>
                setS({
                  ...s,
                  openDates: (dates ?? [])
                    .map((d) => format(d, "yyyy-MM-dd"))
                    .sort(),
                })
              }
              className="max-h-80 overflow-y-auto"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-atmi-navy">
              Terbuka: {s.openDates.length} tanggal
            </p>
            {s.openDates.length === 0 ? (
              <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                Belum ada tanggal dibuka — formulir reservasi tidak bisa
                dipakai pendaftar sampai Anda memilih tanggal.
              </p>
            ) : (
              <ul className="mt-2 flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
                {s.openDates.map((d) => (
                  <li
                    key={d}
                    className="inline-flex items-center gap-1 rounded-full border border-atmi-navy/20 bg-atmi-cream px-2.5 py-1 text-[11px] font-semibold text-atmi-navy"
                  >
                    {format(parseYMD(d), "d MMM yyyy", { locale: idLocale })}
                    <button
                      type="button"
                      onClick={() =>
                        setS({
                          ...s,
                          openDates: s.openDates.filter((x) => x !== d),
                        })
                      }
                      aria-label={`Tutup tanggal ${d}`}
                      className="text-muted-foreground hover:text-atmi-red"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              onClick={() => save("tanggal")}
              disabled={saving !== null}
              className="mt-4 bg-atmi-navy font-bold text-white hover:bg-atmi-navy-dark"
            >
              {saving === "tanggal" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan Tanggal
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
