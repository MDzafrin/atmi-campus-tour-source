"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Clock,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Program {
  id: string;
  slug: string;
  sortOrder: number;
  active: boolean;
  highlight: boolean;
  nameId: string;
  nameEn: string;
  descId: string;
  descEn: string;
  includesId: string[];
  includesEn: string[];
  durationMin: number;
  capacityMax: number;
  imageUrl: string;
}

type EditorState = Omit<Program, "includesId" | "includesEn"> & {
  includesIdText: string;
  includesEnText: string;
};

const EMPTY: EditorState = {
  id: "",
  slug: "",
  sortOrder: 10,
  active: true,
  highlight: false,
  nameId: "",
  nameEn: "",
  descId: "",
  descEn: "",
  includesIdText: "",
  includesEnText: "",
  durationMin: 150,
  capacityMax: 30,
  imageUrl: "",
};

function toEditor(p: Program): EditorState {
  return {
    ...p,
    includesIdText: p.includesId.join("\n"),
    includesEnText: p.includesEn.join("\n"),
  };
}

function toPayload(e: EditorState) {
  return {
    slug: e.slug.trim(),
    sortOrder: Number(e.sortOrder) || 0,
    active: e.active,
    highlight: e.highlight,
    nameId: e.nameId.trim(),
    nameEn: e.nameEn.trim(),
    descId: e.descId.trim(),
    descEn: e.descEn.trim(),
    includesId: e.includesIdText,
    includesEn: e.includesEnText,
    durationMin: Number(e.durationMin),
    capacityMax: Number(e.capacityMax),
    imageUrl: e.imageUrl.trim(),
  };
}

