// app/drain-analysis/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";
import { Loader2, Lock, Droplets, ChevronRight, LayoutDashboard } from "lucide-react";

import { driveNames } from "@/lib/core-utils/fit-core";
import { driveDef, driveInitial, driveLabel } from "@/lib/i18n/drive-i18n";
import { usePersonaDerived } from "@/lib/persona-derived/usePersonaDerived";
import { ensurePersonaDerived } from "@/lib/persona-derived/persona-derived";
import { makeTr } from "@/lib/i18n/simple-tr";
import drainEn from "@/messages/drain/en.json";
import drainZh from "@/messages/drain/zh.json";
import { hasReportAccess } from "@/lib/access-logic";

// ✅ reporting model (rank/surface energy/paths are centralized here)
import { computeDrainAnalysisUIModel, DRAIN_SIGNIFICANCE } from "@/lib/drain-analysis/drain-analysis";
import type { DrainAnalysisUIModel } from "@/lib/drain-analysis/drain-analysis";

// ✅ advices moved out of this page
import { getDrainAdviceLocale } from "@/lib/drain-analysis/drain-advice";
import { getTransferAdviceLocale } from "@/lib/drain-analysis/transfer-advice";

type DriveName = (typeof driveNames)[number];

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
const SIGNIFICANT_DRIVE_DRAIN = DRAIN_SIGNIFICANCE.driveDrainMin;
const SIGNIFICANT_DRIVE_TRANSFER = DRAIN_SIGNIFICANCE.driveTransferMin;
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
  significantDrain: boolean;
  significantTransfer: boolean;

  drainPaths: DrainPathCard[]; // lr > 0
  transferPaths: TransferPathCard[]; // lr == 0
};

