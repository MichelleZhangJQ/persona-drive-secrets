// app/reports/profession-fit/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";
import { usePersonaDerived } from "@/lib/persona-derived/usePersonaDerived";
import { ensurePersonaDerived } from "@/lib/persona-derived/persona-derived";
import { makeTr } from "@/lib/i18n/simple-tr";
import pfEn from "@/messages/profession-fit/en.json";
import pfZh from "@/messages/profession-fit/zh.json";
import { driveLabel } from "@/lib/i18n/drive-i18n";
import { hasReportAccess } from "@/lib/access-logic";

import { driveNames } from "@/lib/core-utils/fit-core";
import type { DriveName, DriveVector, FitResult, ProfessionSubtype } from "@/lib/core-utils/fit-core";
import { rankProfessionSubtypes, simulateCustomJobFit } from "@/lib/professions/profession-fit";

// ✅ use the same mismatchAdjusted logic (no mismatchRaw)
import { computeMismatchFromEffectiveSurface } from "@/lib/core-utils/fit-core";

// Expected shape: [{ major: string, subtypes: [{ name: string, drives: { ... } }] }]
import { driveProfiles, getMajorLabel, getSubtypeLabel } from "@/lib/professions/driveProfiles";

import {
  Loader2,
  Lock,
  LayoutDashboard,
  ChevronRight,
  Briefcase,
  Sparkles,
  ArrowUpCircle,
  SlidersHorizontal,
} from "lucide-react";

const MAX_MAJOR_SELECTIONS = 10;

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}
function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}
function fmt(x: number, digits = 2) {
  return Number.isFinite(x) ? x.toFixed(digits) : "0.00";
}
function emptyDriveVector(fill = 0): DriveVector {
  return driveNames.reduce((acc, d) => {
    (acc as any)[d] = fill;
    return acc;
  }, {} as DriveVector);
}

function flattenProfilesToSubtypes(): ProfessionSubtype[] {
  const out: ProfessionSubtype[] = [];
  (driveProfiles || []).forEach((majorObj: any) => {
    const major = majorObj.major;
    (majorObj.subtypes || []).forEach((s: any) => {
      out.push({
        major,
        name: s.name,
        drives: s.drives,
      });
    });
  });
  return out;
}

type Mode = "aspiredMatch" | "jobMatch";

/**
 * Match score on 0..5 scale (5 best).
 * We compute deficit = Σ |eff(d)-demand(d)| weighted by demand(d) (fallback equal weights if demand sum=0).
 * Then match = 5 - deficit, clamped.
 *
 * ✅ For "Job Match" => eff = surfaceAdjusted
 * ✅ For "Aspired Match" => eff = surfaceAdjustedAspired
 */
function computeMatchScoreFromVectors(params: { eff: DriveVector; demand: DriveVector }): number {
  const { eff, demand } = params;

  const ds = driveNames;
  const denom = ds.reduce((acc, d) => acc + n(demand[d]), 0);
  const equalW = 1 / ds.length;

  let deficit = 0;
  ds.forEach((d) => {
    const w = denom > 0 ? n(demand[d]) / denom : equalW;
    deficit += Math.abs(n(eff[d]) - n(demand[d])) * w;
  });

  return clamp(5 - deficit, 0, 5);
}

function getMatchScoreByMode(r: FitResult, mode: Mode): number {
  const demand = (r as any).profDemand as DriveVector;

  const eff =
    mode === "aspiredMatch"
      ? ((r as any).surfaceAdjustedAspired as DriveVector)
      : ((r as any).surfaceAdjusted as DriveVector);

  if (!demand || !eff) return 0;

  return computeMatchScoreFromVectors({ eff, demand });
}

