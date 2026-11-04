"use client";

import { GraduationCap, Mail, MapPin, Phone } from "lucide-react";
import { AtmiLogo } from "./atmi-logo";
import { useLang } from "@/lib/i18n";
import type { DictKey } from "@/lib/i18n";

const LINKS: { key: DictKey; href: string }[] = [
  { key: "nav.about", href: "#tentang" },
  { key: "nav.tours", href: "#program-tur" },
  { key: "nav.facilities", href: "#fasilitas" },
  { key: "nav.location", href: "#lokasi" },
];

const PROGS: DictKey[] = ["footer.prog.1", "footer.prog.2", "footer.prog.3"];

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="mt-auto bg-atmi-navy-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <AtmiLogo variant="light" />
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              {t("footer.blurb")}
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer navigation">
            <h3 className="text-sm font-extrabold tracking-[0.18em] text-atmi-gold uppercase">
              {t("footer.links")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-white/75 transition-colors hover:text-white"
                  >
                    {t(l.key)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Programs */}
          <div>
            <h3 className="text-sm font-extrabold tracking-[0.18em] text-atmi-gold uppercase">
              {t("footer.programs")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {PROGS.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-white/75">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
                  {t(p)}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-extrabold tracking-[0.18em] text-atmi-gold uppercase">
              {t("footer.contact")}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
                Jl. Kampus Hijau No. 3, Jababeka Education Park, Cikarang Baru, Bekasi 17520
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
                <a href="tel:+6281288331700" className="transition-colors hover:text-white">
                  0812 8833 1700
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
                <a
                  href="https://atmicikarang.ac.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  atmicikarang.ac.id
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
          <p className="text-center text-xs text-white/60">{t("footer.rights")}</p>
          <p className="mt-1.5 text-center text-[11px] text-white/40">
            {t("footer.disclaimer")}
          </p>
        </div>
      </div>
    </footer>
  );
}
