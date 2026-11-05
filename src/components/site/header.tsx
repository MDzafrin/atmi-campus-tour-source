"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, MapPin, Menu, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AtmiLogo } from "./atmi-logo";
import { useLang } from "@/lib/i18n";
import type { DictKey } from "@/lib/i18n";

const NAV: { key: DictKey; href: string }[] = [
  { key: "nav.about", href: "#tentang" },
  { key: "nav.tours", href: "#program-tur" },
  { key: "nav.facilities", href: "#fasilitas" },
  { key: "nav.location", href: "#lokasi" },
];

export function Header() {
  const { t, lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Topbar */}
      {/* <div className="hidden bg-atmi-navy-dark text-white/80 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5 text-xs">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-atmi-gold" />
              {t("topbar.phone")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-atmi-gold" />
              {t("topbar.address")}
            </span>
          </div>
          <span className="font-semibold tracking-[0.18em] text-atmi-gold uppercase">
            {t("nav.tagline")}
          </span>
        </div>
      </div> */}

      {/* Main bar */}
      <div
        className={`border-b bg-white/95 backdrop-blur transition-shadow ${
          scrolled ? "shadow-md border-border" : "border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <a href="#beranda" aria-label="ATMI Cikarang Campus Tour">
            <AtmiLogo />
          </a>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 lg:flex"
          >
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-atmi-sand hover:text-atmi-navy"
              >
                {t(item.key)}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <div
              className="flex items-center rounded-full border border-border bg-atmi-cream p-0.5"
              role="group"
              aria-label={t("common.langLabel")}
            >
              {(["id", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                    lang === l
                      ? "bg-atmi-blue text-white shadow-sm"
                      : "text-muted-foreground hover:text-atmi-gold"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <Button
              asChild
              className="hidden bg-atmi-blue font-bold text-white hover:bg-atmi-gold sm:inline-flex"
            >
              <a href="#reservasi">
                <CalendarCheck className="h-4 w-4" />
                {t("nav.reserve")}
              </a>
            </Button>

            {/* Mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 overflow-y-auto">
                <SheetHeader className="border-b">
                  <SheetTitle>
                    <AtmiLogo />
                  </SheetTitle>
                </SheetHeader>
                <SheetDescription className="sr-only">
                  Menu navigasi ATMI Campus Tour
                </SheetDescription>
                <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
                  {NAV.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground/85 transition-colors hover:bg-atmi-sand hover:text-atmi-navy"
                    >
                      {t(item.key)}
                    </a>
                  ))}
                  <Button
                    asChild
                    className="mt-3 bg-atmi-red font-bold text-white hover:bg-atmi-red-dark"
                  >
                    <a href="#reservasi" onClick={() => setOpen(false)}>
                      <CalendarCheck className="h-4 w-4" />
                      {t("nav.reserve")}
                    </a>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
