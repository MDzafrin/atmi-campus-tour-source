"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Member {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
}

interface Department {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
  members: Member[];
  programs: { id: string; nameId: string }[];
}

type DeptDialog = { mode: "new" } | { mode: "edit"; dept: Department };

const ERROR_TEXT: Record<string, string> = {
  NAMA_DIPAKAI: "Nama itu sudah dipakai bagian lain.",
  VALIDATION: "Nama minimal 2 huruf.",
  BAGIAN_TERAKHIR: "Minimal harus ada satu bagian. Nonaktifkan saja kalau tidak dipakai.",
  NOT_FOUND: "Data tidak ditemukan. Muat ulang halaman.",
};

/** Panggil API admin. Mengembalikan null kalau sesi habis (otomatis diarahkan ke login). */
async function call(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<{ ok: boolean; error?: string } | null> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    window.location.href = "/admin-atmi/login";
    return null;
  }
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  return { ok: res.ok && data.ok !== false, error: data.error };
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
        active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
      }`}
    >
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

export function CompanionsView() {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[] | null>(null);
  const [busy, setBusy] = useState(false);

  const [deptDialog, setDeptDialog] = useState<DeptDialog | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [deletingMember, setDeletingMember] = useState<{ member: Member; dept: Department } | null>(
    null,
  );

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/departments", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/admin-atmi/login";
        return;
      }
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        departments?: Department[];
      } | null;
      if (!res.ok || !data || data.ok === false) {
        const detail = !data
          ? "respons bukan JSON, cek terminal server"
          : (data.error ?? "tanpa keterangan");
        toast({
          title: "Gagal memuat data pendamping",
          description: `Status ${res.status}: ${detail}`,
          variant: "destructive",
        });
        setDepartments([]);
        return;
      }
      setDepartments(data.departments ?? []);
    } catch {
      toast({
        title: "Gagal memuat data pendamping",
        description: "Tidak bisa terhubung ke server.",
        variant: "destructive",
      });
      setDepartments([]);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  /** Jalankan satu perubahan, tampilkan pesan, lalu muat ulang daftar. */
  const run = async (
    action: () => Promise<{ ok: boolean; error?: string } | null>,
    successTitle?: string,
  ): Promise<boolean> => {
    setBusy(true);
    try {
      const result = await action();
      if (!result) return false;
      if (!result.ok) {
        toast({
          title: ERROR_TEXT[result.error ?? ""] ?? "Gagal menyimpan. Coba lagi.",
          variant: "destructive",
        });
        return false;
      }
      if (successTitle) toast({ title: successTitle });
      await load();
      return true;
    } catch {
      toast({ title: "Gagal terhubung ke server", variant: "destructive" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  // ---------- Bagian ----------
  const openNewDept = () => {
    setDeptName("");
    setDeptDialog({ mode: "new" });
  };

  const openEditDept = (dept: Department) => {
    setDeptName(dept.name);
    setDeptDialog({ mode: "edit", dept });
  };

  const saveDept = async () => {
    if (!deptDialog) return;
    const name = deptName.trim();
    if (name.length < 2) {
      toast({ title: ERROR_TEXT.VALIDATION, variant: "destructive" });
      return;
    }
    const ok = await run(
      () =>
        deptDialog.mode === "new"
          ? call("/api/admin/departments", "POST", { name })
          : call(`/api/admin/departments/${deptDialog.dept.id}`, "PUT", { name }),
      deptDialog.mode === "new" ? "Bagian ditambahkan" : "Nama bagian diperbarui",
    );
    if (ok) setDeptDialog(null);
  };

  const toggleDept = (dept: Department) =>
    run(() => call(`/api/admin/departments/${dept.id}`, "PUT", { active: !dept.active }));

  const confirmDeleteDept = async () => {
    if (!deletingDept) return;
    const ok = await run(
      () => call(`/api/admin/departments/${deletingDept.id}`, "DELETE"),
      "Bagian dihapus",
    );
    if (ok) setDeletingDept(null);
  };

  // ---------- Anggota ----------
  const addMember = async (dept: Department) => {
    const name = (drafts[dept.id] ?? "").trim();
    if (name.length < 2) {
      toast({ title: "Nama pendamping minimal 2 huruf", variant: "destructive" });
      return;
    }
    const ok = await run(
      () => call("/api/admin/companions", "POST", { departmentId: dept.id, name }),
      "Pendamping ditambahkan",
    );
    if (ok) setDrafts((d) => ({ ...d, [dept.id]: "" }));
  };

  const saveMemberName = async () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (name.length < 2) {
      toast({ title: "Nama pendamping minimal 2 huruf", variant: "destructive" });
      return;
    }
    const ok = await run(
      () => call(`/api/admin/companions/${editing.id}`, "PUT", { name }),
      "Nama diperbarui",
    );
    if (ok) setEditing(null);
  };

  const toggleMember = (m: Member) =>
    run(() => call(`/api/admin/companions/${m.id}`, "PUT", { active: !m.active }));

  const confirmDeleteMember = async () => {
    if (!deletingMember) return;
    const ok = await run(
      () => call(`/api/admin/companions/${deletingMember.member.id}`, "DELETE"),
      "Pendamping dihapus",
    );
    if (ok) setDeletingMember(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {departments === null ? "Memuat..." : `${departments.length} bagian terdaftar`}
        </p>
        <Button
          onClick={openNewDept}
          className="bg-atmi-red font-bold text-white hover:bg-atmi-red-dark"
        >
          <Plus className="h-4 w-4" /> Tambah Bagian
        </Button>
      </div>

      {departments === null ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Belum ada bagian. Klik “Tambah Bagian” untuk membuat.
        </p>
      ) : (
        <ul className="space-y-5">
          {departments.map((d) => {
            const activeCount = d.members.filter((m) => m.active).length;
            return (
              <li
                key={d.id}
                className={`rounded-xl border bg-card shadow-sm ${
                  d.active ? "border-border" : "border-dashed border-border"
                }`}
              >
                {/* Kepala bagian */}
                <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-atmi-navy/5 text-atmi-navy">
                    <Building2 className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-atmi-navy">{d.name}</h3>
                      <StatusBadge active={d.active} />
                      <span className="text-[11px] text-muted-foreground">
                        {activeCount} dari {d.members.length} pendamping aktif
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {d.programs.length > 0
                        ? `Mendampingi: ${d.programs.map((p) => p.nameId).join(", ")}`
                        : "Belum dipakai program mana pun"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch
                      checked={d.active}
                      onCheckedChange={() => toggleDept(d)}
                      disabled={busy}
                      aria-label={`Aktifkan atau nonaktifkan bagian ${d.name}`}
                    />
                    <Button variant="outline" size="sm" onClick={() => openEditDept(d)}>
                      <Pencil className="h-3.5 w-3.5" /> Ganti Nama
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingDept(d)}
                      aria-label={`Hapus bagian ${d.name}`}
                      className="text-muted-foreground hover:bg-atmi-red/10 hover:text-atmi-red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Anggota */}
                {d.members.length === 0 ? (
                  <p className="px-4 py-5 text-center text-sm text-muted-foreground">
                    Belum ada pendamping di bagian ini.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {d.members.map((m) => (
                      <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                        {editing?.id === m.id ? (
                          <>
                            <Input
                              autoFocus
                              value={editing.name}
                              maxLength={80}
                              onChange={(e) => setEditing({ id: m.id, name: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveMemberName();
                                if (e.key === "Escape") setEditing(null);
                              }}
                              className="h-9 flex-1"
                              aria-label="Nama pendamping"
                            />
                            <Button
                              size="icon"
                              onClick={saveMemberName}
                              disabled={busy}
                              aria-label="Simpan nama"
                              className="bg-atmi-navy text-white hover:bg-atmi-navy-dark"
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditing(null)}
                              aria-label="Batal"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span
                              className={`min-w-0 flex-1 truncate text-sm font-semibold ${
                                m.active ? "text-foreground" : "text-muted-foreground line-through"
                              }`}
                            >
                              {m.name}
                            </span>
                            <StatusBadge active={m.active} />
                            <Switch
                              checked={m.active}
                              onCheckedChange={() => toggleMember(m)}
                              disabled={busy}
                              aria-label={`Aktifkan atau nonaktifkan ${m.name}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditing({ id: m.id, name: m.name })}
                              aria-label={`Ganti nama ${m.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingMember({ member: m, dept: d })}
                              aria-label={`Hapus ${m.name}`}
                              className="text-muted-foreground hover:bg-atmi-red/10 hover:text-atmi-red"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Tambah anggota */}
                <div className="flex items-center gap-2 border-t border-border bg-atmi-sand/30 p-3">
                  <Input
                    value={drafts[d.id] ?? ""}
                    maxLength={80}
                    onChange={(e) => setDrafts((x) => ({ ...x, [d.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addMember(d);
                    }}
                    placeholder={`Nama pendamping baru untuk ${d.name}`}
                    className="h-9 flex-1 bg-white"
                    aria-label={`Nama pendamping baru untuk ${d.name}`}
                  />
                  <Button
                    onClick={() => addMember(d)}
                    disabled={busy}
                    className="bg-atmi-navy font-bold text-white hover:bg-atmi-navy-dark"
                  >
                    <Plus className="h-4 w-4" /> Tambah
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Dialog tambah / ganti nama bagian */}
      <Dialog open={!!deptDialog} onOpenChange={(o) => !o && !busy && setDeptDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deptDialog?.mode === "edit" ? "Ganti Nama Bagian" : "Tambah Bagian"}
            </DialogTitle>
            <DialogDescription>
              Contoh: Marketing, Produksi, Recycle. Anggotanya bisa ditambahkan setelah bagian dibuat.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="dept-name" className="text-sm font-bold text-atmi-navy">
              Nama Bagian
            </Label>
            <Input
              id="dept-name"
              autoFocus
              value={deptName}
              maxLength={60}
              onChange={(e) => setDeptName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveDept();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptDialog(null)} disabled={busy}>
              Batal
            </Button>
            <Button
              onClick={saveDept}
              disabled={busy}
              className="bg-atmi-red font-bold text-white hover:bg-atmi-red-dark"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus bagian */}
      <AlertDialog open={!!deletingDept} onOpenChange={(o) => !o && setDeletingDept(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus bagian ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingDept ? (
                <>
                  Bagian <strong>{deletingDept.name}</strong> dan {deletingDept.members.length}{" "}
                  pendamping di dalamnya akan dihapus permanen.
                  {deletingDept.programs.length > 0
                    ? ` ${deletingDept.programs.length} program yang memakainya tidak ikut terhapus, tetapi kehilangan pilihan pendamping.`
                    : ""}{" "}
                  Riwayat reservasi lama tetap menampilkan nama pendampingnya. Kalau hanya mau
                  menyembunyikan sementara, nonaktifkan saja.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteDept();
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

      {/* Konfirmasi hapus pendamping */}
      <AlertDialog open={!!deletingMember} onOpenChange={(o) => !o && setDeletingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pendamping ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingMember ? (
                <>
                  <strong>{deletingMember.member.name}</strong> akan dihapus dari bagian{" "}
                  {deletingMember.dept.name}. Reservasi lama tetap menampilkan namanya. Kalau hanya
                  mau menyembunyikan dari formulir, nonaktifkan saja.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteMember();
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
