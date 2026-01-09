"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { AuthHeader } from "@/components/AuthHeader";
import PromoCodeInput from "@/components/PromoCodeInput";
import { MessageKey, configDescriptions } from "@/lib/dashboard/dashboard-constants";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getHomeMessage } from "@/lib/i18n/messages";
import { isAnonymousUser } from "@/lib/auth/isAnonymousUser";
import { hasReportAccessByKey } from "@/lib/access-logic";
import { usePersonaDerived } from "@/lib/persona-derived/usePersonaDerived";
import { driveNames } from "@/lib/core-utils/fit-core";
import { driveLabel as driveLabelForLocale } from "@/lib/i18n/drive-i18n";
import { computeIdealPartnerProfileUIModel } from "@/lib/relationship/relationship";

type JungSource = "surface" | "innate";

function jungLetter(
  pole: string | undefined,
  mapping: Record<string, string>,
  mixed: string
) {
  if (!pole) return mixed;
  return mapping[pole] ?? mixed;
}

function jungCodeOverall(jungAxes: any) {
  if (!jungAxes) return ["--", "--", "--", "--"];
  return [
    jungLetter(jungAxes.energy?.surface?.pole, { Introvert: "I", Extrovert: "E" }, "I/E"),
    jungLetter(jungAxes.perception?.innate?.pole, { Sensing: "S", Intuitive: "N" }, "N/S"),
    jungLetter(jungAxes.judgment?.surface?.pole, { Thinking: "T", Feeling: "F" }, "T/F"),
    jungLetter(jungAxes.orientation?.innate?.pole, { Judging: "J", Perspective: "P" }, "J/P"),
  ];
}

function jungCodeBySource(jungAxes: any, source: JungSource) {
  if (!jungAxes) return ["--", "--", "--", "--"];
  return [
    jungLetter(jungAxes.energy?.[source]?.pole, { Introvert: "I", Extrovert: "E" }, "I/E"),
    jungLetter(jungAxes.perception?.[source]?.pole, { Sensing: "S", Intuitive: "N" }, "N/S"),
    jungLetter(jungAxes.judgment?.[source]?.pole, { Thinking: "T", Feeling: "F" }, "T/F"),
    jungLetter(jungAxes.orientation?.[source]?.pole, { Judging: "J", Perspective: "P" }, "J/P"),
  ];
}

