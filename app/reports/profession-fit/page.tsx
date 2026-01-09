// app/reports/profession-fit/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";

import { driveNames } from "@/lib/core-utils/fit-core";
import type { DriveName, DriveVector, FitResult, ProfessionSubtype } from "@/lib/core-utils/fit-core";
import { rankProfessionSubtypes, simulateCustomJobFit } from "@/lib/professions/profession-fit";

// ✅ use the same mismatchAdjusted logic (no mismatchRaw)
import { computeMismatchFromEffectiveSurface } from "@/lib/core-utils/fit-core";

// Expected shape: [{ major: string, subtypes: [{ name: string, drives: { ... } }] }]
import { driveProfiles } from "@/lib/professions/driveProfiles";

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

const driveDefinitions: Record<string, string> = {
  Exploration: "The drive for seeking new experiences, knowledge, and variety in your environment.",
  Achievement: "The drive for accomplishing goals, overcoming obstacles, and attaining mastery.",
  Dominance: "The drive for influence, control, and asserting your will over your surroundings.",
  Pleasure: "The drive for immediate gratification, comfort, and sensory enjoyment.",
  Care: "The drive for nurturing others, providing protection, and maintaining emotional bonds.",
  Affiliation: "Thre drive for social belonging, collaboration, and being part of a group.",
  Value: "Thre drive for satisfying the moral and social standards of your internal compass.",
};

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

  const ds = driveNames as DriveName[];
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

  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const [mode, setMode] = useState<Mode>("aspiredMatch");

  const [user, setUser] = useState<any>(null);
  const [innateData, setInnateData] = useState<any>(null);
  const [surfaceData, setSurfaceData] = useState<any>(null);
  const [imposedData, setImposedData] = useState<any>(null);

  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [results, setResults] = useState<FitResult[]>([]);
  const [top, setTop] = useState<FitResult[]>([]);
  const [active, setActive] = useState<FitResult | null>(null);

  const [customJobName, setCustomJobName] = useState("My Dream Job Drive Distribution");
  const [customDemand, setCustomDemand] = useState<Record<DriveName, number>>(() => {
    const v = emptyDriveVector(0);
    (driveNames as DriveName[]).forEach((d) => ((v as any)[d] = 2));
    return v as any;
  });
  const [customResult, setCustomResult] = useState<FitResult | null>(null);

  const allSubtypes = useMemo(() => flattenProfilesToSubtypes(), []);
  const majors = useMemo(() => (driveProfiles || []).map((x: any) => x.major), []);

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);
        if (!user) {
          setLoading(false);
          return;
        }

        const [profileRes, innateRes, surfaceRes, imposedRes] = await Promise.all([
          supabase.from("profiles").select("has_access_report_1").eq("id", user.id).single(),
          supabase.from("innate-persona").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("surface-persona").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("imposed-persona").select("*").eq("user_id", user.id).maybeSingle(),
        ]);

        if (!profileRes.data?.has_access_report_1) {
          setHasAccess(false);
          setLoading(false);
          return;
        }
        setHasAccess(true);

        if (!innateRes.data || !surfaceRes.data || !imposedRes.data) {
          setLoading(false);
          return;
        }

        setInnateData(innateRes.data);
        setSurfaceData(surfaceRes.data);
        setImposedData(imposedRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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
      jobName: customJobName || "Custom Job",
      jobDemand: customDemand,
      major: "Custom",
    });

    setCustomResult(r);
    setActive(r);
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest italic">Simulating Fit Profiles...</p>
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-400">
        <Lock className="mb-4" size={32} />
        <div className="italic font-black uppercase tracking-widest">Please sign in</div>
      </div>
    );

  if (!hasAccess)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center italic font-black text-slate-400 uppercase tracking-widest bg-white">
        <Lock className="mb-4" size={32} />
        Access Restricted
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
                Profession <span className="text-indigo-600">Fit</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">
                Matching your drive structure to real-world job demands
              </p>
            </div>

            <div className="flex justify-center">
              <Link
                href="/"
                className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
              >
                <LayoutDashboard size={16} /> Dashboard{" "}
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </header>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 md:p-10">
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-900 mb-4 italic flex items-center gap-2">
              <Sparkles size={16} /> About this Report
            </h3>
            <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
              This report simulates fit using your (1) surface persona, (2) innate persona, (3) competence/self-interest,
              and (4) instrumentation routes. You can view match in two ways:
              <strong>  Aspired Job Match</strong> (uses <strong>SurfaceAdjustedAspired</strong>) and
              <strong> Job Match</strong> (uses <strong>SurfaceAdjusted</strong>).
              Both scenarios consider your energy drains. Aspired job match also considers what aspects you value, 
              which may make a difference in the best matched top occupations given your current 
              drive profiles and environmental adaptive patterns.

            </p>

            <p className="text-sm text-indigo-900/80 leading-relaxed font-medium mt-4">
              <strong>Note: these patterns change over time. Re-evaluate periodically.</strong>
            </p>
          </div>
        </section>

        {/* Major selection */}
        <section className="mb-12">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-slate-700" />
              <h2 className="text-lg font-black uppercase italic text-slate-900">
                Click up to 10 occupational majors you’re considering for your career path.
              </h2>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Selected: {selectedMajors.length}/10
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
                  {m}
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
              <h2 className="text-lg font-black uppercase italic text-slate-900">Select majors to run the simulation.</h2>
            </div>
            <p className="text-sm mt-3 text-slate-600 font-medium">
              You’ll get top 10 fits and a detailed breakdown you can click into.
            </p>
          </div>
        ) : (
          <>
            {/* Mode selector */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-lg font-black uppercase italic text-slate-900">Choose an option:</div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setMode("aspiredMatch")}
                  className={`px-4 py-2 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all ${
                    mode === "aspiredMatch"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  Current aspired job match
                </button>

                <button
                  onClick={() => setMode("jobMatch")}
                  className={`px-4 py-2 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all ${
                    mode === "jobMatch"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  Job match
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
                        Top 10 Most Suitable
                      </div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {results.length} subtypes
                    </div>
                  </div>

                  <div className="mb-4 text-[10px] text-slate-500 font-medium">
                    Matching score is <strong>0–5</strong>, where <strong>5</strong> is the highest match.
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
                              <div className="text-sm font-black text-slate-900">{r.profession.name}</div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                {r.profession.major}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Match (5 best)
                              </div>
                              <div className="text-sm font-black text-slate-900">{fmt(match, 2)}</div>
                            </div>
                          </div>

                          <div className="mt-3 text-[11px] text-slate-600 font-medium">
                            Estimated drain: <strong>{fmt((r as any).totalDrainedEnergy ?? 0, 2)}</strong>
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
                          {active.profession.name}
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3">
                          {active.profession.major}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Matching score (5 best)
                        </div>
                        <div className="text-3xl font-black text-indigo-600">{fmt(getMatchScoreByMode(active, mode), 2)}</div>
                        <div className="text-[11px] text-slate-600 font-medium mt-2">
                          Drain: <strong>{fmt((active as any).totalDrainedEnergy ?? 0, 2)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
                      <div className="text-[11px] font-black uppercase tracking-widest text-indigo-900 italic mb-2">
                        Interpretation
                      </div>
                      <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                        This view ranks match using{" "}
                        {mode === "aspiredMatch" ? (
                          <>
                            <strong>SurfaceAdjustedAspired</strong> ( Aspired Job Match)
                          </>
                        ) : (
                          <>
                            <strong>SurfaceAdjusted</strong> (Job Match)
                          </>
                        )}
                        . The difference is calculated by substracting 
                        professional demand from SurfaceAdjusted or SurfaceAdjustedAspired. 
                        Drives marked in red are your drive deficit areas, 
                        and green ones are your surplus areas compared to the professional demand.
                      </p>
                    </div>

                    {/* Drive table */}
                    {debugTarget && (
                      <div className="mt-6 bg-white border border-slate-200 rounded-3xl p-6">
                        <div className="text-[11px] font-black uppercase tracking-widest text-slate-700 mb-2">
                          Drive table
                        </div>

                        <div className="text-[9px] text-slate-600 font-medium mb-4 leading-relaxed">
                          <strong>Adj Surface</strong> = SurfaceAdjusted.{" "}
                          <strong>Surface (Aspired)</strong> = SurfaceAdjustedAspired.{" "}
                          <strong>Diff</strong> ={" "}
                          {mode === "aspiredMatch" ? "Surface(Aspired) − Job Demand" : "Adj Surface − Job Demand"}.
                        </div>

                        <div className="grid grid-cols-5 gap-2 text-[9px] font-black uppercase tracking-wide text-slate-400 mb-2">
                          <div>Drive</div>
                          <div className="text-right">Adj Surface</div>
                          <div className="text-right">Surface (Aspired)</div>
                          <div className="text-right">Job Demand</div>
                          <div className="text-right">Diff</div>
                        </div>

                        <div className="space-y-2">
                          {(driveNames as DriveName[]).map((d) => {
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
                                <div className="text-[11px] font-black uppercase tracking-widest text-slate-700">{d}</div>

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
                              Configure My Own Job
                            </div>
                          </div>

                          <div className="space-y-4">
                            <input
                              value={customJobName}
                              onChange={(e) => setCustomJobName(e.target.value)}
                              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400"
                              placeholder="Job name"
                            />

                            <div className="space-y-3">
                              {(driveNames as DriveName[]).map((d) => (
                                <div key={d} className="bg-white border border-slate-200 rounded-2xl p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-700">{d}</div>
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
                                  <div className="text-[11px] text-slate-500 font-medium mt-2">{driveDefinitions[d]}</div>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={runCustom}
                              className="w-full bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase italic text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow"
                            >
                              Run custom fit
                            </button>

                            {customResult && (
                              <div className="bg-white border border-indigo-200 rounded-2xl p-4">
                                <div className="text-sm font-black text-slate-900">{customResult.profession.name}</div>
                                <div className="text-[11px] text-slate-600 font-medium mt-2">
                                  Match (5 best): <strong>{fmt(getMatchScoreByMode(customResult, mode), 2)}</strong> · Drain:{" "}
                                  <strong>{fmt((customResult as any).totalDrainedEnergy ?? 0, 2)}</strong>
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
                    <div className="text-[11px] font-black uppercase tracking-widest">No selection</div>
                    <p className="text-sm mt-3 text-slate-600 font-medium">
                      Pick a profession subtype to see the full breakdown.
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
                Next <span className="text-indigo-600">Steps</span>
              </h2>
                <p className="text-sm font-medium leading-relaxed text-slate-600">
                If a job shows a lower match score, it doesn’t mean “don’t do it.” It usually means you’ll want (1) an
                environment that supports your deficit drives, (2) address your energy drains so that you optimize your energy use.{" "}
                <Link href="/reports/drain-analysis" className="font-black text-indigo-600 hover:underline">
                    View your Energy Drain and Adaptation Analysis →
                </Link>
                </p>

              <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 italic">
                  Simulation complete. Fit vectors stabilized.
                </p>
                <Link
                  href="/"
                  className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full font-black uppercase italic text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
                >
                  <LayoutDashboard size={18} /> Dashboard{" "}
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
