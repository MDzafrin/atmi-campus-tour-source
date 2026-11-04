"use client";

import {
  Clock,
  Facebook,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { useLang } from "@/lib/i18n";

const SOCIALS = [
  {
    icon: Instagram,
    label: "Instagram @atmi.cikarang",
    href: "https://www.instagram.com/atmi.cikarang/",
  },
  {
    icon: Facebook,
    label: "Facebook Politeknik Industri ATMI",
    href: "https://www.facebook.com/PoliteknikIndustriATMI/",
  },
];

export function LocationContact() {
  const { t } = useLang();
  return (
    <section id="lokasi" className="bg-atmi-sand/60 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          kicker="loc.kicker"
          title={t("loc.title")}
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Info */}
          <Reveal>
            <div className="flex h-full flex-col gap-5">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="flex items-center gap-2.5 text-sm font-extrabold tracking-wide text-atmi-navy uppercase">
                  <MapPin className="h-4.5 w-4.5 text-atmi-red" aria-hidden="true" />
                  {t("loc.address.label")}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t("loc.address.value")}
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="flex items-center gap-2.5 text-sm font-extrabold tracking-wide text-atmi-navy uppercase">
                    <Phone className="h-4.5 w-4.5 text-atmi-red" aria-hidden="true" />
                    {t("loc.contact.label")}
                  </h3>
                  <a
                    href="tel:+6281288331700"
                    className="mt-3 block text-lg font-extrabold text-foreground transition-colors hover:text-atmi-red"
                  >
                    0812 8833 1700
                  </a>
                  <div className="mt-3 flex gap-2">
                    {SOCIALS.map((s) => (
                      <a
                        key={s.href}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-atmi-red hover:text-atmi-red"
                      >
                        <s.icon className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="flex items-center gap-2.5 text-sm font-extrabold tracking-wide text-atmi-navy uppercase">
                    <Clock className="h-4.5 w-4.5 text-atmi-red" aria-hidden="true" />
                    {t("loc.hours.label")}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed font-semibold text-foreground">
                    {t("loc.hours.value")}
                  </p>
                </div>
              </div>

              <div className="mt-auto grid gap-3 sm:grid-cols-2">
                <Button
                  asChild
                  className="h-11 bg-atmi-red font-bold text-white hover:bg-atmi-red-dark"
                >
                  <a
                    href="https://wa.me/6281288331700?text=Halo%20ATMI%2C%20saya%20ingin%20reservasi%20Campus%20Tour"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t("loc.wa")}
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-11 font-bold text-atmi-navy">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Politeknik+Industri+ATMI+Cikarang"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-4 w-4" />
                    {t("loc.maps")}
                  </a>
                </Button>
              </div>
            </div>
          </Reveal>

          {/* Map */}
          <Reveal delay={0.1}>
            <div className="h-full min-h-[340px] overflow-hidden rounded-2xl border border-border shadow-lg">
              <iframe
                title="Peta lokasi Politeknik Industri ATMI Cikarang"
                src="https://www.google.com/maps?q=Politeknik%20Industri%20ATMI%20Cikarang&output=embed"
                className="h-full min-h-[340px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