function JungDim({ value }: { value: string }) {
  const isMixed = value.includes("/");
  if (!isMixed) {
    return (
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-slate-200 text-2xl font-black font-mono text-current">
        {value}
      </span>
    );
  }

  const [a, b] = value.split("/").map((x) => x.trim());
  return (
    <span className="inline-flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-white border border-slate-200 font-mono text-current">
      <span className="text-[12px] leading-[12px] font-black">{a}</span>
      <span className="text-[12px] leading-[12px] font-black">{b}</span>
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
      <div className={`flex items-center gap-2 ${standout ? "text-indigo-700" : "text-slate-900"}`}>
        {dims.map((d, i) => (
          <span key={`${label}-${i}`} className={standout ? "ring-2 ring-indigo-200 rounded-lg" : undefined}>
            <JungDim value={d} />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const supabase = createBrowserSupabaseClient();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";
  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => getHomeMessage(locale, key, values),
    [locale]
  );
  const tr = useCallback(
    (key: string, fallbackEn: string, fallbackZh: string) => {
      const s = t(key);
      if (s === key) return locale === "zh" ? fallbackZh : fallbackEn;
      return s;
    },
    [t, locale]
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

  const [hoverKey, setHoverKey] = useState<MessageKey>("welcome");
  const [panelHeightPx, setPanelHeightPx] = useState<number>(320);

  const [profile, setProfile] = useState<any>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const {
    loading: derivedLoading,
    error: derivedError,
    derived,
    latestTests,
    missingTests,
  } = usePersonaDerived();

  const missingSet = useMemo(() => new Set(missingTests ?? []), [missingTests]);
  const testsIncomplete = useMemo(() => {
    if (derivedError === "missing_tests") return true;
    return !derived;
  }, [derivedError, derived]);

  const anyMissingCoreTests = useMemo(() => {
    return (
      missingSet.has("imposed") ||
      missingSet.has("surface") ||
      missingSet.has("innate") ||
      testsIncomplete
    );
  }, [missingSet, testsIncomplete]);

  const fetchData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let activeUser = user;
      if (!activeUser) {
        const { data: anonData } = await supabase.auth.signInAnonymously();
        activeUser = anonData?.user ?? null;
      }

      setIsAnonymous(isAnonymousUser(activeUser));

      if (!activeUser?.id) {
        setProfile(null);
        return;
      }

      const profileRes = await supabase
        .from("profiles")
        .select("*")
        .eq("id", activeUser.id)
        .maybeSingle();

      if (profileRes.error) {
        console.error("Profile fetch error:", profileRes.error);
        setProfile(null);
        return;
      }

      setProfile(profileRes.data ?? null);
    } catch (err) {
      console.error("Initialization Error:", err);
      setProfile(null);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const handleResize = () => {
      const height = window.innerHeight;
      const isPortrait = window.innerHeight > window.innerWidth;
      const fraction = isPortrait ? 0.25 : 0.28;
      const nextHeight = Math.round(Math.max(200, Math.min(height * fraction, 380)));
      setPanelHeightPx(nextHeight);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fetchData]);

  const active = useMemo(() => {
    return (configDescriptions as any)?.welcome ?? {
      titleKey: "dashboard.welcome.title",
      descriptionKey: "dashboard.welcome.description",
      color: "text-slate-900",
    };
  }, []);

  const hoverDescription = useMemo(() => {
    const fallbackKey = "welcome" as MessageKey;
    const fallback = (configDescriptions as any)?.[fallbackKey] ?? {
      descriptionKey: "dashboard.welcome.description",
    };
    const selected = (configDescriptions as any)?.[hoverKey] ?? fallback;
    return selected.descriptionKey;
  }, [hoverKey]);

  const driveLabel = useCallback(
    (drive: string) => driveLabelForLocale(drive as any, locale),
    [locale]
  );

  const topDrivesFromVector = useCallback(
    (vector: Record<string, number> | null | undefined, n = 3) => {
      if (!vector) return [];
      return [...driveNames]
        .map((name) => ({
          name,
          label: driveLabel(name),
          value: Number(vector[name] ?? 0),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, n);
    },
    [driveLabel]
  );

  const jungOverallDims = useMemo(
    () => jungCodeOverall(derived?.jung_axes),
    [derived?.jung_axes]
  );
  const jungSurfaceDims = useMemo(
    () => jungCodeBySource(derived?.jung_axes, "surface"),
    [derived?.jung_axes]
  );
  const jungInnateDims = useMemo(
    () => jungCodeBySource(derived?.jung_axes, "innate"),
    [derived?.jung_axes]
  );

  const topSurface = useMemo(
    () => topDrivesFromVector(derived?.surface_avg, 3),
    [derived?.surface_avg, topDrivesFromVector]
  );

  const instrumentPaths = derived?.instrument_paths ?? [];
  const totalDrain = useMemo(
    () => instrumentPaths.reduce((sum: number, p: any) => sum + Number(p?.pathDrain ?? 0), 0),
    [instrumentPaths]
  );
  const totalTransfer = useMemo(
    () =>
      instrumentPaths.reduce((sum: number, p: any) => sum + Number(p?.pathTransfer ?? 0), 0),
    [instrumentPaths]
  );

  const partnerTopDrives = useMemo(() => {
    if (!latestTests?.innate || !latestTests?.surface) return [];
    const model = computeIdealPartnerProfileUIModel({
      innateData: latestTests.innate,
      surfaceData: latestTests.surface,
    });
    return model?.rows?.slice(0, 3) ?? [];
  }, [latestTests]);

  const renderPreview = (reportKey: string) => {
    if (testsIncomplete || derivedLoading) return null;

    if (reportKey === "jung-analysis") {
      return (
        <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="space-y-3">
            <JungCodeRow
              label={tr("premium.preview.jung.overall", "Overall", "综合")}
              dims={jungOverallDims}
              standout
            />
            <div className="h-px bg-slate-200/70" />
            <JungCodeRow
              label={tr("premium.preview.jung.surface", "Surface", "表层")}
              dims={jungSurfaceDims}
            />
            <JungCodeRow
              label={tr("premium.preview.jung.innate", "Innate", "内在")}
              dims={jungInnateDims}
            />
          </div>
        </div>
      );
    }

    if (reportKey === "drain-analysis") {
      return (
        <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {tr("premium.preview.drain.totalDrain", "Total Drain", "总消耗")}
              </p>
              <p className="mt-1 text-xl font-black text-rose-600">{totalDrain.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {tr("premium.preview.drain.totalAdaptation", "Total Adaptation", "总适应")}
              </p>
              <p className="mt-1 text-xl font-black text-emerald-600">{totalTransfer.toFixed(2)}</p>
            </div>
          </div>
        </div>
      );
    }

    if (reportKey === "relationship") {
      return (
        <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            {tr("premium.preview.relationship.topDrives", "Ideal Partner Top Drives", "理想伴侣关键驱动力")}
          </p>
          <div className="space-y-2">
            {partnerTopDrives.map((d: any) => (
              <div key={d.drive} className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-slate-700">
                  {driveLabel(d.drive)}
                </span>
                <span className="font-bold text-slate-400">
                  {Number(d.idealScore ?? 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (reportKey === "profession-fit") {
      return (
        <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            {tr("premium.preview.profession.topSurface", "Your Top Surface Drives", "你的表层驱动力前列")}
          </p>
          <div className="space-y-2">
            {topSurface.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-slate-700">{d.label}</span>
                <span className="font-bold text-slate-400">{d.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  const personaSteps = [
    {
      key: "imposed",
      labelKey: "progress.steps.imposed.label",
      tagKey: "progress.steps.imposed.tag",
      logo: "/SurfacePersonaLogo.png?v=1",
      href: "/tests/imposed-persona",
    },
    {
      key: "surface",
      labelKey: "progress.steps.surface.label",
      tagKey: "progress.steps.surface.tag",
      logo: "/ImposedPersonaLogo.png?v=1",
      href: "/tests/surface-persona",
    },
    {
      key: "innate",
      labelKey: "progress.steps.innate.label",
      tagKey: "progress.steps.innate.tag",
      logo: "/InnatePersonaLogo.png?v=1",
      href: "/tests/innate-persona",
    },
    {
      key: "report",
      labelKey: "progress.steps.report.label",
      tagKey: "progress.steps.report.tag",
      logo: "/ReportLogo.jpg?v=2",
      href: "/reports/overall",
    },
  ] as const;

  const premiumReports = [
    {
      key: "jung-analysis",
      labelKey: "premium.cards.jung.label",
      tagKey: "premium.cards.jung.tag",
      descriptionKey: "premium.cards.jung.description",
      isFree: true,
    },
    {
      key: "relationship",
      labelKey: "premium.cards.relationship.label",
      tagKey: "premium.cards.relationship.tag",
      descriptionKey: "premium.cards.relationship.description",
      accessField: "has_access_report_1",
    },
    {
      key: "drain-analysis",
      labelKey: "premium.cards.drain.label",
      tagKey: "premium.cards.drain.tag",
      descriptionKey: "premium.cards.drain.description",
      accessField: "has_access_report_2",
    },
    {
      key: "profession-fit",
      labelKey: "premium.cards.profession.label",
      tagKey: "premium.cards.profession.tag",
      descriptionKey: "premium.cards.profession.description",
      accessField: "has_access_report_3",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-600 font-sans flex flex-col relative">
      <div className="relative z-10 flex flex-col min-h-screen">
      <AuthHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 flex-grow">
        {/* DYNAMIC TOP PANEL */}
        <section
          className="mb-10 rounded-2xl bg-white/70 backdrop-blur-md p-8 shadow-sm border border-slate-200/60 transition-all duration-500 flex flex-col justify-center overflow-hidden"
          style={{ height: `${panelHeightPx}px` }}
        >
          <div className="flex h-full flex-col justify-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
              {t("dashboard.header")}
            </span>
            <h2
              className={`text-3xl font-bold mb-3 transition-colors duration-500 ${
                active?.color ?? "text-slate-900"
              }`}
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {t(active.titleKey)}
            </h2>
            <p
              className="text-slate-500 leading-relaxed max-w-2xl text-sm md:text-base font-medium"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {t(active.descriptionKey)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={withLocale("/tester")}
                className="rounded-full bg-emerald-600 text-white px-4 py-2 text-[11px] font-black uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-colors"
              >
                {t("dashboard.tester.cta")}
              </Link>
              <span className="text-[11px] font-medium text-slate-500">
                {t("dashboard.tester.note")}
              </span>
            </div>
          </div>
        </section>

        {/* CORE PERSONA PROGRESS */}
        <section className="mb-14">
          <div className="flex items-center mb-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 mr-4">
              {t("progress.title")}
            </h3>
            <div className="h-[1px] bg-slate-200 flex-1"></div>
          </div>
          <div
            className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm relative"
            onMouseLeave={() => setHoverKey("welcome")}
            style={{ minHeight: `${panelHeightPx}px` }}
          >
            <div className="hidden md:block absolute left-10 right-10 top-10 h-px bg-slate-200"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
              {personaSteps.map((step, idx) => {
                const stepMissing =
                  step.key === "imposed"
                    ? missingSet.has("imposed")
                    : step.key === "surface"
                    ? missingSet.has("surface")
                    : step.key === "innate"
                    ? missingSet.has("innate")
                    : false;

                const ringClass = stepMissing
                  ? "border-rose-300 bg-rose-50"
                  : "border-slate-200 bg-white";
                const textClass = stepMissing ? "text-rose-600" : "text-slate-400";

                return (
                  <Link
                    key={step.key}
                    href={withLocale(step.href)}
                    onMouseEnter={() => setHoverKey(step.key)}
                    className="group flex flex-col items-center text-center"
                  >
                    <div
                      className={`relative z-10 h-12 w-12 rounded-full border shadow-sm flex items-center justify-center transition group-hover:scale-105 ${ringClass}`}
                    >
                      <Image
                        src={step.logo}
                        alt={t(step.labelKey)}
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    </div>
                    <div className={`mt-3 text-[9px] font-black uppercase tracking-[0.18em] ${textClass}`}>
                      {t("progress.step", { number: idx + 1 })}
                    </div>
                    <div className="text-[12px] font-semibold text-slate-700">{t(step.tagKey)}</div>
                    <div className="text-sm font-black text-slate-900">{t(step.labelKey)}</div>
                    {stepMissing ? (
                      <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-rose-600">
                        Complete this test
                      </div>
                    ) : null}
                  </Link>
                );
              })}
            </div>
            <div className="mt-6 text-[12px] text-slate-500 font-medium">
              {t(hoverDescription)}
            </div>
          </div>
        </section>

        {/* PREMIUM ANALYSIS SECTION */}
        <section className="mb-14">
          <div className="flex items-center mb-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500/60 mr-4">
              {t("premium.title")}
            </h3>
            <div className="h-[1px] bg-slate-200 flex-1"></div>
          </div>
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
              {premiumReports.map((report) => {
                const needsUpgrade = report.key === "jung-analysis" && isAnonymous;
                const isFree = report.isFree === true;
                const isUnlocked =
                  isFree || (report.key ? hasReportAccessByKey(profile, report.key) : false);
                const href = needsUpgrade
                  ? `/upgrade`
                  : isFree || isUnlocked
                  ? `/reports/${report.key}`
                  : `/payment?report=${report.key}`;

                return (
                  <Link
                    key={report.key}
                    href={withLocale(href)}
                    className="w-full max-w-[340px] rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md flex flex-col min-h-[420px]"
                    onMouseEnter={() => setHoverKey("welcome")}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700">
                        {t(report.tagKey)}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                          isFree ? "text-emerald-700" : isUnlocked ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        {isFree ? t("premium.status.free") : isUnlocked ? t("premium.status.granted") : t("premium.status.locked")}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 mb-2 tracking-tight">
                      {t(report.labelKey)}
                    </h4>
                    <p className="text-[12px] text-slate-600 leading-relaxed font-semibold mb-4 line-clamp-3">
                      {t(report.descriptionKey)}
                    </p>
                    {renderPreview(report.key)}

                    <div className="mt-auto">
                      <div
                        className={`w-full rounded-xl py-2.5 text-center text-[10px] font-black uppercase tracking-widest border transition ${
                          isFree || isUnlocked
                            ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                            : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        }`}
                      >
                        {needsUpgrade
                          ? t("premium.cta.saveAccount")
                          : isFree
                          ? t("premium.cta.free")
                          : isUnlocked
                          ? t("premium.cta.open")
                          : t("premium.cta.unlock")}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* PROMO REDEMPTION & BALANCE SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              {t("promo.balance")}
            </p>
            <p className="text-3xl font-bold text-slate-900">${(profile?.store_credits || 0).toFixed(2)}</p>
          </div>
          <div className="lg:col-span-2">
            <PromoCodeInput onRefresh={fetchData} />
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">{t("footer.brand")}</h4>
              <p className="text-[12px] text-slate-500 leading-relaxed">{t("footer.blurb")}</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">{t("footer.legal")}</h4>
              <nav className="flex flex-col space-y-2 text-[12px]">
                <Link href={withLocale("/terms")} className="hover:text-emerald-800 transition-colors">
                  {t("footer.terms")}
                </Link>
                <Link href={withLocale("/privacy")} className="hover:text-emerald-800 transition-colors">
                  {t("footer.privacy")}
                </Link>
              </nav>
            </div>
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">{t("footer.support")}</h4>
              <p className="text-[12px] text-slate-500">{t("footer.contact")}</p>
              <a
                href="mailto:support@persona-drive-secrets.com"
                className="text-[12px] font-bold text-emerald-700 underline underline-offset-4"
              >
                support@persona-drive-secrets.com
              </a>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-[10px] text-slate-400 uppercase tracking-widest font-black">
            <p>
              {t("footer.copyright", {
                year: new Date().getFullYear(),
              })}
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
