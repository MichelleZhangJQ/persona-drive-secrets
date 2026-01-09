// app/drain-analysis/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";
import { Loader2, Lock, Droplets, ChevronRight, LayoutDashboard } from "lucide-react";

import { driveNames } from "@/lib/core-utils/fit-core";

// ✅ reporting model (rank/surface energy/paths are centralized here)
import { computeDrainAnalysisUIModel } from "@/lib/drain-analysis/drain-analysis";
import type { DrainAnalysisUIModel } from "@/lib/drain-analysis/drain-analysis";

// ✅ advices moved out of this page
import { getDrainAdvice } from "@/lib/drain-analysis/drain-advice";
import { getTransferAdvice } from "@/lib/drain-analysis/transfer-advice";

type DriveName = (typeof driveNames)[number];

const driveDefinitions: Record<string, string> = {
  Exploration: "your drive for seeking new experiences, knowledge, and variety in your environment.",
  Achievement: "your drive for accomplishing goals, overcoming obstacles, and attaining mastery.",
  Dominance: "your drive for influence, control, and asserting your will over your surroundings.",
  Pleasure: "your drive for immediate gratification, comfort, and sensory enjoyment.",
  Care: "your drive for nurturing others, providing protection, and maintaining emotional bonds.",
  Affiliation: "your drive for social belonging, collaboration, and being part of a group.",
  Value: "your drive for satisfying the moral and social standards of your internal compass.",
};

const driveColors: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  Exploration: { bg: "bg-blue-50/50", border: "border-blue-200", text: "text-blue-900", accent: "bg-blue-400" },
  Value: { bg: "bg-red-50/50", border: "border-red-200", text: "text-red-900", accent: "bg-red-400" },
  Affiliation: { bg: "bg-red-50/50", border: "border-red-200", text: "text-red-900", accent: "bg-red-400" },
  Care: { bg: "bg-red-50/50", border: "border-red-200", text: "text-red-900", accent: "bg-red-400" },
  Dominance: { bg: "bg-amber-50/40", border: "border-orange-200", text: "text-orange-900", accent: "bg-orange-500" },
  Achievement: { bg: "bg-yellow-50/40", border: "border-yellow-200", text: "text-yellow-900", accent: "bg-yellow-500" },
  Pleasure: { bg: "bg-orange-50/40", border: "border-amber-200", text: "text-amber-900", accent: "bg-amber-500" },
};

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}
function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}
function clamp01(x: number) {
  return clamp(x, 0, 1);
}

const EPS = 1e-9;

// NOTE: your current thresholds (you can change back to 0.25 later)
const SIGNIFICANT_DRIVE_DRAIN = 0.01;
const SIGNIFICANT_DRIVE_TRANSFER = 0.01;
const PATH_TRANSFER_SHOW_MIN = EPS;

type DrainPathCard = {
  sd: DriveName;
  td: DriveName;
  dr: number;
  lr: number; // use path.lr directly (NO UI recompute)
  contribution: number; // use fit-core pathDrain (already computed upstream)
};

type TransferPathCard = {
  sd: DriveName;
  td: DriveName;
  dr: number;
  lr: number; // not necessarily 0 anymore
  transferRate: number; // (1 - lr)
  contribution: number; // use fit-core pathTransfer
};

type DriveCard = {
  drive: DriveName; // td
  surfaceEnergy: number;
  rank: number;

  drainedEnergy: number; // surfaceDrainTotal(td)
  transferEnergy: number; // surfaceTransferTotal(td)

  drainPaths: DrainPathCard[]; // lr > 0
  transferPaths: TransferPathCard[]; // lr == 0
};

