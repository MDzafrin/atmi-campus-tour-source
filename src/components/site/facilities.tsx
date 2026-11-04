"use client";

import Image from "next/image";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { IMG } from "@/lib/images";
import { useLang } from "@/lib/i18n";
import type { DictKey } from "@/lib/i18n";

const FACILITIES: {
  img: string;
  alt: string;
  title: DictKey;
  desc: DictKey;
}[] = [
  {
    img: IMG.facilityTef,
    alt: "Area produksi Teaching Factory",
    title: "facilities.1.title",
    desc: "facilities.1.desc",
  },
  {
    img: IMG.facilityCnc,
    alt: "Workshop mesin CNC dan mesin perkakas",
    title: "facilities.2.title",
    desc: "facilities.2.desc",
  },
  {
    img: IMG.facilityMecha,
    alt: "Praktik perakitan modul mekatronika dan robotika",
    title: "facilities.3.title",
    desc: "facilities.3.desc",
  },
  {
    img: IMG.facilityDorm,
    alt: "Gedung asrama mahasiswa ATMI (Xaverius Dorm)",
    title: "facilities.4.title",
    desc: "facilities.4.desc",
  },
];

export function Facilities() {
  const { t } = useLang();
  return (
    <section id="fasilitas" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          kicker="facilities.kicker"
          title={t("facilities.title")}
          subtitle={t("facilities.subtitle")}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FACILITIES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08} className="h-full">
              <article className="group h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={f.img}
                    alt={f.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-atmi-navy-dark/70 to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold text-atmi-navy">
                    {t(f.title)}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {t(f.desc)}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
