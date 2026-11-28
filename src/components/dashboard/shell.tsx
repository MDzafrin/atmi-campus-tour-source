"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  GraduationCap,
  Inbox,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  UserCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Status sidebar (ditutup/dibuka) disimpan di browser supaya tetap sama saat pindah halaman.
const COLLAPSE_KEY = "atmi-admin-sidebar-collapsed";
const COLLAPSE_EVENT = "atmi-admin-sidebar-change";

function subscribeCollapsed(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(COLLAPSE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(COLLAPSE_EVENT, callback);
  };
}

function getCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

const NAV = [
  { href: "/admin-atmi", label: "Data Reservasi", icon: Users },
  { href: "/admin-atmi/pengaturan", label: "Pengaturan Formulir", icon: Settings2 },
  { href: "/admin-atmi/program", label: "Program Visit", icon: GraduationCap },
  { href: "/admin-atmi/pendamping", label: "Pendamping", icon: UserCheck },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1" aria-label="Menu dashboard">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-white/15 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin-atmi/login");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-6 pb-5">
        <div className="rounded-xl bg-white/10 p-4 text-center">
          <div className="text-[10px] font-bold tracking-[0.25em] text-white/70">
            POLITEKNIK INDUSTRI
          </div>
          <div className="text-lg font-extrabold tracking-wide text-white">
            ATMI Cikarang
          </div>
          <div className="mt-0.5 text-[10px] font-bold tracking-[0.3em] text-atmi-gold">
            PANEL ADMIN
          </div>
        </div>
      </div>

      <div className="flex-1 px-3">
        <p className="mb-2 px-2.5 text-[11px] font-bold tracking-widest text-white/40 uppercase">
          Menu Utama
        </p>
        <NavLinks onNavigate={onNavigate} />

        <p className="mt-6 mb-2 px-2.5 text-[11px] font-bold tracking-widest text-white/40 uppercase">
          Tautan
        </p>
        <Link
          href="/kotak-masuk"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Inbox className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
          Kotak Masuk (Verifikasi)
        </Link>
        <Link
          href="/"
          target="_blank"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
          Lihat Website
        </Link>
      </div>

      <div className="px-3 pb-5">
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start gap-3 px-3.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
          Keluar
        </Button>
      </div>
    </div>
  );
}

export function DashboardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const collapsed = useSyncExternalStore(subscribeCollapsed, getCollapsed, () => false);

  const toggleCollapsed = () => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "0" : "1");
    } catch {
      // penyimpanan browser tidak tersedia: abaikan, tombol tetap berfungsi untuk halaman ini saja
    }
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  };

  return (
    <div className="min-h-screen bg-atmi-sand/40">
      {/* Sidebar desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden w-64 bg-atmi-navy-dark",
          !collapsed && "lg:block",
        )}
      >
        <SidebarContent />
      </aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-40 flex items-center gap-3 bg-atmi-navy-dark px-4 py-3 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-0 bg-atmi-navy-dark p-0 [&>button]:text-white">
            <SheetTitle className="sr-only">Menu dashboard</SheetTitle>
            <SheetDescription className="sr-only">
              Navigasi panel admin ATMI
            </SheetDescription>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="text-sm font-extrabold tracking-wide text-white">
          ATMI Admin
        </div>
      </header>

      {/* Konten */}
      <div className={cn(!collapsed && "lg:pl-64")}>
        <main
          className={cn(
            "mx-auto px-4 py-8 md:px-8",
            collapsed ? "max-w-none" : "max-w-6xl",
          )}
        >
          <header className="mb-6 flex items-start gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleCollapsed}
              className="hidden shrink-0 lg:inline-flex"
              aria-label={collapsed ? "Buka menu samping" : "Tutup menu samping"}
              aria-expanded={!collapsed}
              title={collapsed ? "Buka menu samping" : "Tutup menu samping (tabel jadi lebih lebar)"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            <div>
              <h1 className="text-2xl font-extrabold text-atmi-navy">{title}</h1>
              {subtitle ? (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