export default function ProfessionFitReport() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const params = useParams();
  const locale = typeof (params as any)?.locale === "string" ? ((params as any).locale as string) : "en";
  const tr = useMemo(() => makeTr({ en: pfEn, zh: pfZh, locale }), [locale]);

  const withLocale = (href: string) => {
    if (!href) return `/${locale}`;
    if (href.startsWith("http") || href.startsWith("mailto:")) return href;
    if (href.startsWith("/")) return `/${locale}${href}`;
    return `/${locale}/${href}`;
  };

  const { loading: derivedLoading, error: derivedError, latestTests, missingTests } = usePersonaDerived();

  const [hasAccess, setHasAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const [statusDetail, setStatusDetail] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("aspiredMatch");

  const [user, setUser] = useState<any>(null);
  const [innateData, setInnateData] = useState<any>(null);
  const [surfaceData, setSurfaceData] = useState<any>(null);
  const [imposedData, setImposedData] = useState<any>(null);

  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [results, setResults] = useState<FitResult[]>([]);
  const [top, setTop] = useState<FitResult[]>([]);
  const [active, setActive] = useState<FitResult | null>(null);

  const [customJobName, setCustomJobName] = useState(() => tr("professionFit.custom.defaultJobName"));
  const [customDemand, setCustomDemand] = useState<Record<DriveName, number>>(() => {
    const v = emptyDriveVector(0);
    driveNames.forEach((d) => ((v as any)[d] = 2));
    return v as any;
  });
  const [customResult, setCustomResult] = useState<FitResult | null>(null);

  const allSubtypes = useMemo(() => flattenProfilesToSubtypes(), []);
  const majors = useMemo(() => (driveProfiles || []).map((x: any) => x.major), []);
  const driveDef = (d: DriveName) => tr(`professionFit.driveDef.${d}`);
  const renderHtml = (text: string) => <span dangerouslySetInnerHTML={{ __html: text }} />;
  const majorLabel = (major: string) =>
    major === "Custom" ? tr("professionFit.custom.majorLabel") : getMajorLabel(major, locale);
  const subtypeLabel = (major: string, name: string) => getSubtypeLabel(major, name, locale);
  const driveLabelLocal = (d: DriveName) => driveLabel(d, locale);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;
        setUser(user);
        if (!user) {
          setAccessLoading(false);
          return;
        }

        const profileRes = await supabase
          .from("profiles")
          .select("has_access_report_3, report_3_expires_at")
          .eq("id", user.id)
          .maybeSingle();

        if (!hasReportAccess(profileRes.data, 3)) {
          setHasAccess(false);
          setAccessLoading(false);
          router.replace(withLocale("/payment?report=profession-fit"));
          return;
        }
        setHasAccess(true);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setAccessLoading(false);
      }
    }
    fetchData();
    return () => {
      active = false;
    };
  }, [supabase, router, locale]);

  useEffect(() => {
    if (!latestTests) {
      setInnateData(null);
      setSurfaceData(null);
      setImposedData(null);
      return;
    }

    setInnateData(latestTests.innate);
    setSurfaceData(latestTests.surface);
    setImposedData(latestTests.imposed);
  }, [latestTests]);

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
        setStatusKey("professionFit.status.upsertFailed");
        setStatusDetail(result?.error ?? null);
        return;
      }

      if (result?.reasons?.length) {
        setStatusKey("professionFit.status.recomputed");
        setStatusDetail(null);
        return;
      }

      setStatusKey("professionFit.status.cached");
      setStatusDetail(null);
    };

    void loadStatus();
    return () => {
      active = false;
    };
  }, [supabase]);

  // ✅ rerank whenever selected majors OR mode changes
  // ✅ always use mismatchAdjusted (no mismatchRaw)
  useEffect(() => {
    if (!hasAccess) return;
    if (!innateData || !surfaceData || !imposedData) return;

    if (selectedMajors.length === 0) {
      setResults([]);
      setTop([]);
      setActive(null);
      return;
    }

    const subtypesForSelection = allSubtypes.filter((s) => selectedMajors.includes(s.major));

    const base = rankProfessionSubtypes({
      user: { innateData, surfaceData, imposedData },
      subtypes: subtypesForSelection,
    }).results;

    // ✅ overwrite mismatchAdjusted based on which effective surface we’re using
    const modeApplied = base.map((r) => {
      const profDemand = (r as any).profDemand as DriveVector;

      const effectiveSurface =
        mode === "aspiredMatch"
          ? ((r as any).surfaceAdjustedAspired as DriveVector)
          : ((r as any).surfaceAdjusted as DriveVector);

      const { mismatch, totalDeficit } = computeMismatchFromEffectiveSurface({
        effectiveSurface,
        profDemand,
        weightMode: "profDemand",
      });

      return {
        ...r,
        mismatchAdjusted: mismatch as any,
        totalMismatchAdjusted: totalDeficit as any,
      } as FitResult;
    });

    const sorted = modeApplied
      .slice()
      .sort((a, b) => {
        const ma = getMatchScoreByMode(a, mode);
        const mb = getMatchScoreByMode(b, mode);
        if (mb !== ma) return mb - ma;

        // tie-breaker: lower drain is better
        const da = n((a as any).totalDrainedEnergy);
        const db = n((b as any).totalDrainedEnergy);
        return da - db;
      });

    const top10 = sorted.slice(0, 10);

    setResults(sorted);
    setTop(top10);
    setActive(top10?.[0] ?? sorted?.[0] ?? null);
  }, [hasAccess, innateData, surfaceData, imposedData, selectedMajors, allSubtypes, mode]);

  const debugTarget = active;

  const toggleMajor = (m: string) => {
    setSelectedMajors((prev) => {
      const exists = prev.includes(m);
      if (exists) return prev.filter((x) => x !== m);
      if (prev.length >= MAX_MAJOR_SELECTIONS) return prev;
      return [...prev, m];
    });
  };

  const runCustom = () => {
    if (!innateData || !surfaceData || !imposedData) return;

    const r = simulateCustomJobFit({
      user: { innateData, surfaceData, imposedData },
      jobName: customJobName || tr("professionFit.custom.defaultJobName"),
      jobDemand: customDemand,
      major: "Custom",
    });

    setCustomResult(r);
    setActive(r);
  };

  const isLoading = accessLoading || derivedLoading;

  if (isLoading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest italic">{tr("professionFit.loading.title")}</p>
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-400">
        <Lock className="mb-4" size={32} />
        <div className="italic font-black uppercase tracking-widest">{tr("professionFit.auth.signIn")}</div>
      </div>
    );

  if (!hasAccess)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center italic font-black text-slate-400 uppercase tracking-widest bg-white">
        <Lock className="mb-4" size={32} />
        {tr("professionFit.auth.accessRestricted")}
      </div>
    );

  if (derivedError === "missing_tests") {
    const missing = new Set(missingTests ?? ["imposed", "surface", "innate"]);
    return (
      <div className="min-h-screen bg-[#FDFDFD]">
        <AuthHeader />
        <main className="max-w-3xl mx-auto px-6 py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <h1 className="text-2xl font-black text-slate-900">{tr("professionFit.missingTests.title")}</h1>
            <p className="mt-3 text-sm text-slate-600 font-medium">
              {tr("professionFit.missingTests.subtitle")}
            </p>
            <div className="mt-6 flex flex-col md:flex-row gap-3 justify-center">
              {missing.has("imposed") ? (
                <Link
                  href={withLocale("/tests/imposed-persona")}
                  className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
                >
                  {tr("professionFit.missingTests.imposed")}
                </Link>
              ) : null}
              {missing.has("surface") ? (
                <Link
                  href={withLocale("/tests/surface-persona")}
                  className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
                >
                  {tr("professionFit.missingTests.surface")}
                </Link>
              ) : null}
              {missing.has("innate") ? (
                <Link
                  href={withLocale("/tests/innate-persona")}
                  className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
                >
                  {tr("professionFit.missingTests.innate")}
                </Link>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (derivedError)
    return (
      <div className="min-h-screen bg-[#FDFDFD]">
        <AuthHeader />
        <main className="max-w-3xl mx-auto px-6 py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600">
            <h1 className="text-2xl font-black text-slate-900">{tr("professionFit.errors.unavailableTitle")}</h1>
            <p className="mt-3 text-sm font-medium">{tr("professionFit.errors.unavailableBody")}</p>
          </div>
        </main>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <AuthHeader />
      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <section className="mb-16">
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-black uppercase italic text-slate-900 leading-none">
                {tr("professionFit.header.titleStart")} <span className="text-indigo-600">{tr("professionFit.header.titleAccent")}</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">
                {tr("professionFit.header.subtitle")}
              </p>
              {statusKey ? (
                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                  {tr(statusKey)}
                  {statusDetail
                    ? ` — ${statusDetail}`
                    : statusKey === "professionFit.status.upsertFailed"
                      ? ` — ${tr("professionFit.status.upsertDetailFallback")}`
                      : ""}
                </p>
              ) : null}
            </div>

            <div className="flex justify-center">
              <Link
                href={withLocale("/")}
                className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
              >
                <LayoutDashboard size={16} /> {tr("professionFit.header.dashboardCta")}{" "}
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </header>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 md:p-10">
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-900 mb-4 italic flex items-center gap-2">
              <Sparkles size={16} /> {tr("professionFit.about.title")}
            </h3>
            <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
              {renderHtml(tr("professionFit.about.body"))}
            </p>

            <p className="text-sm text-indigo-900/80 leading-relaxed font-medium mt-4">
              {renderHtml(tr("professionFit.about.note"))}
            </p>
          </div>
        </section>

        {/* Major selection */}
        <section className="mb-12">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-slate-700" />
              <h2 className="text-lg font-black uppercase italic text-slate-900">
                {tr("professionFit.majors.title")}
              </h2>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {tr("professionFit.majors.selected", { count: selectedMajors.length, max: MAX_MAJOR_SELECTIONS })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {majors.map((m: string) => {
              const on = selectedMajors.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => toggleMajor(m)}
                  className={`px-4 py-2 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all ${
                    on
                      ? "bg-slate-900 text-white border-slate-900 shadow"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {majorLabel(m)}
                </button>
              );
            })}
          </div>
        </section>

        {/* Results */}
        {selectedMajors.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 text-center text-slate-500">
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-slate-700" />
              <h2 className="text-lg font-black uppercase italic text-slate-900">
                {tr("professionFit.majors.emptyTitle")}
              </h2>
            </div>
            <p className="text-sm mt-3 text-slate-600 font-medium">
              {tr("professionFit.majors.emptyBody")}
            </p>
          </div>
        ) : (
          <>
            {/* Mode selector */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-lg font-black uppercase italic text-slate-900">{tr("professionFit.mode.title")}</div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setMode("aspiredMatch")}
                  className={`px-4 py-2 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all ${
                    mode === "aspiredMatch"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {tr("professionFit.mode.aspired")}
                </button>

                <button
                  onClick={() => setMode("jobMatch")}
                  className={`px-4 py-2 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all ${
                    mode === "jobMatch"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {tr("professionFit.mode.job")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left: ranking list */}
              <div className="lg:col-span-2 space-y-8">
                {/* Top 10 */}
                <div className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle size={18} className="text-emerald-600" />
                      <div className="text-[11px] font-black uppercase tracking-widest text-emerald-700">
                        {tr("professionFit.top10.title")}
                      </div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {tr("professionFit.top10.subtitle", { count: results.length })}
                    </div>
                  </div>

                  <div className="mb-4 text-[10px] text-slate-500 font-medium">
                    {renderHtml(tr("professionFit.top10.scoreNote"))}
                  </div>

                  <div className="space-y-3">
                    {top.map((r) => {
                      const match = getMatchScoreByMode(r, mode);
                      return (
                        <button
                          key={`${r.profession.major}-${r.profession.name}`}
                          onClick={() => setActive(r)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all ${
                            active?.profession.name === r.profession.name
                              ? "border-emerald-400 bg-emerald-50/40"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-black text-slate-900">
                                {subtypeLabel(r.profession.major, r.profession.name)}
                              </div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                {majorLabel(r.profession.major)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {tr("professionFit.active.matchShort")}
                              </div>
                              <div className="text-sm font-black text-slate-900">{fmt(match, 2)}</div>
                            </div>
                          </div>


                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right: active detail */}
              <div className="lg:col-span-3">
                {active ? (
                  <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
                      FIT
                    </div>

                    <div className="flex items-start justify-between gap-6 relative z-10">
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase italic leading-none">
                          {subtypeLabel(active.profession.major, active.profession.name)}
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3">
                          {majorLabel(active.profession.major)}
                        </p>
                      </div>

                        <div className="text-right">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {tr("professionFit.active.matchLabel")}
                          </div>
                          <div className="text-3xl font-black text-indigo-600">{fmt(getMatchScoreByMode(active, mode), 2)}</div>

                        </div>
                      </div>

                    <div className="mt-8 bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
                      <div className="text-[11px] font-black uppercase tracking-widest text-indigo-900 italic mb-2">
                        {tr("professionFit.active.interpretationTitle")}
                      </div>
                      <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                        {renderHtml(
                          tr("professionFit.active.interpretationBody", {
                            effective:
                              mode === "aspiredMatch"
                                ? "SurfaceAdjustedAspired (Aspired Job Match)"
                                : "SurfaceAdjusted (Job Match)",
                          })
                        )}
                      </p>
                    </div>

                    {/* Drive table */}
                    {debugTarget && (
                      <div className="mt-6 bg-white border border-slate-200 rounded-3xl p-6">
                        <div className="text-[11px] font-black uppercase tracking-widest text-slate-700 mb-2">
                          {tr("professionFit.table.title")}
                        </div>

                        <div className="text-[9px] text-slate-600 font-medium mb-4 leading-relaxed">
                          {renderHtml(
                            tr("professionFit.table.legend", {
                              diffLabel:
                                mode === "aspiredMatch"
                                  ? tr("professionFit.table.diffAspired")
                                  : tr("professionFit.table.diffJob"),
                            })
                          )}
                        </div>

                        <div className="grid grid-cols-5 gap-2 text-[9px] font-black uppercase tracking-wide text-slate-400 mb-2">
                          <div>{tr("professionFit.table.colDrive")}</div>
                          <div className="text-right">{tr("professionFit.table.colAdjSurface")}</div>
                          <div className="text-right">{tr("professionFit.table.colSurfaceAspired")}</div>
                          <div className="text-right">{tr("professionFit.table.colJobDemand")}</div>
                          <div className="text-right">{tr("professionFit.table.colDiff")}</div>
                        </div>

                        <div className="space-y-2">
                          {driveNames.map((d) => {
                            const surfaceAdjusted = clamp(n((debugTarget as any).surfaceAdjusted?.[d]), 0, 5);
                            const surfaceAspired = clamp(n((debugTarget as any).surfaceAdjustedAspired?.[d]), 0, 5);

                            const jobDemand = clamp(n((debugTarget as any).profDemand?.[d]), 0, 5);

                            // ✅ Diff changes with mode (this was the bug)
                            const effectiveUsed = mode === "aspiredMatch" ? surfaceAspired : surfaceAdjusted;
                            const diff = effectiveUsed - jobDemand;

                            return (
                              <div
                                key={d}
                                className="grid grid-cols-5 gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3"
                              >
                                <div className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                                  {driveLabelLocal(d)}
                                </div>

                                <div className="text-right text-[11px] font-black text-slate-900">{fmt(surfaceAdjusted, 3)}</div>
                                <div className="text-right text-[11px] font-black text-slate-900">{fmt(surfaceAspired, 3)}</div>
                                <div className="text-right text-[11px] font-black text-slate-900">{fmt(jobDemand, 3)}</div>

                                <div
                                  className={`text-right text-[11px] font-black ${
                                    diff < 0 ? "text-rose-600" : "text-emerald-700"
                                  }`}
                                >
                                  {fmt(diff, 3)}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* ✅ Custom job inquiry under table */}
                        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-3xl p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <SlidersHorizontal size={18} className="text-slate-700" />
                            <div className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                              {tr("professionFit.custom.title")}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <input
                              value={customJobName}
                              onChange={(e) => setCustomJobName(e.target.value)}
                              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400"
                              placeholder={tr("professionFit.custom.jobNamePlaceholder")}
                            />

                            <div className="space-y-3">
                              {driveNames.map((d) => (
                                <div key={d} className="bg-white border border-slate-200 rounded-2xl p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                                      {driveLabelLocal(d)}
                                    </div>
                                    <div className="text-[11px] font-black text-slate-900">{customDemand[d]}</div>
                                  </div>
                                  <input
                                    type="range"
                                    min={0}
                                    max={5}
                                    step={1}
                                    value={customDemand[d]}
                                    onChange={(e) =>
                                      setCustomDemand((prev) => ({
                                        ...(prev as any),
                                        [d]: clamp(Number(e.target.value), 0, 5),
                                      }))
                                    }
                                    className="w-full mt-3"
                                  />
                                  <div className="text-[11px] text-slate-500 font-medium mt-2">{driveDef(d)}</div>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={runCustom}
                              className="w-full bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase italic text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow"
                            >
                              {tr("professionFit.custom.run")}
                            </button>

                            {customResult && (
                              <div className="bg-white border border-indigo-200 rounded-2xl p-4">
                                <div className="text-sm font-black text-slate-900">
                                  {subtypeLabel(customResult.profession.major, customResult.profession.name)}
                                </div>
                                <div className="text-[11px] text-slate-600 font-medium mt-2">
                                  {tr("professionFit.active.matchShort")}:{" "}
                                  <strong>{fmt(getMatchScoreByMode(customResult, mode), 2)}</strong>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500">
                    <div className="text-[11px] font-black uppercase tracking-widest">
                      {tr("professionFit.noSelection.title")}
                    </div>
                    <p className="text-sm mt-3 text-slate-600 font-medium">
                      {tr("professionFit.noSelection.body")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <section className="mt-20">
          <div className="bg-slate-100 border border-slate-200 rounded-[3rem] p-10 md:p-14 text-slate-900 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl font-black uppercase italic leading-none">
                {tr("professionFit.footer.titleStart")}{" "}
                <span className="text-indigo-600">{tr("professionFit.footer.titleAccent")}</span>
              </h2>
              <p className="text-sm font-medium leading-relaxed text-slate-600">
                {tr("professionFit.footer.body")}{" "}
                <Link href={withLocale("/reports/drain-analysis")} className="font-black text-indigo-600 hover:underline">
                  {tr("professionFit.footer.drainCta")}
                </Link>
              </p>

              <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 italic">
                  {tr("professionFit.footer.status")}
                </p>
                <Link
                  href={withLocale("/")}
                  className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full font-black uppercase italic text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
                >
                  <LayoutDashboard size={18} /> {tr("professionFit.footer.dashboardCta")}{" "}
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