export default function DrainAnalysis() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const params = useParams();
  const locale = typeof (params as any)?.locale === "string" ? ((params as any).locale as string) : "en";
  const tr = useMemo(() => makeTr({ en: drainEn, zh: drainZh, locale }), [locale]);
  const isZh = locale.startsWith("zh");
  const surfaceEnergyLabel = isZh ? "表层能量" : "surface energy";

  const driveLabelLocal = (drive: DriveName) => driveLabel(drive, locale);
  const driveDefLocal = (drive: DriveName) => driveDef(drive, locale);
  const driveInitialLocal = (drive: DriveName) => driveInitial(drive, locale);

  const withLocale = (href: string) => {
    if (!href) return `/${locale}`;
    if (href.startsWith("http")) return href;
    if (href.startsWith("mailto:")) return href;
    if (href.startsWith("/")) return `/${locale}${href}`;
    return `/${locale}/${href}`;
  };

  const { loading: derivedLoading, error: derivedError, latestTests, missingTests } = usePersonaDerived();

  const [hasAccess, setHasAccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const [statusDetail, setStatusDetail] = useState<string | null>(null);

  // ✅ keep full model so bars can use fit-core surfaceDrain/surfaceTransfer directly
  const [uiModel, setUiModel] = useState<DrainAnalysisUIModel | null>(null);

  const [cards, setCards] = useState<DriveCard[]>([]);

  useEffect(() => {
    let active = true;

    async function fetchAccess() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (active) {
            setHasAccess(false);
            setAccessLoading(false);
          }
          return;
        }

        const profileRes = await supabase
          .from("profiles")
          .select("has_access_report_2, report_2_expires_at")
          .eq("id", user.id)
          .maybeSingle();

        if (!hasReportAccess(profileRes.data, 2)) {
          if (active) {
            setHasAccess(false);
            setRedirecting(true);
            router.replace(withLocale("/payment?report=drain-analysis"));
          }
          return;
        }

        if (active) {
          setHasAccess(true);
          setAccessLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (active) {
          setAccessLoading(false);
        }
      }
    }

    fetchAccess();

    return () => {
      active = false;
    };
  }, [supabase, router, locale]);

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
        setStatusKey("drain.status.upsertFailed");
        setStatusDetail(result?.error ?? null);
        return;
      }

      if (result?.reasons?.length) {
        setStatusKey("drain.status.recomputed");
        setStatusDetail(null);
        return;
      }

      setStatusKey("drain.status.cached");
      setStatusDetail(null);
    };

    void loadStatus();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!latestTests) {
      setUiModel(null);
      setCards([]);
      return;
    }

    const ui = computeDrainAnalysisUIModel({
      innateData: latestTests.innate,
      surfaceData: latestTests.surface,
      imposedData: latestTests.imposed,
    });

    setUiModel(ui);

    const nextCards: DriveCard[] = (driveNames as DriveName[]).map((td) => {
      const row = ui.rows.find((r) => r.drive === td);

      const surfaceEnergy = n(row?.surfaceEnergy);
      const rank = n(row?.rank);

      const drainedEnergy = n(row?.surfaceDrainTotal);
      const transferEnergy = n(row?.surfaceTransferTotal);
      const significantDrain = Boolean(row?.significantDrain);
      const significantTransfer = Boolean(row?.significantTransfer);

      const targets = (row?.targets ?? []) as any[];

      const drainPaths: DrainPathCard[] = targets
        .filter((t) => t.showAsDrainPath)
        .map((t) => ({
          sd: t.name as DriveName,
          td,
          dr: clamp01(n(t.dr)),
          lr: clamp01(n(t.lr)),
          contribution: clamp(n(t.drainedEnergyPath ?? t.drainedEnergyOnTd ?? t.pathDrain ?? 0), 0, 5),
        }))
        .sort((a, b) => b.contribution - a.contribution);

      const transferPaths: TransferPathCard[] = targets
        .filter((t) => t.showAsTransferPath)
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
        significantDrain,
        significantTransfer,
        drainPaths,
        transferPaths,
      };
    });

    setCards(nextCards);
  }, [latestTests]);

  const { drainDrives, transferDrives, restDrives } = useMemo(() => {
    const drained = cards
      .filter((c) => c.significantDrain)
      .slice()
      .sort((a, b) => b.drainedEnergy - a.drainedEnergy);

    const transferred = cards
      .filter((c) => c.significantTransfer)
      .slice()
      .sort((a, b) => b.transferEnergy - a.transferEnergy);

    const rest = cards
      .filter((c) => !c.significantDrain && !c.significantTransfer)
      .slice()
      .sort((a, b) => (a.rank || 999) - (b.rank || 999));

    return { drainDrives: drained, transferDrives: transferred, restDrives: rest };
  }, [cards]);

  const summary = useMemo(() => {
    const totalDrain = cards.reduce((acc, c) => acc + c.drainedEnergy, 0);
    const totalTransfer = cards.reduce((acc, c) => acc + c.transferEnergy, 0);
    const significantDrain = cards.filter((c) => c.significantDrain).length;
    const significantTransfer = cards.filter((c) => c.significantTransfer).length;

    const topDrain = cards.slice().sort((a, b) => b.drainedEnergy - a.drainedEnergy)[0] ?? null;
    const topTransfer = cards.slice().sort((a, b) => b.transferEnergy - a.transferEnergy)[0] ?? null;

    return { totalDrain, totalTransfer, significantDrain, significantTransfer, topDrain, topTransfer };
  }, [cards]);

  // ✅ REVISED: bars now use fit-core aggregates directly (uiModel.surfaceDrain / uiModel.surfaceTransfer)
  // We map 0..5 -> 0..100% (pct = value/5)
  const drainBars = useMemo(() => {
    if (!uiModel) return [];

    const withPct = (driveNames as DriveName[]).map((drive) => {
      const row = uiModel.rows.find((r) => r.drive === drive);
      const surfaceEnergy = n(row?.surfaceEnergy);
      const drainedEnergy = n(row?.surfaceDrainTotal); // fit-core aggregate per td (via report model)
      const significant = Boolean(row?.significantDrain);
      const pct = surfaceEnergy > 0 ? clamp01((significant ? drainedEnergy : 0) / surfaceEnergy) : 0;

      return { drive, pct, significant };
    });

    return withPct.sort((a, b) => {
      if (a.significant !== b.significant) return a.significant ? -1 : 1;
      return b.pct - a.pct;
    });
  }, [uiModel]);

  const transferBars = useMemo(() => {
    if (!uiModel) return [];

    const withPct = (driveNames as DriveName[]).map((drive) => {
      const row = uiModel.rows.find((r) => r.drive === drive);
      const surfaceEnergy = n(row?.surfaceEnergy);
      const transferEnergy = n(row?.surfaceTransferTotal); // fit-core aggregate per td (via report model)

      const significant = Boolean(row?.significantTransfer);
      const pct = surfaceEnergy > 0 ? clamp01((significant ? transferEnergy : 0) / surfaceEnergy) : 0;

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

  const isLoading = derivedLoading || accessLoading || redirecting;

  if (isLoading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest italic">{tr("drain.loading.title")}</p>
      </div>
    );

  if (!hasAccess)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center italic font-black text-slate-400 uppercase tracking-widest bg-white">
        <Lock className="mb-4" size={32} />
        {tr("drain.accessRestricted")}
      </div>
    );

  if (derivedError === "missing_tests") {
    const missing = new Set(missingTests ?? ["imposed", "surface", "innate"]);
    return (
      <div className="min-h-screen bg-[#FDFDFD]">
        <AuthHeader />
        <main className="max-w-3xl mx-auto px-6 py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <h1 className="text-2xl font-black text-slate-900">{tr("drain.missingTests.title")}</h1>
            <p className="mt-3 text-sm text-slate-600 font-medium">{tr("drain.missingTests.subtitle")}</p>
            <div className="mt-6 flex flex-col md:flex-row gap-3 justify-center">
              {missing.has("imposed") ? (
                <Link
                  href={withLocale("/tests/imposed-persona")}
                  className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
                >
                  {tr("drain.missingTests.imposed")}
                </Link>
              ) : null}
              {missing.has("surface") ? (
                <Link
                  href={withLocale("/tests/surface-persona")}
                  className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
                >
                  {tr("drain.missingTests.surface")}
                </Link>
              ) : null}
              {missing.has("innate") ? (
                <Link
                  href={withLocale("/tests/innate-persona")}
                  className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
                >
                  {tr("drain.missingTests.innate")}
                </Link>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (derivedError && derivedError !== "missing_tests")
    return (
      <div className="min-h-screen bg-[#FDFDFD]">
        <AuthHeader />
        <main className="max-w-3xl mx-auto px-6 py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600">
            <h1 className="text-2xl font-black text-slate-900">{tr("drain.errors.unavailableTitle")}</h1>
            <p className="mt-3 text-sm font-medium">{tr("drain.errors.unavailableBody")}</p>
          </div>
        </main>
      </div>
    );

  function DriveCardBlock(props: { c: DriveCard; mode: "drain" | "transfer" | "rest" }) {
    const { c, mode } = props;
    const colors = driveColors[c.drive] || driveColors.Dominance;
    const def = driveDefLocal(c.drive) || "a core psychological motivator.";

    const isDrain = mode === "drain";
    const isTransfer = mode === "transfer";

    const badge = isDrain ? "bg-rose-500" : isTransfer ? "bg-emerald-600" : "bg-slate-400";
    const headline =
      isDrain && c.significantDrain
        ? tr("drain.card.drainDetected")
        : isTransfer && c.significantTransfer
          ? tr("drain.card.transferDetected")
          : tr("drain.card.noSignal");

    const primaryValue = isDrain ? c.drainedEnergy : isTransfer ? c.transferEnergy : 0;
    const primaryLabel = isDrain
      ? tr("drain.card.drainedEnergy")
      : isTransfer
        ? tr("drain.card.transferredEnergy")
        : "—";

    const primaryPct = c.surfaceEnergy > 0 ? clamp01(primaryValue / c.surfaceEnergy) : 0;

    return (
      <div className={`rounded-[2.5rem] border-2 ${colors.border} ${colors.bg} p-8 md:p-10 shadow-sm relative overflow-hidden`}>
        <div className="absolute -top-4 -right-2 text-[9rem] font-black italic text-slate-900/5 pointer-events-none select-none">
          {c.rank}
        </div>

        <div className="flex items-center gap-6 relative z-10">
          <div className={`w-16 h-16 ${colors.accent} text-white rounded-3xl flex items-center justify-center font-black text-3xl italic shadow-lg`}>
            {driveInitialLocal(c.drive)}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className={`text-3xl font-black ${colors.text} uppercase italic leading-none`}>{driveLabelLocal(c.drive)}</h2>
                <p className="mt-2 text-[11px] text-slate-600 font-medium leading-relaxed max-w-xl">{def}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-[9px] font-black bg-white/60 px-2 py-1 rounded text-slate-600 uppercase tracking-widest border border-slate-200">
                  {tr("drain.card.surfaceEnergy")} {c.surfaceEnergy.toFixed(2)}
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
                      {tr("drain.card.pctOfSurface", { pct: Math.round(primaryPct * 100) })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* DRAIN SECTION */}
            {isDrain && (
              <div className="mt-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                  <Droplets size={14} /> {tr("drain.card.drainPaths")}
                </div>

                {c.drainPaths.length === 0 ? (
                  <div className="mt-3 text-[11px] text-slate-600 font-medium italic">
                    {tr("drain.card.noDrainPaths")}
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {c.drainPaths.map((p) => {
                      const advice = getDrainAdviceLocale(c.drive, p.sd, locale);
                      return (
                        <div key={`${p.td}-${p.sd}`} className="rounded-2xl border border-slate-200 bg-white/70 p-5 ring-2 ring-rose-200">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                            {tr("drain.card.targetDrive")}: <strong>{driveLabelLocal(p.sd)}</strong>
                          </div>

                          <div className="mt-3 space-y-1 text-[11px] text-slate-600 font-medium">
                            <div>
                              {tr("drain.card.drainContribution")}: <strong>{p.contribution.toFixed(2)}</strong>
                            </div>
                          </div>

                          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                            <div className="text-[10px] font-black uppercase tracking-widest text-rose-700">
                              {tr("drain.card.adjustmentTitle")}
                            </div>
                            <p className="mt-2 text-[11px] text-rose-700/90 font-medium leading-relaxed">
                              {advice ??
                                tr("drain.card.adjustmentFallback", {
                                  drive: driveLabelLocal(c.drive),
                                  target: driveLabelLocal(p.sd),
                                  targetLower: driveLabelLocal(p.sd).toLowerCase(),
                                })}
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
                  <Droplets size={14} /> {tr("drain.card.transferPaths", { min: PATH_TRANSFER_SHOW_MIN })}
                </div>

                {c.transferPaths.length === 0 ? (
                  <div className="mt-3 text-[11px] text-slate-600 font-medium italic">
                    {tr("drain.card.noTransferPaths", { min: PATH_TRANSFER_SHOW_MIN })}
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {c.transferPaths.map((p) => {
                      const advice = getTransferAdviceLocale(c.drive, p.sd, locale);
                      return (
                        <div key={`${p.td}-${p.sd}`} className="rounded-2xl border border-slate-200 bg-white/70 p-5 ring-2 ring-emerald-200">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                            {tr("drain.card.innateSource")}: <strong>{driveLabelLocal(p.sd)} </strong>
                          </div>

                          <div className="mt-3 space-y-1 text-[11px] text-slate-600 font-medium">
                            <div>
                              {tr("drain.card.transferContribution")}: <strong>{p.contribution.toFixed(2)}</strong>
                            </div>
                          </div>

                          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                              {tr("drain.card.adaptationTitle")}
                            </div>
                            <p className="mt-2 text-[11px] text-emerald-700/90 font-medium leading-relaxed">
                              {advice ??
                                tr("drain.card.adaptationFallback", {
                                  driveLower: driveLabelLocal(c.drive).toLowerCase(),
                                  targetLower: driveLabelLocal(p.sd).toLowerCase(),
                                })}
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
                {tr("drain.card.restNote")}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function NextStepPanel() {
    const isZhTitle = locale.startsWith("zh");
    const nextStepTitle = tr("drain.nextStep.title");
    const titleParts = nextStepTitle.split(" ");
    const titleMain = titleParts[0] ?? nextStepTitle;
    const titleAccent = titleParts.length > 1 ? titleParts.slice(1).join(" ") : "";
    const zhAccent = "建议";
    const zhAccentIndex = isZhTitle ? nextStepTitle.lastIndexOf(zhAccent) : -1;

    return (
      <div className="bg-slate-100 border border-slate-200 rounded-[3rem] p-8 md:p-10 text-slate-900 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <h2 className="text-4xl font-black uppercase italic leading-none">
            {isZhTitle && zhAccentIndex >= 0 ? (
              <>
                {nextStepTitle.slice(0, zhAccentIndex)}
                <span className="text-indigo-600">{nextStepTitle.slice(zhAccentIndex)}</span>
              </>
            ) : (
              <>
                {titleMain} {titleAccent ? <span className="text-indigo-600">{titleAccent}</span> : null}
              </>
            )}
          </h2>
          <p className="text-sm font-medium leading-relaxed text-slate-600">{tr("drain.nextStep.body")}</p>
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
                {tr("drain.header.titleStart")} <span className="text-indigo-600">{tr("drain.header.titleAccent")}</span>{" "}
                {tr("drain.header.titleEnd")}
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">
                {tr("drain.header.subtitle")}
              </p>
              {statusKey ? (
                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                  {tr(statusKey)}
                  {statusDetail ? ` — ${statusDetail}` : statusKey === "drain.status.upsertFailed" ? ` — ${tr("drain.status.upsertDetailFallback")}` : ""}
                </p>
              ) : null}
            </div>

            <div className="flex justify-center">
              <Link
                href={withLocale("/")}
                className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase italic text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
              >
                {tr("drain.header.instrumentationCta")}{" "}
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </header>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 md:p-10">
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-900 mb-4 italic">
              {tr("drain.overview.title")}
            </h3>

            <details className="mb-6">
              <summary className="cursor-pointer select-none text-[10px] font-black uppercase tracking-widest text-indigo-900/70">
                {tr("drain.overview.howToRead")}
              </summary>
              <div className="mt-4 space-y-3 text-sm text-indigo-900/80 leading-relaxed font-medium">
                <p>
                  {tr("drain.overview.criteria.ranked", { strong: surfaceEnergyLabel })}
                </p>
                <p>
                  {tr("drain.overview.criteria.drain", { value: `surfaceDrain(td) > ${SIGNIFICANT_DRIVE_DRAIN.toFixed(2)}` })}
                </p>
                <p>
                  {tr("drain.overview.criteria.transfer", {
                    value: `surfaceTransfer(td) > ${SIGNIFICANT_DRIVE_TRANSFER.toFixed(2)}`,
                  })}
                </p>
                <p>
                  {tr("drain.overview.criteria.pathsTitle")}
                  <br />• {tr("drain.overview.criteria.drainPath", { value: "lr > 0" })}
                  <br />• {tr("drain.overview.criteria.transferPath", { value: "lr == 0" })}
                </p>
                <p className="text-[12px] mt-2">
                  {tr("drain.overview.criteria.bars")}
                </p>
              </div>
            </details>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white/60 border border-indigo-100 p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900/70">
                    {tr("drain.overview.drainChart.title")}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900/70">
                    {tr("drain.overview.drainChart.subtitle")}
                  </p>

                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900/60">
                    {tr("drain.overview.drainChart.range")}
                  </p>
                </div>

                <div className="space-y-3">
                  {drainBars.map((b) => {
                    const pct = Math.round(b.pct * 100);
                    return (
                      <div key={`drain-${b.drive}`} className="flex items-center gap-3">
                        <div className="w-24 text-[11px] font-black uppercase tracking-widest text-indigo-900/70">
                          {driveLabelLocal(b.drive)}
                        </div>
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900/70">
                    {tr("drain.overview.transferChart.title")}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900/70">
                    {tr("drain.overview.transferChart.subtitle")}
                  </p>

                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900/60">
                    {tr("drain.overview.transferChart.range")}
                  </p>
                </div>

                <div className="space-y-3">
                  {transferBars.map((b) => {
                    const pct = Math.round(b.pct * 100);
                    return (
                      <div key={`transfer-${b.drive}`} className="flex items-center gap-3">
                        <div className="w-24 text-[11px] font-black uppercase tracking-widest text-indigo-900/70">
                          {driveLabelLocal(b.drive)}
                        </div>
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
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {tr("drain.overview.summary.totalDrain")}
                </div>
                <div className="mt-2 text-3xl font-black italic text-slate-900">{summary.totalDrain.toFixed(2)}</div>
                <div className="mt-2 text-[11px] text-slate-500 font-medium">
                  {tr("drain.overview.summary.drivesOver", {
                    value: SIGNIFICANT_DRIVE_DRAIN.toFixed(2),
                    count: summary.significantDrain,
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {tr("drain.overview.summary.totalTransfer")}
                </div>
                <div className="mt-2 text-3xl font-black italic text-slate-900">{summary.totalTransfer.toFixed(2)}</div>
                <div className="mt-2 text-[11px] text-slate-500 font-medium">
                  {tr("drain.overview.summary.drivesOver", {
                    value: SIGNIFICANT_DRIVE_TRANSFER.toFixed(2),
                    count: summary.significantTransfer,
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {tr("drain.overview.summary.topSignals")}
                </div>
                <div className="mt-2 text-[11px] text-slate-600 font-medium">
                  {tr("drain.overview.summary.topDrain")}: <strong>{summary.topDrain ? driveLabelLocal(summary.topDrain.drive) : "—"}</strong>
                  <span className="ml-2 text-slate-500">{summary.topDrain ? summary.topDrain.drainedEnergy.toFixed(2) : ""}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-600 font-medium">
                  {tr("drain.overview.summary.topTransfer")}:{" "}
                  <strong>{summary.topTransfer ? driveLabelLocal(summary.topTransfer.drive) : "—"}</strong>
                  <span className="ml-2 text-slate-500">{summary.topTransfer ? summary.topTransfer.transferEnergy.toFixed(2) : ""}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-10">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            {tr("drain.sections.drainTitle", { value: SIGNIFICANT_DRIVE_DRAIN.toFixed(2) })}
          </div>
          {drainDrives.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-[11px] text-slate-600 font-medium">
              {tr("drain.sections.drainEmpty", { value: SIGNIFICANT_DRIVE_DRAIN.toFixed(2) })}
            </div>
          ) : (
            drainDrives.map((c) => <DriveCardBlock key={`drain-${c.drive}`} c={c} mode="drain" />)
          )}
        </section>

        <section className="space-y-10 mt-14">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            {tr("drain.sections.transferTitle", { value: SIGNIFICANT_DRIVE_TRANSFER.toFixed(2) })}
          </div>
          {transferDrives.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-[11px] text-slate-600 font-medium">
              {tr("drain.sections.transferEmpty", { value: SIGNIFICANT_DRIVE_TRANSFER.toFixed(2) })}
            </div>
          ) : (
            transferDrives.map((c) => <DriveCardBlock key={`transfer-${c.drive}`} c={c} mode="transfer" />)
          )}
        </section>

        <section className="space-y-10 mt-14">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            {tr("drain.sections.restTitle")}
          </div>
          {restDrives.map((c) => (
            <DriveCardBlock key={`rest-${c.drive}`} c={c} mode="rest" />
          ))}
        </section>

        <section className="mt-16">
          <div className="bg-slate-100 border border-slate-200 rounded-[3rem] p-10 md:p-14 text-slate-900 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl font-black uppercase italic leading-none">
                {tr("drain.integration.title")}
              </h2>

              <div className="rounded-2xl bg-white/70 border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {tr("drain.integration.drainTableTitle")}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <th className="px-5 py-3">{tr("drain.integration.table.surfaceDrive")}</th>
                        <th className="px-5 py-3">{tr("drain.integration.table.innateDrive")}</th>
                        <th className="px-5 py-3">{tr("drain.integration.table.drainContribution")}</th>
                      </tr>
                    </thead>

                    <tbody className="bg-white">
                      {drainingRows.length === 0 ? (
                        <tr>
                          <td className="px-5 py-4 text-[11px] text-slate-500 font-medium" colSpan={3}>
                            {tr("drain.integration.table.noDrain")}
                          </td>
                        </tr>
                      ) : (
                        drainingRows.map((r) => (
                          <tr key={`drainrow-${r.drive}-${r.target}`} className="border-t border-slate-200 text-[11px] text-slate-700 font-medium">
                            <td className="px-5 py-4">
                              <strong className="uppercase">{driveLabelLocal(r.drive)}</strong>
                            </td>
                            <td className="px-5 py-4">
                              <strong className="uppercase">{driveLabelLocal(r.target)}</strong>
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {tr("drain.integration.transferTableTitle")}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <th className="px-5 py-3">{tr("drain.integration.table.surfaceDrive")}</th>
                        <th className="px-5 py-3">{tr("drain.integration.table.innateDrive")}</th>
                        <th className="px-5 py-3">{tr("drain.integration.table.diversion")}</th>
                      </tr>
                    </thead>

                    <tbody className="bg-white">
                      {transferRows.length === 0 ? (
                        <tr>
                          <td className="px-5 py-4 text-[11px] text-slate-500 font-medium" colSpan={3}>
                            {tr("drain.integration.table.noTransfer")}
                          </td>
                        </tr>
                      ) : (
                        transferRows.map((r) => (
                          <tr key={`transferrow-${r.drive}-${r.target}`} className="border-t border-slate-200 text-[11px] text-slate-700 font-medium">
                            <td className="px-5 py-4">
                              <strong className="uppercase">{driveLabelLocal(r.drive)}</strong>
                            </td>
                            <td className="px-5 py-4">
                              <strong className="uppercase">{driveLabelLocal(r.target)}</strong>
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

              <NextStepPanel />

              <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 italic">
                  {tr("drain.integration.footer")}
                </p>
                <Link
                  href={withLocale("/")}
                  className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full font-black uppercase italic text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
                >
                  <LayoutDashboard size={18} /> {tr("drain.integration.dashboard")}{" "}
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
