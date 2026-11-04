"use client";

import { Reveal } from "./reveal";
import { useLang } from "@/lib/i18n";
import type { DictKey } from "@/lib/i18n";

export function SectionHeading({
  kicker,
  title,
  subtitle,
  align = "center",
  dark = false,
}: {
  kicker: DictKey;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  dark?: boolean;
}) {
  const { t } = useLang();
  return (
    <Reveal
      className={`max-w-3xl ${
        align === "center" ? "mx-auto text-center" : "text-left"
      }`}
    >
      <span
        className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] ${
          dark ? "text-atmi-gold" : "text-atmi-red"
        }`}
      >
        <span
          className={`h-px w-8 ${dark ? "bg-atmi-gold" : "bg-atmi-red"}`}
          aria-hidden="true"
        />
        {t(kicker)}
      </span>
      <h2
        className={`mt-3 text-3xl font-extrabold tracking-tight md:text-4xl ${
          dark ? "text-white" : "text-atmi-navy"
        }`}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={`mt-4 text-base leading-relaxed ${
            dark ? "text-white/75" : "text-muted-foreground"
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </Reveal>
  );
}
