"use client";

import Image from "next/image";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Phone,
  Users,
} from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/lib/i18n";
import { useSiteConfig } from "@/lib/use-site-config";
import { useTourStore } from "@/lib/tour-store";
import type { ProgramDTO } from "@/lib/site-config";

function programName(p: ProgramDTO, lang: "id" | "en"): string {
  return lang === "en" ? p.nameEn || p.nameId : p.nameId;
}

function programDesc(p: ProgramDTO, lang: "id" | "en"): string {
  return lang === "en" ? p.descEn || p.descId : p.descId;
}

function programIncludes(p: ProgramDTO, lang: "id" | "en"): string[] {
  const arr = lang === "en" ? p.includesEn : p.includesId;
  return arr.length > 0 ? arr : p.includesId;
}

function TourCard({
  program,
  lang,
  index,
}: {
  program: ProgramDTO;
  lang: "id" | "en";
  index: number;
}) {
  const { t } = useLang();
  const setTourType = useTourStore((s) => s.setTourType);
  const h = (program.durationMin / 60).toLocaleString(
    lang === "en" ? "en-US" : "id-ID",
    { maximumFractionDigits: 2 },
  );

  return (
    <Reveal delay={index * 0.1} className="h-full">
      <article
        className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl ${
          program.highlight ? "border-atmi-red/50" : "border-border"
        }`}
      >
        <div className="relative h-52 overflow-hidden">
          {program.imageUrl ? (
            <Image
              src={program.imageUrl}
              alt={programName(program, lang)}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-atmi-navy/10" aria-hidden="true" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-atmi-navy-dark/80 via-transparent to-transparent" />
          {/* <span
            className={`absolute top-4 left-4 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white ${
              program.highlight ? "bg-atmi-red" : "bg-atmi-navy"
            }`}
          >
            {program.highlight ? "★ Populer" : "ATMI Tour"}
          </span> */}
          <h3 className="absolute bottom-4 left-5 text-2xl font-extrabold text-white">
            {programName(program, lang)}
          </h3>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {programDesc(program, lang)}
          </p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-semibold text-atmi-navy">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-atmi-red" aria-hidden="true" />
              {t("tours.meta.capacityTpl").replace("{n}", String(program.capacityMax))}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-atmi-red" aria-hidden="true" />
              {t("tours.meta.durationTpl").replace("{h}", h)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-atmi-red" aria-hidden="true" />
              {t("tours.meta.days")}
            </span>
          </div>

          <ul className="mt-5 flex-1 space-y-2.5 border-t border-dashed border-border pt-5">
            {programIncludes(program, lang).map((inc) => (
              <li key={inc} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-atmi-red"
                  aria-hidden="true"
                />
                <span className="text-foreground/85">{inc}</span>
              </li>
            ))}
          </ul>

          <Button
            asChild
            className={`mt-6 w-full font-bold text-white ${
              program.highlight
                ? "bg-atmi-blue hover:bg-atmi-blue-dark"
                : "bg-atmi-blue hover:bg-atmi-blue-dark"
            }`}
          >
            <a href="#reservasi" onClick={() => setTourType(program.slug)}>
              {t("tours.cta")}
            </a>
          </Button>
        </div>
      </article>
    </Reveal>
  );
}

export function TourPrograms() {
  const { t, lang } = useLang();
  const { config, error } = useSiteConfig();

  return (
    <section id="program-tur" className="bg-atmi-sand/60 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          kicker="tours.kicker"
          title={t("tours.title")}
          subtitle={t("tours.subtitle")}
        />

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {!config && !error
            ? [0, 1].map((i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <Skeleton className="h-52 w-full rounded-none" />
                  <div className="space-y-3 p-6">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="mt-4 h-10 w-full" />
                  </div>
                </div>
              ))
            : (config?.programs ?? []).map((program, i, all) => (
                <div
                  key={program.id}
                  className={
                    i === all.length - 1 && all.length % 2 === 1
                      ? "h-full md:col-span-2 md:mx-auto md:w-[calc(50%-1rem)]"
                      : "h-full"
                  }
                >
                  <TourCard program={program} lang={lang} index={i} />
                </div>
              ))}
          {config && config.programs.length === 0 && (
            <p className="col-span-2 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Belum ada program visit yang tersedia saat ini.
            </p>
          )}
        </div>

        <Reveal delay={0.2} className="mx-auto mt-10 max-w-3xl text-center">
          <p className="inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-atmi-navy/15 bg-white px-5 py-3.5 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0 text-atmi-red" aria-hidden="true" />
            {t("tours.note")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