export function ProgramsView() {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Program | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/programs", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/admin-atmi/login";
        return;
      }
      const data = (await res.json()) as { programs?: Program[] };
      setPrograms(data.programs ?? []);
    } catch {
      toast({ title: "Gagal memuat program", variant: "destructive" });
      setPrograms([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditor({ ...EMPTY });
    setIsNew(true);
  };

  const openEdit = (p: Program) => {
    setEditor(toEditor(p));
    setIsNew(false);
  };

  const saveEditor = async () => {
    if (!editor) return;
    if (editor.nameId.trim().length < 2) {
      toast({ title: "Nama program (ID) wajib diisi", variant: "destructive" });
      return;
    }
    if (editor.descId.trim().length < 2) {
      toast({ title: "Deskripsi (ID) wajib diisi", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const payload = toPayload(editor);
      const res = await fetch(
        isNew ? "/api/admin/programs" : `/api/admin/programs/${editor.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        toast({
          title: isNew ? "Program ditambahkan" : "Program diperbarui",
          description: "Perubahan tampil langsung di website.",
        });
        setEditor(null);
        await load();
      } else if (data.error === "SLUG_DIPAKAI") {
        toast({
          title: "Slug sudah dipakai program lain",
          description: "Gunakan slug berbeda, mis. student-course-2",
          variant: "destructive",
        });
      } else {
        toast({ title: "Gagal menyimpan program", variant: "destructive" });
      }
    } catch {
      toast({ title: "Gagal menyimpan program", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p: Program) => {
    try {
      const res = await fetch(`/api/admin/programs/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: p.slug,
          sortOrder: p.sortOrder,
          active: !p.active,
          highlight: p.highlight,
          nameId: p.nameId,
          nameEn: p.nameEn,
          descId: p.descId,
          descEn: p.descEn,
          includesId: p.includesId.join("\n"),
          includesEn: p.includesEn.join("\n"),
          durationMin: p.durationMin,
          capacityMax: p.capacityMax,
          imageUrl: p.imageUrl,
        }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (res.ok && data.ok) {
        toast({
          title: !p.active ? "Program diaktifkan" : "Program dinonaktifkan",
          description: !p.active
            ? `${p.nameId} tampil kembali di website.`
            : `${p.nameId} disembunyikan dari website.`,
        });
        await load();
      } else {
        toast({ title: "Gagal mengubah status program", variant: "destructive" });
      }
    } catch {
      toast({ title: "Gagal mengubah status program", variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/programs/${deleting.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        toast({ title: "Program dihapus", description: deleting.nameId });
        setDeleting(null);
        await load();
      } else if (data.error === "PROGRAM_TERAKHIR") {
        toast({
          title: "Tidak bisa dihapus",
          description:
            "Minimal harus ada satu program aktif. Nonaktifkan saja bila tidak ingin tampil.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Gagal menghapus program", variant: "destructive" });
      }
    } catch {
      toast({ title: "Gagal menghapus program", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {programs === null ? "Memuat..." : `${programs.length} program terdaftar`}
        </p>
        <Button
          onClick={openNew}
          className="bg-atmi-red font-bold text-white hover:bg-atmi-red-dark"
        >
          <Plus className="h-4 w-4" /> Tambah Program
        </Button>
      </div>

      {programs === null ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Belum ada program. Klik “Tambah Program” untuk membuat.
        </p>
      ) : (
        <ul className="space-y-4">
          {programs.map((p) => (
            <li
              key={p.id}
              className={`flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center ${
                p.active ? "border-border" : "border-dashed border-border opacity-70"
              }`}
            >
              <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-32">
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.nameId}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-muted-foreground/40" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-atmi-navy">{p.nameId}</h3>
                  {p.highlight && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-atmi-red px-2 py-0.5 text-[10px] font-bold text-white">
                      <Star className="h-3 w-3" /> Populer
                    </span>
                  )}
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      p.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {p.active ? "Aktif" : "Nonaktif"}
                  </span>
                  <span className="rounded-full bg-atmi-cream px-2 py-0.5 font-mono text-[10px] font-bold text-atmi-navy">
                    /{p.slug}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {p.descId}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-atmi-navy">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-atmi-red" /> maks {p.capacityMax} peserta
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-atmi-red" />{" "}
                    {(p.durationMin / 60).toLocaleString("id-ID", { maximumFractionDigits: 2 })} jam
                  </span>
                  <span>urutan {p.sortOrder}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="mr-1 flex items-center gap-1.5">
                  <Switch
                    checked={p.active}
                    onCheckedChange={() => toggleActive(p)}
                    aria-label={`Aktifkan/nonaktifkan ${p.nameId}`}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleting(p)}
                  aria-label={`Hapus ${p.nameId}`}
                  className="text-muted-foreground hover:bg-atmi-red/10 hover:text-atmi-red"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Dialog tambah/edit */}
      <Dialog open={!!editor} onOpenChange={(o) => !o && !busy && setEditor(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-atmi-navy">
              {isNew ? "Tambah Program Visit" : "Edit Program Visit"}
            </DialogTitle>
            <DialogDescription>
              Nama & deskripsi tersedia dalam dua bahasa (ID wajib; EN kosong =
              mengikuti ID).
            </DialogDescription>
          </DialogHeader>

          {editor && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="f-name-id" className="text-xs font-bold">Nama Program (Indonesia) *</Label>
                <Input
                  id="f-name-id"
                  value={editor.nameId}
                  onChange={(e) => setEditor({ ...editor, nameId: e.target.value })}
                  className="mt-1.5"
                  placeholder="mis. Student Course Tour"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="f-name-en" className="text-xs font-bold">Nama Program (English)</Label>
                <Input
                  id="f-name-en"
                  value={editor.nameEn}
                  onChange={(e) => setEditor({ ...editor, nameEn: e.target.value })}
                  className="mt-1.5"
                  placeholder="Kosongkan = ikuti Indonesia"
                />
              </div>

              <div>
                <Label htmlFor="f-desc-id" className="text-xs font-bold">Deskripsi (Indonesia) *</Label>
                <Textarea
                  id="f-desc-id"
                  rows={3}
                  value={editor.descId}
                  onChange={(e) => setEditor({ ...editor, descId: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="f-desc-en" className="text-xs font-bold">Deskripsi (English)</Label>
                <Textarea
                  id="f-desc-en"
                  rows={3}
                  value={editor.descEn}
                  onChange={(e) => setEditor({ ...editor, descEn: e.target.value })}
                  className="mt-1.5"
                  placeholder="Kosongkan = ikuti Indonesia"
                />
              </div>

              <div>
                <Label htmlFor="f-inc-id" className="text-xs font-bold">
                  Poin Termasuk (ID) — satu poin per baris
                </Label>
                <Textarea
                  id="f-inc-id"
                  rows={4}
                  value={editor.includesIdText}
                  onChange={(e) => setEditor({ ...editor, includesIdText: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="f-inc-en" className="text-xs font-bold">
                  Poin Termasuk (EN) — satu poin per baris
                </Label>
                <Textarea
                  id="f-inc-en"
                  rows={4}
                  value={editor.includesEnText}
                  onChange={(e) => setEditor({ ...editor, includesEnText: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                <div>
                  <Label htmlFor="f-dur" className="text-xs font-bold">Durasi (menit)</Label>
                  <Input
                    id="f-dur"
                    type="number"
                    min={30}
                    max={600}
                    step={15}
                    value={editor.durationMin}
                    onChange={(e) => setEditor({ ...editor, durationMin: Number(e.target.value) })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="f-cap" className="text-xs font-bold">Kapasitas Maks (peserta)</Label>
                  <Input
                    id="f-cap"
                    type="number"
                    min={1}
                    max={500}
                    value={editor.capacityMax}
                    onChange={(e) => setEditor({ ...editor, capacityMax: Number(e.target.value) })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="f-slug" className="text-xs font-bold">Slug (kode unik URL) *</Label>
                  <Input
                    id="f-slug"
                    value={editor.slug}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                      })
                    }
                    className="mt-1.5 font-mono"
                    placeholder="mis. student"
                  />
                </div>
                <div>
                  <Label htmlFor="f-order" className="text-xs font-bold">Urutan Tampil</Label>
                  <Input
                    id="f-order"
                    type="number"
                    min={0}
                    max={999}
                    value={editor.sortOrder}
                    onChange={(e) => setEditor({ ...editor, sortOrder: Number(e.target.value) })}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="f-img" className="text-xs font-bold">URL Foto Kartu</Label>
                <div className="mt-1.5 flex items-start gap-3">
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {editor.imageUrl ? (
                      <Image
                        src={editor.imageUrl}
                        alt="Pratinjau foto"
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <Input
                    id="f-img"
                    value={editor.imageUrl}
                    onChange={(e) => setEditor({ ...editor, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 sm:col-span-2">
                <div>
                  <p className="text-sm font-bold text-atmi-navy">Status Aktif</p>
                  <p className="text-xs text-muted-foreground">
                    Program aktif tampil di website dan bisa dipesan
                  </p>
                </div>
                <Switch
                  checked={editor.active}
                  onCheckedChange={(v) => setEditor({ ...editor, active: v })}
                  aria-label="Status aktif program"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 sm:col-span-2">
                <div>
                  <p className="text-sm font-bold text-atmi-navy">Tandai Populer</p>
                  <p className="text-xs text-muted-foreground">
                    Kartu diberi badge merah “★ Populer”
                  </p>
                </div>
                <Switch
                  checked={editor.highlight}
                  onCheckedChange={(v) => setEditor({ ...editor, highlight: v })}
                  aria-label="Tandai program populer"
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setEditor(null)} disabled={busy}>
              Batal
            </Button>
            <Button
              onClick={saveEditor}
              disabled={busy}
              className="bg-atmi-red font-bold text-white hover:bg-atmi-red-dark"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save />}
              {isNew ? "Tambah Program" : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus program ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? (
                <>
                  Program <strong>{deleting.nameId}</strong> akan dihapus permanen.
                  Riwayat reservasi lama tetap tersimpan dengan nama program saat
                  pendaftarannya dibuat.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={busy}
              className="bg-atmi-red text-white hover:bg-atmi-red-dark"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
