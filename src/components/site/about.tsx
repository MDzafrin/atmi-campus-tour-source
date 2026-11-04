"use client";

import Image from "next/image";
import { BedDouble, Cog, Factory, MapPin } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { IMG } from "@/lib/images";
import { useLang } from "@/lib/i18n";
import type { DictKey } from "@/lib/i18n";

const WHY: { icon: React.ElementType; title: DictKey; desc: DictKey }[] = [
  { icon: Cog, title: "about.why.1.title", desc: "about.why.1.desc" },
  { icon: Factory, title: "about.why.2.title", desc: "about.why.2.desc" },
  { icon: BedDouble, title: "about.why.3.title", desc: "about.why.3.desc" },
  { icon: MapPin, title: "about.why.4.title", desc: "about.why.4.desc" },
];

export function About() {
  const { t } = useLang();
  return (
    <section id="tentang" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Image side */}
          <Reveal className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-xl">
              <Image
                src={IMG.about}
                alt="Gedung kampus Politeknik Industri ATMI Cikarang"
                width={1200}
                height={800}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-auto w-full object-cover"
              />
            </div>
            <div
              className="absolute -bottom-5 -left-3 rounded-xl bg-atmi-red px-5 py-4 text-white shadow-lg md:-left-6"
              aria-hidden="false"
            >
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase opacity-80">
                Competence · Conscience · Compassion · Commitment · Leadership
              </p>
              <p className="mt-1 text-sm font-bold">{t("about.motto")}</p>
            </div>
            <div
              className="absolute -top-4 -right-4 hidden h-24 w-24 rounded-tl-2xl border-t-4 border-l-4 border-atmi-gold lg:block"
              aria-hidden="true"
            />
          </Reveal>

          {/* Text side */}
          <div>
            <SectionHeading
              kicker="about.kicker"
              title={t("about.title")}
              align="left"
            />
            <Reveal delay={0.1}>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                {t("about.p1")}
              </p>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("about.p2")}
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <h3 className="mt-10 text-lg font-bold text-atmi-navy">
                {t("about.why.title")}
              </h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {WHY.map((w) => (
                  <div
                    key={w.title}
                    className="group rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-1 hover:border-atmi-red/40 hover:shadow-lg"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-atmi-navy/5 text-atmi-navy transition-colors group-hover:bg-atmi-red group-hover:text-white">
                      <w.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h4 className="mt-3 text-sm font-bold text-foreground">
                      {t(w.title)}
                    </h4>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      {t(w.desc)}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
