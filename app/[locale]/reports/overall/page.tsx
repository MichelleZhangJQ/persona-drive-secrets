"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMessages, useTranslations } from "next-intl";
import { AuthHeader } from "@/components/AuthHeader";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { usePersonaDerived } from "@/lib/persona-derived/usePersonaDerived";
import { ensurePersonaDerived } from "@/lib/persona-derived/persona-derived";
import { driveNames } from "@/lib/core-utils/fit-core";
import { computeIdealPartnerProfileUIModel } from "@/lib/relationship/relationship";
import { hasReportAccess } from "@/lib/access-logic";
import { driveLabel as driveLabelForLocale } from "@/lib/i18n/drive-i18n";

const accent = "#7aa883";

type DriveEntry = { name: string; label: string; value: number };

type BarGraphProps = {
  title: string;
  description: string;
  data: DriveEntry[];
};

const BarGraph = ({ title, description, data }: BarGraphProps) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={item.name}>
            <div className="flex items-end justify-between text-[10px] font-black uppercase tracking-wide text-slate-500">
              <span className="text-slate-300">#{idx + 1}</span>
              <span className="flex-1 px-2 text-slate-700 font-bold truncate">{item.label}</span>
              <span className="text-slate-400">{item.value.toFixed(2)}</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${(item.value / maxValue) * 100}%`, backgroundColor: accent }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[12px] text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
};

const MetricCard = ({
  label,
  value,
  tooltip,
  range,
}: {
  label: string;
  value: string;
  tooltip: string;
  range: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">{label}</p>
    <p className="text-3xl font-black text-slate-900" title={tooltip}>
      {value}
    </p>
    <p className="mt-2 text-[11px] font-semibold text-slate-400">{range}</p>
  </div>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-8">
    <h2 className="text-lg font-black uppercase tracking-[0.3em] text-slate-800">{title}</h2>
    {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
  </div>
);

function jungLetter(pole: string | undefined, mapping: Record<string, string>, mixed: string) {
  if (!pole) return mixed;
  return mapping[pole] ?? mixed;
}

function JungDim({ value }: { value: string }) {
  const isMixed = value.includes("/");
  if (!isMixed) {
    return (
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-slate-200 text-2xl font-black text-current font-mono">
        {value}
      </span>
    );
  }

  const [a, b] = value.split("/").map((x) => x.trim());
  return (
    <span className="inline-flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-white border border-slate-200 font-mono">
      <span className="text-[12px] leading-[12px] font-black text-current">{a}</span>
      <span className="text-[12px] leading-[12px] font-black text-current">{b}</span>
    </span>
  );
}

function JungCodeRow({
  label,
  dims,
  standout,
}: {
  label: string;
  dims: string[];
  standout?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
        {label}
      </span>
      <div className={`flex items-center gap-2 ${standout ? "text-indigo-700" : "text-slate-800"}`}>
        {dims.map((d, i) => (
          <span key={`${label}-${i}`} className={standout ? "ring-2 ring-indigo-200 rounded-lg" : undefined}>
            <JungDim value={d} />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function OverallReportPage() {
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";
  const t = useTranslations("overall");
  const messages = useMessages();
  const overallMessages = (messages as any)?.overall ?? {};
  const supabase = createBrowserSupabaseClient();
  const [profile, setProfile] = useState<any>(null);

  const hasOverallKey = useCallback(
    (key: string) => {
      const parts = key.split(".");
      let node: any = overallMessages;
      for (const part of parts) {
        if (!node || typeof node !== "object" || !(part in node)) return false;
        node = node[part];
      }
      return typeof node === "string";
    },
    [overallMessages]
  );

  const tSafe = useCallback(
    (key: string, values?: Record<string, any>) => {
      if (!hasOverallKey(key)) return key;
      return t(key, values as any);
    },
    [hasOverallKey, t]
  );

  const withLocale = useCallback(
    (href: string) => {
      if (!href) return `/${locale}`;
      if (href.startsWith("http") || href.startsWith("mailto:")) return href;
      if (href.startsWith(`/${locale}`)) return href;
      if (href.startsWith("/")) return `/${locale}${href}`;
      return `/${locale}/${href}`;
    },
    [locale]
  );

  const { loading, error, derived, latestTests, missingTests } = usePersonaDerived();
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [statusDetail, setStatusDetail] = useState<string | null>(null);

  const driveLabel = useCallback(
    (name: string) => driveLabelForLocale(name as any, locale),
    [locale]
  );

  const driveEntries = useCallback(
    (vector: Record<string, number> | null | undefined) => {
      if (!vector) return [];
      return driveNames.map((name) => ({
        name,
        label: driveLabel(name),
        value: Number(vector[name] ?? 0),
      }));
    },
    [driveLabel]
  );

  const sortDescending = useCallback((items: DriveEntry[]) => {
    return [...items].sort((a, b) => b.value - a.value);
  }, []);

  const envVector = derived?.imposed_env;
  const competenceVector = derived?.imposed_competence;
  const satisfactionVector = derived?.td_satisfaction;
  const surfaceVector = derived?.surface_avg;
  const innateVector = derived?.innate_avg;
  const jungAxes = derived?.jung_axes;
  const instrumentPaths = derived?.instrument_paths ?? [];

  const envRequired = useMemo(() => sortDescending(driveEntries(envVector)), [driveEntries, envVector, sortDescending]);
  const satisfaction = useMemo(() => sortDescending(driveEntries(satisfactionVector)), [driveEntries, satisfactionVector, sortDescending]);
  const surfaceDrives = useMemo(() => sortDescending(driveEntries(surfaceVector)), [driveEntries, surfaceVector, sortDescending]);
  const innateDrives = useMemo(() => sortDescending(driveEntries(innateVector)), [driveEntries, innateVector, sortDescending]);

  const avg = useCallback((vector: Record<string, number> | null | undefined) => {
    if (!vector) return 0;
    const total = driveNames.reduce((sum, name) => sum + Number(vector[name] ?? 0), 0);
    return total / driveNames.length;
  }, []);

  const adaptationScore = avg(competenceVector);

  const topSurface = surfaceDrives.slice(0, 3);
  const topInnate = innateDrives.slice(0, 3);

  const partnerProfile = useMemo(() => {
    if (!latestTests?.innate || !latestTests?.surface) return null;
    return computeIdealPartnerProfileUIModel({
      innateData: latestTests.innate,
      surfaceData: latestTests.surface,
    });
  }, [latestTests]);

  const partnerTopDrives = partnerProfile?.rows?.slice(0, 3) ?? [];

  const totalDrain = instrumentPaths.reduce((sum: number, path: any) => sum + Number(path.pathDrain ?? 0), 0);
  const totalTransfer = instrumentPaths.reduce((sum: number, path: any) => sum + Number(path.pathTransfer ?? 0), 0);

  const isRelationshipUnlocked = hasReportAccess(profile, 1);
  const isDrainUnlocked = hasReportAccess(profile, 2);
  const isProfessionUnlocked = hasReportAccess(profile, 3);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { data } = await supabase
        .from("profiles")
        .select("has_access_report_1, has_access_report_2, has_access_report_3, report_1_expires_at, report_2_expires_at, report_3_expires_at")
        .eq("id", user.id)
        .maybeSingle();

      if (active) setProfile(data ?? null);
    };
    void loadProfile();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    let active = true;
    const loadStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;

      const result = await ensurePersonaDerived({ supabase, userId: user.id });
      if (!active) return;

      if (result?.reasons?.includes("upsert_failed")) {
        setStatusNote(tSafe("status.upsertFailed"));
        setStatusDetail(result?.error ?? null);
        return;
      }

      if (result?.reasons?.length) {
        setStatusNote(tSafe("status.recomputed"));
        return;
      }

      setStatusNote(tSafe("status.cached"));
      setStatusDetail(null);
    };
    void loadStatus();
    return () => {
      active = false;
    };
  }, [supabase, t]);

  const jungCodeDims = useCallback(
    (source: "surface" | "innate") => {
      if (!jungAxes) return ["--", "--", "--", "--"];
      const energy = jungAxes.energy?.[source]?.pole;
      const perception = jungAxes.perception?.[source]?.pole;
      const judgment = jungAxes.judgment?.[source]?.pole;
      const orientation = jungAxes.orientation?.[source]?.pole;

      return [
        jungLetter(energy, { Introvert: "I", Extrovert: "E" }, "I/E"),
        jungLetter(perception, { Sensing: "S", Intuitive: "N" }, "N/S"),
        jungLetter(judgment, { Thinking: "T", Feeling: "F" }, "T/F"),
        jungLetter(orientation, { Judging: "J", Perspective: "P" }, "J/P"),
      ];
    },
    [jungAxes]
  );

  const jungOverallDims = useMemo(() => {
    if (!jungAxes) return ["--", "--", "--", "--"];
    return [
      jungLetter(jungAxes.energy?.surface?.pole, { Introvert: "I", Extrovert: "E" }, "I/E"),
      jungLetter(jungAxes.perception?.innate?.pole, { Sensing: "S", Intuitive: "N" }, "N/S"),
      jungLetter(jungAxes.judgment?.surface?.pole, { Thinking: "T", Feeling: "F" }, "T/F"),
      jungLetter(jungAxes.orientation?.innate?.pole, { Judging: "J", Perspective: "P" }, "J/P"),
    ];
  }, [jungAxes]);

  const jungSurfaceDims = useMemo(() => jungCodeDims("surface"), [jungCodeDims]);
  const jungInnateDims = useMemo(() => jungCodeDims("innate"), [jungCodeDims]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] text-slate-600">
        <AuthHeader />
        <main className="mx-auto max-w-5xl px-4 py-20 text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">{t("loading")}</p>
        </main>
      </div>
    );
  }

  if (error === "missing_tests") {
    const missing = new Set(missingTests ?? ["imposed", "surface", "innate"]);
    return (
      <div className="min-h-screen bg-[#fdfdfc] text-slate-600">
        <AuthHeader />
        <main className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-slate-700">{t("missingTests.title")}</h1>
          <p className="mt-4 text-sm text-slate-500">{t("missingTests.subtitle")}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {missing.has("imposed") ? (
              <Link
                href={withLocale("/tests/imposed-persona")}
                className="rounded-full border border-slate-300 px-6 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-600"
              >
                {t("missingTests.imposed")}
              </Link>
            ) : null}
            {missing.has("surface") ? (
              <Link
                href={withLocale("/tests/surface-persona")}
                className="rounded-full border border-slate-300 px-6 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-600"
              >
                {t("missingTests.surface")}
              </Link>
            ) : null}
            {missing.has("innate") ? (
              <Link
                href={withLocale("/tests/innate-persona")}
                className="rounded-full border border-slate-300 px-6 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-600"
              >
                {t("missingTests.innate")}
              </Link>
            ) : null}
          </div>
        </main>
      </div>
    );
  }

  if (error || !derived) {
    return (
      <div className="min-h-screen bg-[#fdfdfc] text-slate-600">
        <AuthHeader />
        <main className="mx-auto max-w-4xl px-4 py-20 text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">{t("error")}</p>
        </main>
      </div>
    );
  }

  const computedAt = derived?.derived_at
    ? new Date(derived.derived_at).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")
    : "";

  return (
    <div className="min-h-screen bg-[#fdfdfc] text-slate-600">
      <AuthHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="mb-14">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">
              {t("header.kicker")}
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
              {t("header.title")}
            </h1>
            <p className="mt-3 text-sm text-slate-500 max-w-2xl">{t("header.subtitle")}</p>
            {computedAt ? (
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
                {t("header.computed", { date: computedAt })}
              </p>
            ) : null}
            {statusNote ? (
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                {statusNote}
              </p>
            ) : null}
            {statusDetail ? (
              <p className="mt-1 text-[10px] font-semibold text-rose-500">{statusDetail}</p>
            ) : null}
          </div>
        </header>

        <section className="mb-16">
          <SectionHeader title={t("environment.title")} subtitle={t("environment.subtitle")} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <MetricCard
              label={t("environment.metrics.adaptation")}
              value={adaptationScore.toFixed(2)}
              tooltip={t("environment.metrics.adaptationTooltip")}
              range={t("environment.metrics.adaptationRange")}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarGraph
              title={t("environment.graphs.required.title")}
              description={t("environment.graphs.required.description")}
              data={envRequired}
            />
            <BarGraph
              title={t("environment.graphs.satisfaction.title")}
              description={t("environment.graphs.satisfaction.description")}
              data={satisfaction}
            />
          </div>
        </section>

        <section className="mb-16">
          <SectionHeader title={t("persona.title")} subtitle={t("persona.subtitle")} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarGraph
              title={t("persona.surface.title")}
              description={t("persona.surface.description")}
              data={surfaceDrives}
            />
            <BarGraph
              title={t("persona.innate.title")}
              description={t("persona.innate.description")}
              data={innateDrives}
            />
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">
                {t("persona.surface.top")}
              </p>
              <div className="flex flex-wrap gap-2">
                {topSurface.map((drive) => (
                  <span
                    key={drive.name}
                    className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600"
                  >
                    {drive.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">
                {t("persona.innate.top")}
              </p>
              <div className="flex flex-wrap gap-2">
                {topInnate.map((drive) => (
                  <span
                    key={drive.name}
                    className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600"
                  >
                    {drive.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md flex flex-col min-h-[420px]">
            <h3 className="text-base font-black text-slate-900 mb-2 tracking-tight">{t("jung.title")}</h3>
            <p className="text-[12px] text-slate-600 leading-relaxed font-semibold mb-4 line-clamp-3">
              {t("jung.prompt")}
            </p>
            <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="space-y-3">
                <JungCodeRow label={t("jung.predicted")} dims={jungOverallDims} standout />
                <div className="h-px bg-slate-200/70" />
                <JungCodeRow label={t("jung.surface")} dims={jungSurfaceDims} />
                <JungCodeRow label={t("jung.innate")} dims={jungInnateDims} />
              </div>
            </div>
            <div className="mt-auto">
              <Link
                href={withLocale("/reports/jung-analysis")}
                className="block w-full rounded-xl py-2.5 text-center text-[10px] font-black uppercase tracking-widest border bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
              >
                {t("jung.cta")}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md flex flex-col min-h-[420px]">
            <h3 className="text-base font-black text-slate-900 mb-2 tracking-tight">{t("drain.title")}</h3>
            <p className="text-[12px] text-slate-600 leading-relaxed font-semibold mb-4 line-clamp-3">
              {t("drain.description.intro")}{" "}
              <strong className="font-semibold text-slate-600">{t("drain.description.surface")}</strong>{" "}
              {t("drain.description.middle")}{" "}
              <strong className="font-semibold text-slate-600">{t("drain.description.innate")}</strong>{" "}
              {t("drain.description.rest")}
              <strong className="font-semibold text-slate-600">{t("drain.description.conflict")}</strong>{" "}
              {t("drain.description.tail")}
            </p>
            <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t("drain.totalDrain")}
                  </p>
                  <p className="mt-1 text-xl font-black text-rose-600">{totalDrain.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t("drain.totalAdaptation")}
                  </p>
                  <p className="mt-1 text-xl font-black text-emerald-600">{totalTransfer.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="mt-auto">
              <Link
                href={withLocale(isDrainUnlocked ? "/reports/drain-analysis" : "/payment?report=drain-analysis")}
                className={`block w-full rounded-xl py-2.5 text-center text-[10px] font-black uppercase tracking-widest border transition ${
                  isDrainUnlocked
                    ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                    : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                {isDrainUnlocked ? t("drain.cta") : t("locked.cta")}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md flex flex-col min-h-[420px]">
            <h3 className="text-base font-black text-slate-900 mb-2 tracking-tight">{t("relationship.title")}</h3>
            <p className="text-[12px] text-slate-600 leading-relaxed font-semibold mb-4 line-clamp-3">
              {t("relationship.description")}
            </p>
            <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {t("relationship.topDrives")}
              </p>
              <div className="space-y-2">
                {partnerTopDrives.map((drive) => (
                  <div key={drive.drive} className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-slate-700">{driveLabel(drive.drive)}</span>
                    <span className="font-bold text-slate-400">{drive.idealScore.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto">
              <Link
                href={withLocale(isRelationshipUnlocked ? "/reports/relationship" : "/payment?report=relationship")}
                className={`block w-full rounded-xl py-2.5 text-center text-[10px] font-black uppercase tracking-widest border transition ${
                  isRelationshipUnlocked
                    ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                    : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                {isRelationshipUnlocked ? t("relationship.cta") : t("locked.cta")}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md flex flex-col min-h-[420px]">
            <h3 className="text-base font-black text-slate-900 mb-2 tracking-tight">{t("profession.title")}</h3>
            <p className="text-[12px] text-slate-600 leading-relaxed font-semibold mb-4 line-clamp-3">
              {t("profession.description")}
            </p>
            <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {t("profession.preview")}
              </p>
              <div className="space-y-2">
                {topSurface.map((drive) => (
                  <div key={drive.name} className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-slate-700">{drive.label}</span>
                    <span className="font-bold text-slate-400">{drive.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto">
              <Link
                href={withLocale(
                  isProfessionUnlocked ? "/reports/profession-fit" : "/payment?report=profession-fit"
                )}
                className={`block w-full rounded-xl py-2.5 text-center text-[10px] font-black uppercase tracking-widest border transition ${
                  isProfessionUnlocked
                    ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                    : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                {isProfessionUnlocked ? t("profession.cta") : t("locked.cta")}
              </Link>
            </div>
          </div>
        </section>

        <footer className="flex flex-col items-center gap-4">
          <Link
            href={withLocale("/")}
            className="rounded-full border border-slate-300 px-6 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600"
          >
            {t("footer.back")}
          </Link>
          <p className="text-[11px] text-slate-400">{t("footer.note")}</p>
        </footer>
      </main>
    </div>
  );
}
