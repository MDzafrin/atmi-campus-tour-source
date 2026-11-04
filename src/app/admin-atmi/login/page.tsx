"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DashboardLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/admin-atmi");
        router.refresh();
      } else {
        setError("Password salah. Coba lagi.");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-atmi-navy-dark px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <div className="rounded-xl bg-atmi-navy px-5 py-4 text-center">
            <div className="text-[10px] font-bold tracking-[0.25em] text-white/70">
              POLITEKNIK INDUSTRI
            </div>
            <div className="text-lg font-extrabold tracking-wide text-white">
              ATMI Cikarang
            </div>
            <div className="mt-0.5 text-[10px] font-bold tracking-[0.3em] text-atmi-gold">
              PANEL ADMIN CAMPUS TOUR
            </div>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="password" className="text-sm font-bold text-atmi-navy">
                Password Admin
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="pl-9"
                  autoFocus
                  required
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-atmi-red/30 bg-atmi-red/5 px-3 py-2 text-xs font-semibold text-atmi-red">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-atmi-red font-bold text-white hover:bg-atmi-red-dark"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Memeriksa...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Masuk Dashboard
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-white/50">
          Khusus staf marketing / admin ATMI Cikarang
        </p>
      </div>
    </main>
  );
}
