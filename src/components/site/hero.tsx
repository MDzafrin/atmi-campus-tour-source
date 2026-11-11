"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CalendarCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMG } from "@/lib/images";
import { useLang } from "@/lib/i18n";

const STATS = [
  { value: "2.000+", key: "hero.stats.alumni" as const },
  { value: "3", key: "hero.stats.prodi" as const },
  { value: "67%", key: "hero.stats.practice" as const },
  { value: "20+", key: "hero.stats.years" as const },
];

export function Hero() {
  const { t } = useLang();
  return (
    <section id="beranda" className="relative">
      <div className="relative min-h-[calc(100vh-6rem)] overflow-hidden">
        <Image
          src={IMG.hero}
          alt="Gedung dan taman Politeknik Industri ATMI Cikarang dengan patung Santo Mikael"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[56%_center]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-atmi-navy-dark/95 via-atmi-navy/80 to-atmi-navy/30"
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-atmi-navy-dark/90 to-transparent"
          aria-hidden="true"
        />

        <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl flex-col justify-center px-4 py-20 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-3xl"
          >
            {/* <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-atmi-red" aria-hidden="true" />
              {t("hero.badge")}
            </span> */}
            <h1 className="text-shadow-hero mt-6 text-4xl leading-[1.1] font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t("hero.title1")}
              <span className="mt-2 block text-atmi-gold">{t("hero.title2")}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {/* <Button
                asChild
                size="lg"
                className="bg-atmi-blue text-base font-bold text-white shadow-lg shadow-atmi-blue/30 hover:bg-atmi-gold"
              >
                <a href="#reservasi">
                  <CalendarCheck className="h-5 w-5" />
                  {t("hero.ctaReserve")}
                </a>
              </Button> */}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/50 bg-transparent text-base font-bold text-white hover:bg-white/10 hover:text-white"
              >
                <a href="#program-tur">{t("hero.ctaPrograms")}</a>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.dl
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
            className="glass-dark mt-14 grid grid-cols-2 gap-6 rounded-2xl border border-white/15 px-6 py-6 text-white md:grid-cols-4 md:px-10"
          >
            {STATS.map((s) => (
              <div key={s.key} className="text-center md:text-left">
                <dt className="order-2 mt-1 block text-xs leading-snug font-medium text-white/70 md:text-sm">
                  {t(s.key)}
                </dt>
                <dd className="order-1 text-3xl font-extrabold tracking-tight text-atmi-gold md:text-4xl">
                  {s.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <a
          href="#tentang"
          className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-white/70 transition-colors hover:text-white md:flex"
          aria-label={t("hero.scroll")}
        >
          <span className="text-[11px] font-semibold tracking-widest uppercase">
            {t("hero.scroll")}
          </span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </a>
      </div>
    </section>
  );
}