export default function DrainAnalysis() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // ✅ keep full model so bars can use fit-core surfaceDrain/surfaceTransfer directly
  const [uiModel, setUiModel] = useState<DrainAnalysisUIModel | null>(null);

  const [cards, setCards] = useState<DriveCard[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const [profileRes, innateRes, surfaceRes, imposedRes] = await Promise.all([
          // ✅ access gate for this page
          supabase.from("profiles").select("has_access_report_2").eq("id", user.id).single(),
          supabase.from("innate-persona").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("surface-persona").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("imposed-persona").select("*").eq("user_id", user.id).maybeSingle(),
        ]);

        if (!profileRes.data?.has_access_report_2) {
          setHasAccess(false);
          setRedirecting(true);
          router.replace("/payment"); // ✅ change this route if your payment page differs
          return;
        }

        setHasAccess(true);

        if (!innateRes.data || !surfaceRes.data || !imposedRes.data) {
          setLoading(false);
          return;
        }

        // ✅ Centralized report model
        const ui = computeDrainAnalysisUIModel({
          innateData: innateRes.data,
          surfaceData: surfaceRes.data,
          imposedData: imposedRes.data,
        });

        setUiModel(ui);

        // ✅ Build cards directly from report model (NO recompute of lr/drain/transfer in UI)
        const nextCards: DriveCard[] = driveNames.map((td) => {
          const row = ui.rows.find((r) => r.drive === td);

          const surfaceEnergy = n(row?.surfaceEnergy);
          const rank = n(row?.rank);

          const drainedEnergy = n(row?.surfaceDrainTotal);
          const transferEnergy = n(row?.surfaceTransferTotal);

          const targets = (row?.targets ?? []) as any[];

          const drainPaths: DrainPathCard[] = targets
            .filter((t) => n(t.lr) > EPS)
            .map((t) => ({
              sd: t.name as DriveName,
              td,
              dr: clamp01(n(t.dr)),
              lr: clamp01(n(t.lr)),
              // ✅ prefer report fields, fall back to legacy names if present
              contribution: clamp(n(t.drainedEnergyPath ?? t.drainedEnergyOnTd ?? t.pathDrain ?? 0), 0, 5),
            }))
            .sort((a, b) => b.contribution - a.contribution);

          const transferPaths: TransferPathCard[] = targets
            .filter((t) => {
              const lr = clamp01(n(t.lr));
              const tr = clamp01(1 - lr);
              return tr > PATH_TRANSFER_SHOW_MIN;
            })
            .map((t) => {
              const lr = clamp01(n(t.lr));
              const transferRate = clamp01(1 - lr);

              return {
                sd: t.name as DriveName,
                td,
                dr: clamp01(n(t.dr)),
                lr,
                transferRate,
                contribution: clamp(n(t.transferredEnergyPath ?? t.transferredEnergyOnTd ?? t.pathTransfer ?? 0), 0, 5),
              };
            })
            .sort((a, b) => b.contribution - a.contribution);

          return {
            drive: td,
            surfaceEnergy,
            rank,
            drainedEnergy,
            transferEnergy,
            drainPaths,
            transferPaths,
          };
        });

        setCards(nextCards);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase, router]);

  const { drainDrives, transferDrives, restDrives } = useMemo(() => {
    const drained = cards
      .filter((c) => c.drainedEnergy > SIGNIFICANT_DRIVE_DRAIN)
      .slice()
      .sort((a, b) => b.drainedEnergy - a.drainedEnergy);

    const transferred = cards
      .filter((c) => c.transferEnergy > SIGNIFICANT_DRIVE_TRANSFER)
      .slice()
      .sort((a, b) => b.transferEnergy - a.transferEnergy);

    const rest = cards
      .filter((c) => !(c.drainedEnergy > SIGNIFICANT_DRIVE_DRAIN) && !(c.transferEnergy > SIGNIFICANT_DRIVE_TRANSFER))
      .slice()
      .sort((a, b) => (a.rank || 999) - (b.rank || 999));

    return { drainDrives: drained, transferDrives: transferred, restDrives: rest };
  }, [cards]);

  const summary = useMemo(() => {
    const totalDrain = cards.reduce((acc, c) => acc + c.drainedEnergy, 0);
    const totalTransfer = cards.reduce((acc, c) => acc + c.transferEnergy, 0);
    const significantDrain = cards.filter((c) => c.drainedEnergy > SIGNIFICANT_DRIVE_DRAIN).length;
    const significantTransfer = cards.filter((c) => c.transferEnergy > SIGNIFICANT_DRIVE_TRANSFER).length;

    const topDrain = cards.slice().sort((a, b) => b.drainedEnergy - a.drainedEnergy)[0] ?? null;
    const topTransfer = cards.slice().sort((a, b) => b.transferEnergy - a.transferEnergy)[0] ?? null;

    return { totalDrain, totalTransfer, significantDrain, significantTransfer, topDrain, topTransfer };
  }, [cards]);

  // ✅ REVISED: bars now use fit-core aggregates directly (uiModel.surfaceDrain / uiModel.surfaceTransfer)
  // We map 0..5 -> 0..100% (pct = value/5)
  const drainBars = useMemo(() => {
    if (!uiModel) return [];

    const withPct = driveNames.map((drive) => {
      const row = uiModel.rows.find((r) => r.drive === drive);
      const surfaceEnergy = n(row?.surfaceEnergy);
      const drainedEnergy = n(row?.surfaceDrainTotal); // fit-core aggregate per td (via report model)

      const pct = surfaceEnergy > 0 ? clamp01(drainedEnergy / surfaceEnergy) : 0;
      const significant = drainedEnergy > SIGNIFICANT_DRIVE_DRAIN;

      return { drive, pct, significant };
    });

    return withPct.sort((a, b) => {
      if (a.significant !== b.significant) return a.significant ? -1 : 1;
      return b.pct - a.pct;
    });
  }, [uiModel]);

  const transferBars = useMemo(() => {
    if (!uiModel) return [];

    const withPct = driveNames.map((drive) => {
      const row = uiModel.rows.find((r) => r.drive === drive);
      const surfaceEnergy = n(row?.surfaceEnergy);
      const transferEnergy = n(row?.surfaceTransferTotal); // fit-core aggregate per td (via report model)

      const pct = surfaceEnergy > 0 ? clamp01(transferEnergy / surfaceEnergy) : 0;
      const significant = transferEnergy > SIGNIFICANT_DRIVE_TRANSFER;

      return { drive, pct, significant };
    });

    return withPct.sort((a, b) => {
      if (a.significant !== b.significant) return a.significant ? -1 : 1;
      return b.pct - a.pct;
    });
  }, [uiModel]);

  const drainingRows = useMemo(() => {
    const out: { drive: DriveName; target: DriveName; contribution: number }[] = [];
    drainDrives.forEach((d) => {
      d.drainPaths.forEach((p) => out.push({ drive: d.drive, target: p.sd, contribution: p.contribution }));
    });
    out.sort((a, b) => b.contribution - a.contribution);
    return out;
  }, [drainDrives]);

  const transferRows = useMemo(() => {
    const out: { drive: DriveName; target: DriveName; dr: number }[] = [];
    transferDrives.forEach((d) => {
      d.transferPaths.forEach((p) => out.push({ drive: d.drive, target: p.sd, dr: p.dr }));
    });
    out.sort((a, b) => b.dr - a.dr);
    return out;
  }, [transferDrives]);

  if (loading || redirecting)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest italic">Calculating Drain & Transfer Vectors...</p>
      </div>
    );

  if (!hasAccess)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center italic font-black text-slate-400 uppercase tracking-widest bg-white">
        <Lock className="mb-4" size={32} />
        Access Restricted
      </div>
    );

  function DriveCardBlock(props: { c: DriveCard; mode: "drain" | "transfer" | "rest" }) {
    const { c, mode } = props;
    const colors = driveColors[c.drive] || driveColors.Dominance;
    const def = driveDefinitions[c.drive] || "a core psychological motivator.";

    const isDrain = mode === "drain";
    const isTransfer = mode === "transfer";

    const badge = isDrain ? "bg-rose-500" : isTransfer ? "bg-emerald-600" : "bg-slate-400";
    const headline = isDrain ? "DRAIN DETECTED" : isTransfer ? "ADAPTATION DETECTED" : "NO MAJOR SIGNAL";

    const primaryValue = isDrain ? c.drainedEnergy : isTransfer ? c.transferEnergy : 0;
    const primaryLabel = isDrain ? "Drained energy" : isTransfer ? "Transferred energy" : "—";

    const primaryPct = c.surfaceEnergy > 0 ? clamp01(primaryValue / c.surfaceEnergy) : 0;

    return (
      <div className={`rounded-[2.5rem] border-2 ${colors.border} ${colors.bg} p-8 md:p-10 shadow-sm relative overflow-hidden`}>
        <div className="absolute -top-4 -right-2 text-[9rem] font-black italic text-slate-900/5 pointer-events-none select-none">
          {c.rank}
        </div>

        <div className="flex items-center gap-6 relative z-10">
          <div className={`w-16 h-16 ${colors.accent} text-white rounded-3xl flex items-center justify-center font-black text-3xl italic shadow-lg`}>
            {c.drive[0]}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className={`text-3xl font-black ${colors.text} uppercase italic leading-none`}>{c.drive}</h2>
                <p className="mt-2 text-[11px] text-slate-600 font-medium leading-relaxed max-w-xl">{def}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-[9px] font-black bg-white/60 px-2 py-1 rounded text-slate-600 uppercase tracking-widest border border-slate-200">
                  Surface energy {c.surfaceEnergy.toFixed(2)}
                </span>

                <span className={`text-[9px] font-black px-2 py-1 rounded text-white uppercase tracking-widest shadow-sm ${badge}`}>
                  {headline}
                </span>

                {mode !== "rest" && (
                  <>
                    <span className="text-[9px] font-black bg-slate-900 px-2 py-1 rounded text-white uppercase tracking-widest shadow-sm">
                      {primaryLabel} {primaryValue.toFixed(2)}
                    </span>
                    <span className="text-[9px] font-black bg-white/60 px-2 py-1 rounded text-slate-600 uppercase tracking-widest border border-slate-200">
                      {Math.round(primaryPct * 100)}% of surface
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* DRAIN SECTION */}
            {isDrain && (
              <div className="mt-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                  <Droplets size={14} /> Drain paths (lr &gt; 0)
                </div>

                {c.drainPaths.length === 0 ? (
                  <div className="mt-3 text-[11px] text-slate-600 font-medium italic">No drain paths (lr &gt; 0) for this drive.</div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {c.drainPaths.map((p) => {
                      const advice = getDrainAdvice(c.drive, p.sd);
                      return (
                        <div key={`${p.td}-${p.sd}`} className="rounded-2xl border border-slate-200 bg-white/70 p-5 ring-2 ring-rose-200">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                            Target drive: <strong>{p.sd}</strong>
                          </div>

                          <div className="mt-3 space-y-1 text-[11px] text-slate-600 font-medium">
                            <div>
                              Drain contribution: <strong>{p.contribution.toFixed(2)}</strong>
                            </div>
                          </div>

                          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                            <div className="text-[10px] font-black uppercase tracking-widest text-rose-700">Adjustment strategy</div>
                            <p className="mt-2 text-[11px] text-rose-700/90 font-medium leading-relaxed">
                              {advice ??
                                `${c.drive} is compensating for ${p.sd}. Try satisfying ${p.sd.toLowerCase()} more directly in environments that support it.`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TRANSFER SECTION */}
            {isTransfer && (
              <div className="mt-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                  <Droplets size={14} /> Transfer / adaptation paths (1 - lr &gt; {PATH_TRANSFER_SHOW_MIN})
                </div>

                {c.transferPaths.length === 0 ? (
                  <div className="mt-3 text-[11px] text-slate-600 font-medium italic">
                    No transfer paths with (1 - lr) &gt; {PATH_TRANSFER_SHOW_MIN} .
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {c.transferPaths.map((p) => {
                      const advice = getTransferAdvice(c.drive, p.sd);
                      return (
                        <div key={`${p.td}-${p.sd}`} className="rounded-2xl border border-slate-200 bg-white/70 p-5 ring-2 ring-emerald-200">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                            Innate Source Drive: <strong>{p.sd} </strong>
                          </div>

                          <div className="mt-3 space-y-1 text-[11px] text-slate-600 font-medium">
                            <div>
                              Transfer contribution: <strong>{p.contribution.toFixed(2)}</strong>
                            </div>
                          </div>

                          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Successful adaptation note</div>
                            <p className="mt-2 text-[11px] text-emerald-700/90 font-medium leading-relaxed">
                              {advice ??
                                `This suggests your current ${c.drive.toLowerCase()} behavior supports ${p.sd.toLowerCase()} with minimal leakage in the current environment.`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {mode === "rest" && (
              <p className="mt-4 text-[11px] text-slate-700 font-medium leading-relaxed">
                This drive does not currently show significant drain or significant adaptation/transfer above the thresholds.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <AuthHeader />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <section className="mb-14">
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-black uppercase italic text-slate-900 leading-none">
                Energy Drain <span className="text-indigo-600">&</span> Adaptation
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">
                Drain = leakage. Adaptation = effective transfer.
              </p>
            </div>

            <div className="flex justify-center">
              <Link
                href="/instrumentation-report"
                className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase italic text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
              >
                View Instrumentation <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </header>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 md:p-10">
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-900 mb-4 italic">Overview</h3>

            <details className="mb-6">
              <summary className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-indigo-900/70">
                How to read this (criteria)
              </summary>
              <div className="mt-4 space-y-3 text-sm text-indigo-900/80 leading-relaxed font-medium">
                <p>
                  Drives are ranked by <strong>surface energy</strong> (what you actually spend effort on).
                </p>
                <p>
                  Significant drain: <strong>surfaceDrain(td) &gt; {SIGNIFICANT_DRIVE_DRAIN.toFixed(2)}</strong>.
                </p>
                <p>
                  Significant adaptation/transfer: <strong>surfaceTransfer(td) &gt; {SIGNIFICANT_DRIVE_TRANSFER.toFixed(2)}</strong>.
                </p>
                <p>
                  Path display rules:
                  <br />• Drain paths: show only if <strong>lr &gt; 0</strong>.
                  <br />• Transfer paths: show only if <strong>lr == 0</strong>.
                </p>
                <p className="text-[12px] mt-2">
                  <strong>Bars:</strong> now computed from fit-core aggregates (surfaceDrain/surfaceTransfer), scaled from 0..5 to 0..100%.
                </p>
              </div>
            </details>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white/60 border border-indigo-100 p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900/70">Energy Drain (Red)</p>
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900/70">Inner Conflits</p>

                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900/60">0–100%</p>
                </div>

                <div className="space-y-3">
                  {drainBars.map((b) => {
                    const pct = Math.round(b.pct * 100);
                    return (
                      <div key={`drain-${b.drive}`} className="flex items-center gap-3">
                        <div className="w-24 text-[11px] font-black uppercase tracking-widest text-indigo-900/70">{b.drive}</div>
                        <div className="flex-1 h-3 rounded-full bg-indigo-100/60 overflow-hidden border border-indigo-100">
                          <div className={`h-full rounded-full ${b.significant ? "bg-rose-500" : "bg-slate-300"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="w-14 text-right text-[11px] font-black text-indigo-900/70">{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-white/60 border border-indigo-100 p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900/70">Energy Adaptation(Green)</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900/70"> Effective Instrumentation</p>
                 
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900/60">0–100%</p>
                </div>

                <div className="space-y-3">
                  {transferBars.map((b) => {
                    const pct = Math.round(b.pct * 100);
                    return (
                      <div key={`transfer-${b.drive}`} className="flex items-center gap-3">
                        <div className="w-24 text-[11px] font-black uppercase tracking-widest text-indigo-900/70">{b.drive}</div>
                        <div className="flex-1 h-3 rounded-full bg-indigo-100/60 overflow-hidden border border-indigo-100">
                          <div className={`h-full rounded-full ${b.significant ? "bg-emerald-600" : "bg-slate-300"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="w-14 text-right text-[11px] font-black text-indigo-900/70">{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Drain</div>
                <div className="mt-2 text-3xl font-black italic text-slate-900">{summary.totalDrain.toFixed(2)}</div>
                <div className="mt-2 text-[11px] text-slate-500 font-medium">
                  Drives &gt; {SIGNIFICANT_DRIVE_DRAIN.toFixed(2)}: {summary.significantDrain}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Adaptation</div>
                <div className="mt-2 text-3xl font-black italic text-slate-900">{summary.totalTransfer.toFixed(2)}</div>
                <div className="mt-2 text-[11px] text-slate-500 font-medium">
                  Drives &gt; {SIGNIFICANT_DRIVE_TRANSFER.toFixed(2)}: {summary.significantTransfer}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top Signals</div>
                <div className="mt-2 text-[11px] text-slate-600 font-medium">
                  Drain: <strong>{summary.topDrain?.drive ?? "—"}</strong>
                  <span className="ml-2 text-slate-500">{summary.topDrain ? summary.topDrain.drainedEnergy.toFixed(2) : ""}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-600 font-medium">
                  Adaptation: <strong>{summary.topTransfer?.drive ?? "—"}</strong>
                  <span className="ml-2 text-slate-500">{summary.topTransfer ? summary.topTransfer.transferEnergy.toFixed(2) : ""}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-10">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Drained drives (surfaceDrain &gt; {SIGNIFICANT_DRIVE_DRAIN.toFixed(2)})
          </div>
          {drainDrives.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-[11px] text-slate-600 font-medium">
              No drives exceeded the drain threshold ({SIGNIFICANT_DRIVE_DRAIN.toFixed(2)}).
            </div>
          ) : (
            drainDrives.map((c) => <DriveCardBlock key={`drain-${c.drive}`} c={c} mode="drain" />)
          )}
        </section>

        <section className="space-y-10 mt-14">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Adapted drives (surfaceTransfer &gt; {SIGNIFICANT_DRIVE_TRANSFER.toFixed(2)})
          </div>
          {transferDrives.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-[11px] text-slate-600 font-medium">
              No drives exceeded the transfer threshold ({SIGNIFICANT_DRIVE_TRANSFER.toFixed(2)}).
            </div>
          ) : (
            transferDrives.map((c) => <DriveCardBlock key={`transfer-${c.drive}`} c={c} mode="transfer" />)
          )}
        </section>

        <section className="space-y-10 mt-14">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Remaining drives</div>
          {restDrives.map((c) => (
            <DriveCardBlock key={`rest-${c.drive}`} c={c} mode="rest" />
          ))}
        </section>

        <section className="mt-16">
          <div className="bg-slate-100 border border-slate-200 rounded-[3rem] p-10 md:p-14 text-slate-900 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl font-black uppercase italic leading-none">
                Integration <span className="text-indigo-600">Summary</span>
              </h2>

              <div className="rounded-2xl bg-white/70 border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Drain paths shown (lr &gt; 0)</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <th className="px-5 py-3">Surface Drive</th>
                        <th className="px-5 py-3">Innate Drive</th>
                        <th className="px-5 py-3">Drain Contribution</th>
                      </tr>
                    </thead>

                    <tbody className="bg-white">
                      {drainingRows.length === 0 ? (
                        <tr>
                          <td className="px-5 py-4 text-[11px] text-slate-500 font-medium" colSpan={3}>
                            No drain paths (lr &gt; 0).
                          </td>
                        </tr>
                      ) : (
                        drainingRows.map((r) => (
                          <tr key={`drainrow-${r.drive}-${r.target}`} className="border-t border-slate-200 text-[11px] text-slate-700 font-medium">
                            <td className="px-5 py-4">
                              <strong className="uppercase">{r.drive}</strong>
                            </td>
                            <td className="px-5 py-4">
                              <strong className="uppercase">{r.target}</strong>
                            </td>
                            <td className="px-5 py-4">
                              <strong>{r.contribution.toFixed(2)}</strong>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl bg-white/70 border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Transfer paths shown (lr == 0)</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <th className="px-5 py-3">Surface Drive</th>
                        <th className="px-5 py-3">Innate Drive</th>
                        <th className="px-5 py-3">Diversion (dr)</th>
                      </tr>
                    </thead>

                    <tbody className="bg-white">
                      {transferRows.length === 0 ? (
                        <tr>
                          <td className="px-5 py-4 text-[11px] text-slate-500 font-medium" colSpan={3}>
                            No transfer paths (lr == 0).
                          </td>
                        </tr>
                      ) : (
                        transferRows.map((r) => (
                          <tr key={`transferrow-${r.drive}-${r.target}`} className="border-t border-slate-200 text-[11px] text-slate-700 font-medium">
                            <td className="px-5 py-4">
                              <strong className="uppercase">{r.drive}</strong>
                            </td>
                            <td className="px-5 py-4">
                              <strong className="uppercase">{r.target}</strong>
                            </td>
                            <td className="px-5 py-4">
                              <strong>{Math.round(r.dr * 100)}%</strong>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 italic">Drain + adaptation computation complete.</p>
                <Link
                  href="/"
                  className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full font-black uppercase italic text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
                >
                  <LayoutDashboard size={18} /> Dashboard <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
