"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { useLang } from "@/lib/i18n";
import { useTourStore, type TourType } from "@/lib/tour-store";
import { useSiteConfig } from "@/lib/use-site-config";
import { IMG } from "@/lib/images";
import { cn } from "@/lib/utils";

interface FormState {
  tourType: TourType;
  participants: string;
  date: Date | undefined;
  slot: string | undefined;
  name: string;
  institution: string;
  email: string;
  phone: string;
  notes: string;
  agree: boolean;
}

const INITIAL: FormState = {
  tourType: "",
  participants: "",
  date: undefined,
  slot: undefined,
  name: "",
  institution: "",
  email: "",
  phone: "",
  notes: "",
  agree: false,
};

/** "09:00-11:00" -> "09:00 – 11:00 WIB" */
function fmtSlot(s: string): string {
  return `${s.replace(/\s*-\s*/, " – ")} WIB`;
}

/** Date -> "yyyy-MM-dd" pada zona lokal */
function fmtYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function Reservation() {
  const { t, lang } = useLang();
  const { toast } = useToast();
  const { config } = useSiteConfig();
  const storeTourType = useTourStore((s) => s.tourType);
  const setStoreTourType = useTourStore((s) => s.setTourType);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null); // email pendaftar
  const [calOpen, setCalOpen] = useState(false);

  const programs = config?.programs ?? [];
  const settings = config?.settings ?? null;

  // Sync tour type dari kartu program → form
  useEffect(() => {
    setForm((f) => ({ ...f, tourType: storeTourType }));
  }, [storeTourType]);

  // Default: program pertama saat config tersedia dan belum ada pilihan
  useEffect(() => {
    if (config && !storeTourType && programs.length > 0) {
      setStoreTourType(programs[0].slug);
    }
  }, [config, storeTourType, programs, setStoreTourType]);

  const selectedProgram = programs.find((p) => p.slug === form.tourType) ?? null;
  const minParticipants = settings?.minParticipants ?? 10;
  const effectiveMax =
    selectedProgram?.capacityMax || settings?.maxParticipants || 30;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const locale = lang === "id" ? idLocale : enUS;

  // Kalender hanya mengizinkan tanggal yang DIBUKA oleh admin (pengaturan dashboard)
  const openSet = useMemo(
    () => new Set(settings?.openDates ?? []),
    [settings],
  );
  const firstOpenDate = useMemo(() => {
    const first = settings?.openDates?.[0];
    if (!first) return undefined;
    const [y, m, d] = first.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [settings]);

  const disabledDays = useMemo(
    () => [
      { before: new Date() },
      (date: Date) => !openSet.has(fmtYMD(date)),
    ],
    [openSet],
  );

  const participantsHint = t("res.participantsHintTpl")
    .replace("{min}", String(minParticipants))
    .replace("{max}", String(effectiveMax));

  const participantsErr = t("res.err.participantsTpl")
    .replace("{min}", String(minParticipants))
    .replace("{max}", String(effectiveMax));

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      const n = Number(form.participants);
      if (
        !form.participants ||
        Number.isNaN(n) ||
        n < minParticipants ||
        n > effectiveMax
      ) {
        errs.participants = participantsErr;
      }
    }
    if (s === 2) {
      if (!form.date) errs.date = t("res.err.date");
      if (!form.slot) errs.slot = t("res.err.slot");
    }
    if (s === 3) {
      if (form.name.trim().length < 2) errs.name = t("res.err.name");
      if (form.institution.trim().length < 2)
        errs.institution = t("res.err.institution");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
        errs.email = t("res.err.email");
      if (!/^[+()\-\s\d]{9,17}$/.test(form.phone.trim()))
        errs.phone = t("res.err.phone");
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!config) return; // tunggu data pengaturan termuat
    if (validateStep(step)) setStep((s) => Math.min(4, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const submit = async () => {
    if (!validateStep(3)) {
      setStep(3);
      return;
    }
    if (!form.agree) {
      setErrors({ agree: t("res.err.agree") });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourType: form.tourType,
          participants: Number(form.participants),
          date: form.date ? fmtYMD(form.date) : "",
          timeSlot: form.slot ?? "",
          name: form.name.trim(),
          institution: form.institution.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          notes: form.notes.trim() || null,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        email?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        const desc =
          data.error === "PARTICIPANTS_OUT_OF_RANGE"
            ? participantsErr
            : data.error === "DATE_CLOSED"
              ? t("res.err.date")
              : data.error === "SLOT_INVALID"
                ? t("res.err.slot")
                : t("res.err.submit");
        toast({
          title: t("res.err.submit"),
          description: desc,
          variant: "destructive",
        });
        return;
      }
      setDone(data.email ?? "");
      toast({
        title: t("res.success.title"),
        description: t("res.success.toast"),
      });
    } catch {
      toast({
        title: t("res.err.submit"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(INITIAL);
    setStep(1);
    setDone(null);
  };

  const stepLabels = [
    t("res.steps.1"),
    t("res.steps.2"),
    t("res.steps.3"),
    t("res.steps.4"),
  ];

  const programName = selectedProgram
    ? lang === "en"
      ? selectedProgram.nameEn || selectedProgram.nameId
      : selectedProgram.nameId
    : "—";

  return (
    <section id="reservasi" className="bg-atmi-sand/60 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          kicker="res.kicker"
          title={t("res.title")}
          subtitle={t("res.subtitle")}
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Info panel */}
          <Reveal className="lg:col-span-2">
            <div className="relative h-full overflow-hidden rounded-2xl bg-atmi-navy p-8 text-white shadow-xl">
              <Image
                src={IMG.location}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover opacity-15"
                aria-hidden="true"
              />
              <div className="relative">
                <h3 className="text-xl font-extrabold">
                  {t("res.info.title")}
                </h3>
                <ul className="mt-5 space-y-3.5">
                  {(["res.info.1", "res.info.2", "res.info.3", "res.info.4"] as const).map(
                    (k) => (
                      <li key={k} className="flex items-start gap-3 text-sm text-white/85">
                        <BadgeCheck
                          className="mt-0.5 h-4.5 w-4.5 shrink-0 text-atmi-gold"
                          aria-hidden="true"
                        />
                        {t(k)}
                      </li>
                    ),
                  )}
                </ul>

                <div className="mt-8 rounded-xl border border-white/15 bg-white/5 p-5 backdrop-blur">
                  <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">
                    {t("res.info.contact")}
                  </p>
                  <a
                    href="tel:+6281288331700"
                    className="mt-2 flex items-center gap-2.5 text-lg font-bold transition-colors hover:text-atmi-gold"
                  >
                    <Phone className="h-5 w-5 text-atmi-gold" aria-hidden="true" />
                    0812 8833 1700
                  </a>
                  <p className="mt-1.5 flex items-center gap-2.5 text-sm text-white/75">
                    <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {t("loc.hours.value")}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Form panel */}
          <Reveal delay={0.1} className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl md:p-8">
              {done !== null ? (
                <SuccessPanel
                  email={done}
                  onReset={reset}
                  summary={
                    <>
                      <SummaryRow
                        icon={GraduationCap}
                        label={t("res.summary.program")}
                        value={programName}
                      />
                      <SummaryRow
                        icon={CalendarDays}
                        label={t("res.summary.date")}
                        value={
                          form.date
                            ? format(form.date, "EEEE, d MMMM yyyy", { locale })
                            : "-"
                        }
                      />
                      <SummaryRow
                        icon={Clock}
                        label={t("res.summary.time")}
                        value={form.slot ? fmtSlot(form.slot) : "-"}
                      />
                      <SummaryRow
                        icon={Users}
                        label={t("res.summary.participants")}
                        value={`${form.participants}`}
                      />
                    </>
                  }
                />
              ) : (
                <>
                  {/* Stepper */}
                  <ol className="mb-8 flex items-center" aria-label="Reservation steps">
                    {stepLabels.map((label, i) => {
                      const n = i + 1;
                      const active = n === step;
                      const complete = n < step;
                      return (
                        <li key={label} className="flex flex-1 items-center last:flex-none">
                          <div className="flex flex-col items-center gap-1.5">
                            <span
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                                complete
                                  ? "border-atmi-red bg-atmi-red text-white"
                                  : active
                                    ? "border-atmi-red bg-white text-atmi-red shadow-md shadow-atmi-red/20"
                                    : "border-border bg-white text-muted-foreground",
                              )}
                              aria-current={active ? "step" : undefined}
                            >
                              {complete ? <Check className="h-4 w-4" /> : n}
                            </span>
                            <span
                              className={cn(
                                "hidden text-[11px] font-semibold sm:block",
                                active ? "text-atmi-navy" : "text-muted-foreground",
                              )}
                            >
                              {label}
                            </span>
                          </div>
                          {n < stepLabels.length && (
                            <div
                              className={cn(
                                "mx-2 h-0.5 flex-1 rounded sm:mx-3",
                                complete ? "bg-atmi-red" : "bg-border",
                              )}
                              aria-hidden="true"
                            />
                          )}
                        </li>
                      );
                    })}
                  </ol>

                  {/* Step 1: Program */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-bold text-atmi-navy">
                          {t("res.program")}
                        </Label>
                        {!config ? (
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <Skeleton className="h-20 rounded-xl" />
                            <Skeleton className="h-20 rounded-xl" />
                          </div>
                        ) : (
                          <RadioGroup
                            value={form.tourType}
                            onValueChange={(v) => set("tourType", v as TourType)}
                            className="mt-3 grid gap-3 sm:grid-cols-2"
                          >
                            {programs.map((p) => {
                              const name =
                                lang === "en" ? p.nameEn || p.nameId : p.nameId;
                              return (
                                <Label
                                  key={p.slug}
                                  htmlFor={`tour-${p.slug}`}
                                  className={cn(
                                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all",
                                    form.tourType === p.slug
                                      ? "border-atmi-red bg-atmi-red/5 shadow-sm"
                                      : "border-border hover:border-atmi-navy/40",
                                  )}
                                >
                                  <RadioGroupItem
                                    value={p.slug}
                                    id={`tour-${p.slug}`}
                                    className="mt-0.5 border-atmi-navy/40 text-atmi-red"
                                  />
                                  <span className="text-sm font-semibold text-foreground">
                                    {name}
                                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                                      {p.highlight
                                        ? "★ Populer"
                                        : t("tours.meta.durationTpl").replace(
                                            "{h}",
                                            (p.durationMin / 60).toLocaleString(
                                              lang === "en" ? "en-US" : "id-ID",
                                              { maximumFractionDigits: 2 },
                                            ),
                                          )}
                                    </span>
                                  </span>
                                </Label>
                              );
                            })}
                          </RadioGroup>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="participants" className="text-sm font-bold text-atmi-navy">
                          {t("res.participants")}
                        </Label>
                        <Input
                          id="participants"
                          type="number"
                          min={minParticipants}
                          max={effectiveMax}
                          inputMode="numeric"
                          placeholder={String(minParticipants)}
                          value={form.participants}
                          onChange={(e) => set("participants", e.target.value)}
                          className="mt-2 max-w-40"
                          aria-invalid={!!errors.participants}
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {participantsHint}
                        </p>
                        {errors.participants && (
                          <p className="mt-1 text-xs font-semibold text-atmi-red">
                            {errors.participants}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Schedule */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-bold text-atmi-navy">
                          {t("res.date")}
                        </Label>
                        <Popover open={calOpen} onOpenChange={setCalOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "mt-2 w-full justify-start font-normal sm:w-80",
                                !form.date && "text-muted-foreground",
                              )}
                            >
                              <CalendarDays className="h-4 w-4 text-atmi-red" />
                              {form.date
                                ? format(form.date, "EEEE, d MMMM yyyy", { locale })
                                : t("res.datePlaceholder")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={form.date}
                              onSelect={(d) => {
                                set("date", d);
                                setCalOpen(false);
                              }}
                              disabled={disabledDays}
                              locale={locale}
                              defaultMonth={form.date ?? firstOpenDate ?? new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        {config && settings && settings.openDates.length === 0 && (
                          <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                            {t("res.dateNone")}
                          </p>
                        )}
                        {errors.date && (
                          <p className="mt-1 text-xs font-semibold text-atmi-red">
                            {errors.date}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-bold text-atmi-navy">
                          {t("res.time")}
                        </Label>
                        <RadioGroup
                          value={form.slot ?? ""}
                          onValueChange={(v) => set("slot", v)}
                          className="mt-3 grid gap-3 sm:grid-cols-2"
                        >
                          {(settings?.timeSlots ?? []).map((slot) => (
                            <Label
                              key={slot}
                              htmlFor={`slot-${slot}`}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all",
                                form.slot === slot
                                  ? "border-atmi-red bg-atmi-red/5 shadow-sm"
                                  : "border-border hover:border-atmi-navy/40",
                              )}
                            >
                              <RadioGroupItem
                                value={slot}
                                id={`slot-${slot}`}
                                className="border-atmi-navy/40 text-atmi-red"
                              />
                              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                                <Clock className="h-4 w-4 text-atmi-navy" aria-hidden="true" />
                                {fmtSlot(slot)}
                              </span>
                            </Label>
                          ))}
                        </RadioGroup>
                        {errors.slot && (
                          <p className="mt-1 text-xs font-semibold text-atmi-red">
                            {errors.slot}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Applicant */}
                  {step === 3 && (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        id="name"
                        label={t("res.name")}
                        error={errors.name}
                        className="sm:col-span-2"
                      >
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) => set("name", e.target.value)}
                          placeholder={t("res.namePlaceholder")}
                          aria-invalid={!!errors.name}
                        />
                      </Field>
                      <Field
                        id="institution"
                        label={t("res.institution")}
                        error={errors.institution}
                        className="sm:col-span-2"
                      >
                        <Input
                          id="institution"
                          value={form.institution}
                          onChange={(e) => set("institution", e.target.value)}
                          placeholder={t("res.institutionPlaceholder")}
                          aria-invalid={!!errors.institution}
                        />
                      </Field>
                      <Field id="email" label={t("res.email")} error={errors.email}>
                        <div className="relative">
                          <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => set("email", e.target.value)}
                            placeholder={t("res.emailPlaceholder")}
                            className="pl-9"
                            aria-invalid={!!errors.email}
                          />
                        </div>
                      </Field>
                      <Field id="phone" label={t("res.phone")} error={errors.phone}>
                        <div className="relative">
                          <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) => set("phone", e.target.value)}
                            placeholder={t("res.phonePlaceholder")}
                            className="pl-9"
                            aria-invalid={!!errors.phone}
                          />
                        </div>
                      </Field>
                      <Field
                        id="notes"
                        label={t("res.notes")}
                        className="sm:col-span-2"
                        error={undefined}
                      >
                        <Textarea
                          id="notes"
                          rows={3}
                          value={form.notes}
                          onChange={(e) => set("notes", e.target.value)}
                          placeholder={t("res.notesPlaceholder")}
                        />
                      </Field>
                    </div>
                  )}

                  {/* Step 4: Review */}
                  {step === 4 && (
                    <div className="space-y-5">
                      <h3 className="text-lg font-bold text-atmi-navy">
                        {t("res.summary")}
                      </h3>
                      <dl className="grid gap-3 rounded-xl border border-border bg-atmi-cream p-5 sm:grid-cols-2">
                        <SummaryRow
                          icon={GraduationCap}
                          label={t("res.summary.program")}
                          value={programName}
                        />
                        <SummaryRow
                          icon={Users}
                          label={t("res.summary.participants")}
                          value={`${form.participants}`}
                        />
                        <SummaryRow
                          icon={CalendarDays}
                          label={t("res.summary.date")}
                          value={
                            form.date
                              ? format(form.date, "EEEE, d MMMM yyyy", { locale })
                              : "-"
                          }
                        />
                        <SummaryRow
                          icon={Clock}
                          label={t("res.summary.time")}
                          value={form.slot ? fmtSlot(form.slot) : "-"}
                        />
                        <SummaryRow
                          icon={Check}
                          label={t("res.name")}
                          value={form.name || "-"}
                        />
                        <SummaryRow
                          icon={MapPin}
                          label={t("res.institution")}
                          value={form.institution || "-"}
                        />
                        <SummaryRow
                          icon={Mail}
                          label={t("res.summary.contact")}
                          value={`${form.email || "-"} · ${form.phone || "-"}`}
                        />
                      </dl>

                      {form.notes ? (
                        <div className="rounded-xl border border-border p-4 text-sm">
                          <span className="font-bold text-atmi-navy">
                            {t("res.notes")}:
                          </span>{" "}
                          <span className="text-muted-foreground">{form.notes}</span>
                        </div>
                      ) : null}

                      <div>
                        <Label
                          htmlFor="agree"
                          className={cn(
                            "flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed font-normal",
                            errors.agree ? "border-atmi-red" : "border-border",
                          )}
                        >
                          <Checkbox
                            id="agree"
                            checked={form.agree}
                            onCheckedChange={(v) => set("agree", v === true)}
                            className="mt-0.5 border-atmi-navy/50 data-[state=checked]:border-atmi-red data-[state=checked]:bg-atmi-red"
                          />
                          {t("res.agree")}
                        </Label>
                        {errors.agree && (
                          <p className="mt-1 text-xs font-semibold text-atmi-red">
                            {errors.agree}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Nav buttons */}
                  <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                    <Button
                      variant="outline"
                      onClick={back}
                      disabled={step === 1 || submitting}
                      className="font-semibold"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t("res.back")}
                    </Button>
                    {step < 4 ? (
                      <Button
                        onClick={next}
                        disabled={!config || submitting}
                        className="bg-atmi-navy font-bold text-white hover:bg-atmi-navy-dark"
                      >
                        {t("res.next")}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={submit}
                        disabled={submitting}
                        className="bg-atmi-red font-bold text-white shadow-lg shadow-atmi-red/25 hover:bg-atmi-red-dark"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("res.submitting")}
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            {t("res.submit")}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="text-sm font-bold text-atmi-navy">
        {label}
      </Label>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1 text-xs font-semibold text-atmi-red">{error}</p>}
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-atmi-red" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </dt>
        <dd className="text-sm font-semibold break-words text-foreground">
          {value}
        </dd>
      </div>
    </div>
  );
}

function SuccessPanel({
  email,
  onReset,
  summary,
}: {
  email: string;
  onReset: () => void;
  summary: React.ReactNode;
}) {
  const { t } = useLang();
  const AUTO_SECONDS = 8;
  const [countdown, setCountdown] = useState(AUTO_SECONDS);
  const resetRef = useRef(onReset);
  useEffect(() => {
    resetRef.current = onReset;
  }, [onReset]);

  // Otomatis kembali ke formulir (langkah 1) tanpa perlu klik apa pun.
  useEffect(() => {
    if (countdown <= 0) {
      resetRef.current();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
        <BadgeCheck className="h-9 w-9 text-green-600" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-2xl font-extrabold text-atmi-navy">
        {t("res.success.title")}
      </h3>

      <div className="mt-5 w-full rounded-xl border border-amber-300/70 bg-amber-50 px-5 py-4">
        <p className="text-[11px] font-semibold tracking-wide text-amber-700 uppercase">
          {t("res.success.statusLabel")}
        </p>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-base font-extrabold text-amber-800">
          <Clock className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
          {t("res.success.statusValue")}
        </p>
      </div>

      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        {t("res.success.desc")}
      </p>

      {email ? (
        <p className="mt-3 max-w-md text-xs leading-relaxed text-muted-foreground">
          {t("res.success.emailLater")}{" "}
          <span className="font-bold break-all text-atmi-navy">{email}</span>
        </p>
      ) : null}

      <dl className="mt-6 grid w-full gap-3 rounded-xl border border-border bg-atmi-cream p-5 text-left sm:grid-cols-2">
        {summary}
      </dl>

      <p className="mt-5 max-w-md text-xs leading-relaxed text-muted-foreground">
        {t("res.success.note")}
      </p>

      <Button
        onClick={onReset}
        variant="outline"
        className="mt-6 font-semibold text-atmi-navy"
      >
        {t("res.success.again")}
      </Button>
      <p
        className="mt-3 text-xs text-muted-foreground"
        aria-live="polite"
      >
        {t("res.success.auto").replace("{n}", String(countdown))}
      </p>
    </div>
  );
}

/* sync check */
