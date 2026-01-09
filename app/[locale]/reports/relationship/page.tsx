// app/relationship-ideal-partner/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";
import { usePersonaDerived } from "@/lib/persona-derived/usePersonaDerived";
import { ensurePersonaDerived } from "@/lib/persona-derived/persona-derived";
import { Loader2, Lock, ChevronRight, LayoutDashboard, HeartHandshake, BarChart3, Download } from "lucide-react";
import { makeTr } from "@/lib/i18n/simple-tr";
import relEn from "@/messages/relationship/en.json";
import relZh from "@/messages/relationship/zh.json";

import { driveNames } from "@/lib/core-utils/fit-core";
import type { DriveName } from "@/lib/core-utils/fit-core";
import { driveLabel as driveLabelI18n } from "@/lib/i18n/drive-i18n";
import { hasReportAccess } from "@/lib/access-logic";

import { computeIdealPartnerProfileUIModel } from "@/lib/relationship/relationship";
import type { IdealPartnerProfileUIModel } from "@/lib/relationship/relationship";

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}
function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
function fmt(x: number, digits = 2) {
  return Number.isFinite(x) ? x.toFixed(digits) : "0.00";
}
function driveBasis(d: DriveName): "innate" | "surface" {
  // Your model's definition:
  // Innate: Care, Exploration, Affiliation, Value
  // Surface: Achievement, Dominance, Pleasure
  return d === "Achievement" || d === "Dominance" || d === "Pleasure" ? "surface" : "innate";
}
type RankInfo = { rank: number; score: number };
type RankMap = Record<DriveName, RankInfo>;

function buildRankMap(vec: any): RankMap {
  const order = driveNames;
  const scored = order.map((d) => ({ drive: d, score: clamp(n(vec?.[d]), 0, 5) }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return order.indexOf(a.drive) - order.indexOf(b.drive);
  });

  const out = {} as RankMap;
  scored.forEach((x, idx) => (out[x.drive] = { rank: idx + 1, score: x.score }));
  return out;
}

function uniqDrives(xs: DriveName[]) {
  const seen = new Set<string>();
  const out: DriveName[] = [];
  xs.forEach((d) => {
    if (!seen.has(d)) {
      seen.add(d);
      out.push(d);
    }
  });
  return out;
}

function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type PartnerCapComponent = {
  basis: "innate" | "surface";
  selfDrive: DriveName;
  selfStrength: number; // 0..5
  cap: number; // 0..5
  reasonKey?: string;
  reasonParams?: Record<string, any>;
};

function titleCaseBasis(b: string, tr: (key: string, values?: Record<string, any>) => string) {
  return b === "innate"
    ? tr("relationship.basis.innate")
    : b === "surface"
      ? tr("relationship.basis.surface")
      : b;
}

function formatComponentLabel(params: {
  c: PartnerCapComponent;
  rankInnate: RankMap | null;
  rankSurface: RankMap | null;
  tr: (key: string, values?: Record<string, any>) => string;
  driveLabel: (d: DriveName) => string;
}) {
  const { c, rankInnate, rankSurface, tr, driveLabel } = params;
  const r =
    c.basis === "innate" ? rankInnate?.[c.selfDrive] : c.basis === "surface" ? rankSurface?.[c.selfDrive] : null;

  const basisLabel = titleCaseBasis(c.basis, tr);
  const drive = driveLabel(c.selfDrive);

  if (r) {
    return tr("relationship.cap.component.withRank", {
      basis: basisLabel,
      drive,
      rank: r.rank,
      score: fmt(r.score, 2),
    });
  }
  return tr("relationship.cap.component.noRank", { basis: basisLabel, drive });
}

function formatCapByLine(params: {
  capInfo: any;
  rankInnate: RankMap | null;
  rankSurface: RankMap | null;
  tr: (key: string, values?: Record<string, any>) => string;
  driveLabel: (d: DriveName) => string;
}) {
  const { capInfo, rankInnate, rankSurface, tr, driveLabel } = params;
  if (!capInfo) return null;

  const finalCap = n(capInfo.cap);

  const binding = (capInfo.bindingComponents || []) as PartnerCapComponent[];
  const capComps = (capInfo.capComponents || []) as PartnerCapComponent[];

  const buildLabels = (list: PartnerCapComponent[]) =>
    list.map((c) => formatComponentLabel({ c, rankInnate, rankSurface, tr, driveLabel }));

  if (Array.isArray(binding) && binding.length > 0) {
    const labels = buildLabels(binding);
    const uniq = Array.from(new Set(labels));

    if (uniq.length === 1) return tr("relationship.cap.by.single", { a: uniq[0] });
    if (uniq.length === 2) return tr("relationship.cap.by.double", { a: uniq[0], b: uniq[1] });
    return tr("relationship.cap.by.multi", {
      list: uniq.slice(0, -1).join(", "),
      last: uniq[uniq.length - 1],
    });
  }

  if (Array.isArray(capComps) && capComps.length > 0) {
    const inferredBinding = capComps.filter((c) => Math.abs(n(c.cap) - finalCap) < 1e-6);

    if (inferredBinding.length > 0) {
      const labels = buildLabels(inferredBinding);
      const uniq = Array.from(new Set(labels));

      if (uniq.length === 1) return tr("relationship.cap.by.single", { a: uniq[0] });
      if (uniq.length === 2) return tr("relationship.cap.by.double", { a: uniq[0], b: uniq[1] });
      return tr("relationship.cap.by.multi", {
        list: uniq.slice(0, -1).join(", "),
        last: uniq[uniq.length - 1],
      });
    }
  }

  const basis = capInfo.basis as "innate" | "surface";
  const selfDrive = capInfo.selfDrive as DriveName;

  const r =
    basis === "innate" ? rankInnate?.[selfDrive] : basis === "surface" ? rankSurface?.[selfDrive] : null;

  const basisLabel = titleCaseBasis(basis, tr);
  const drive = driveLabel(selfDrive);
  const label = r
    ? tr("relationship.cap.component.withRank", {
        basis: basisLabel,
        drive,
        rank: r.rank,
        score: fmt(r.score, 2),
      })
    : tr("relationship.cap.component.noRank", { basis: basisLabel, drive });

  return tr("relationship.cap.by.fallback", { label });
}

function formatCapParagraph(params: {
  partnerDrive: DriveName;
  capInfo: any;
  rankInnate: RankMap | null;
  rankSurface: RankMap | null;
  tr: (key: string, values?: Record<string, any>) => string;
  driveLabel: (d: DriveName) => string;
}) {
  const { partnerDrive, capInfo, rankInnate, rankSurface, tr, driveLabel } = params;
  if (!capInfo?.isCapped) return null;

  const binding = (capInfo.bindingComponents || []) as PartnerCapComponent[];
  const capComps = (capInfo.capComponents || []) as PartnerCapComponent[];
  const finalCap = n(capInfo.cap);
  const eps = 1e-9;

  const inferredBinding =
    binding.length > 0 ? binding : capComps.filter((c) => Math.abs(n(c.cap) - finalCap) <= eps);

  if (!Array.isArray(inferredBinding) || inferredBinding.length === 0) return null;

  const chosen =
    inferredBinding.find((c) => c.basis === capInfo.basis && c.selfDrive === capInfo.selfDrive) ?? inferredBinding[0];

  const label = formatComponentLabel({ c: chosen, rankInnate, rankSurface, tr, driveLabel });
  const because = chosen.reasonKey ? tr(chosen.reasonKey, chosen.reasonParams ?? {}) : "";
  const partner = driveLabel(partnerDrive);

  if (because) {
    return tr("relationship.cap.paragraph.withReason", { partner, label, reason: because });
  }
  return tr("relationship.cap.paragraph.noReason", { partner, label });
}
export default function RelationshipIdealPartnerReport() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const params = useParams();
  const locale = typeof (params as any)?.locale === "string" ? ((params as any).locale as string) : "en";
  const tr = useMemo(() => makeTr({ en: relEn, zh: relZh, locale }), [locale]);
  const driveLabel = (d: DriveName) => driveLabelI18n(d, locale);

  const renderHtml = (text: string) => <span dangerouslySetInnerHTML={{ __html: text }} />;

  const withLocale = (href: string) => {
    if (!href) return `/${locale}`;
    if (href.startsWith("http") || href.startsWith("mailto:")) return href;
    if (href.startsWith("/")) return `/${locale}${href}`;
    return `/${locale}/${href}`;
  };

  const { loading: derivedLoading, error: derivedError, latestTests, missingTests } = usePersonaDerived();

  const [hasAccess, setHasAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [uiModel, setUiModel] = useState<IdealPartnerProfileUIModel | null>(null);
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const [statusDetail, setStatusDetail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;
        if (!user) {
          setAccessLoading(false);
          return;
        }

        const profileRes = await supabase
          .from("profiles")
          .select("has_access_report_1, report_1_expires_at")
          .eq("id", user.id)
          .maybeSingle();

        if (!hasReportAccess(profileRes.data, 1)) {
          setHasAccess(false);
          setAccessLoading(false);
          router.replace(withLocale("/payment?report=relationship"));
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
    if (!latestTests?.innate || !latestTests?.surface) {
      setUiModel(null);
      return;
    }

    const model = computeIdealPartnerProfileUIModel({
      innateData: latestTests.innate,
      surfaceData: latestTests.surface,
    });

    setUiModel(model);
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
        setStatusKey("relationship.status.upsertFailed");
        setStatusDetail(result?.error ?? null);
        return;
      }

      if (result?.reasons?.length) {
        setStatusKey("relationship.status.recomputed");
        setStatusDetail(null);
        return;
      }

      setStatusKey("relationship.status.cached");
      setStatusDetail(null);
    };

    void loadStatus();
    return () => {
      active = false;
    };
  }, [supabase]);

  const rankInnate = useMemo(() => {
    if (!uiModel) return null;
    return buildRankMap((uiModel as any).selfInnate);
  }, [uiModel]);

  const rankSurface = useMemo(() => {
    if (!uiModel) return null;
    return buildRankMap((uiModel as any).selfSurface);
  }, [uiModel]);
  const driveOrder = useMemo(() => {
    if (!uiModel) return [] as DriveName[];
    // Keep the same rank/order you already computed for the existing chart.
    return uiModel.bars.map((b) => b.drive as DriveName);
  }, [uiModel]);

  const partnerIdealVec = useMemo(() => {
    if (!uiModel) return {} as Record<DriveName, number>;
    return uiModel.partnerIdeal as any;
  }, [uiModel]);

  const surfaceFocus = useMemo(
    () => ["Dominance", "Achievement", "Pleasure", "Affiliation"] as DriveName[],
    []
  );

  const innateFocus = useMemo(
    () => ["Exploration", "Value", "Care"] as DriveName[],
    []
  );

  const insights = useMemo(() => {
    if (!uiModel) return [];
    const list = ((uiModel as any).partnerDriveInsights || []) as any[];

    // show if non-trivial score OR capped (even if score is low)
    return list.filter((x) => {
      const drive = x.partnerDrive as DriveName;
      const shown = n((uiModel.partnerIdeal as any)[drive]);
      const capInfo = (uiModel as any).partnerCapMeta?.[drive];
      return shown > 0.01 || !!capInfo?.isCapped;
    });
  }, [uiModel]);

  const exportCapsJson = () => {
    if (!uiModel) return;
    const payload = {
      generatedAt: new Date().toISOString(),
      selfSurface: uiModel.selfSurface,
      selfInnate: uiModel.selfInnate,
      partnerRawUncapped: (uiModel as any).partnerRawUncapped,
      partnerRaw: uiModel.partnerRaw,
      partnerIdeal: uiModel.partnerIdeal,
      partnerCaps: (uiModel as any).partnerCaps,
      partnerCapMeta: (uiModel as any).partnerCapMeta,
      partnerDriveInsights: (uiModel as any).partnerDriveInsights,
      rows: uiModel.rows,
    };
    downloadText("ideal-partner-caps.json", JSON.stringify(payload, null, 2), "application/json");
  };

  const resolveCapReason = (m: any) => {
    if (!m?.reasonKey) return "";
    return tr(m.reasonKey, m.reasonParams ?? {});
  };

  const exportCapsCsv = () => {
    if (!uiModel) return;
    const meta = ((uiModel as any).partnerCapMeta || {}) as Record<string, any>;
    const drives = Object.keys(meta);

    const header = [
      "partnerDrive",
      "isCapped",
      "cap",
      "uncappedDemand",
      "cappedDemand",
      "basis",
      "selfDrive",
      "selfStrength",
      "rule",
      "reason",
      "bindingComponents",
      "capComponents",
    ];

    const lines = [header.join(",")];

    drives.forEach((k) => {
      const m = meta[k] || {};
      const row = [
        m.partnerDrive ?? k,
        String(!!m.isCapped),
        fmt(n(m.cap), 2),
        fmt(n(m.uncappedDemand), 2),
        fmt(n(m.cappedDemand), 2),
        m.basis ?? "",
        m.selfDrive ?? "",
        fmt(n(m.selfStrength), 2),
        JSON.stringify(m.rule ?? ""),
        JSON.stringify(resolveCapReason(m)),
        JSON.stringify(m.bindingComponents ?? []),
        JSON.stringify(m.capComponents ?? []),
      ];
      lines.push(row.join(","));
    });

    downloadText("ideal-partner-caps.csv", lines.join("\n"), "text/csv");
  };

  const isLoading = accessLoading || derivedLoading;

  if (isLoading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest italic">{tr("relationship.loading.title")}</p>
      </div>
    );

  if (!hasAccess)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center italic font-black text-slate-400 uppercase tracking-widest bg-white">
        <Lock className="mb-4" size={32} />
        {tr("relationship.accessRestricted")}
      </div>
    );

  if (derivedError === "missing_tests") {
    const missing = new Set(missingTests ?? ["imposed", "surface", "innate"]);
    return (
      <div className="min-h-screen bg-[#FDFDFD]">
        <AuthHeader />
        <main className="max-w-3xl mx-auto px-6 py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <h1 className="text-2xl font-black text-slate-900">{tr("relationship.missingTests.title")}</h1>
            <p className="mt-3 text-sm text-slate-600 font-medium">{tr("relationship.missingTests.subtitle")}</p>
            <div className="mt-6 flex flex-col md:flex-row gap-3 justify-center">
              {missing.has("imposed") ? (
                <Link
                  href={withLocale("/tests/imposed-persona")}
                  className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
                >
                  {tr("relationship.missingTests.imposed")}
                </Link>
              ) : null}
              {missing.has("surface") ? (
                <Link
                  href={withLocale("/tests/surface-persona")}
                  className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
                >
                  {tr("relationship.missingTests.surface")}
                </Link>
              ) : null}
              {missing.has("innate") ? (
                <Link
                  href={withLocale("/tests/innate-persona")}
                  className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
                >
                  {tr("relationship.missingTests.innate")}
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
            <h1 className="text-2xl font-black text-slate-900">{tr("relationship.errors.unavailableTitle")}</h1>
            <p className="mt-3 text-sm font-medium">{tr("relationship.errors.unavailableBody")}</p>
          </div>
        </main>
      </div>
    );

  if (!uiModel)
    return (
      <div className="min-h-screen bg-[#FDFDFD]">
        <AuthHeader />
        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 font-medium">
            {tr("relationship.errors.missingPersona")}
          </div>
        </main>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <AuthHeader />

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <section className="mb-12">
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-black uppercase italic text-slate-900 leading-none">
                {tr("relationship.header.titleStart")}{" "}
                <span className="text-indigo-600">{tr("relationship.header.titleAccent")}</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">
                {tr("relationship.header.subtitle")}
              </p>
              {statusKey ? (
                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                  {tr(statusKey)}
                  {statusDetail
                    ? ` — ${statusDetail}`
                    : statusKey === "relationship.status.upsertFailed"
                      ? ` — ${tr("relationship.status.upsertDetailFallback")}`
                      : ""}
                </p>
              ) : null}
            </div>

            <div className="flex justify-center">
              <Link
                href={withLocale("/")}
                className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
              >
                <LayoutDashboard size={16} /> {tr("relationship.header.dashboardCta")}{" "}
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </header>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 md:p-10">
            <div className="flex items-center gap-2 mb-2">
              <HeartHandshake className="w-5 h-5 text-indigo-700" />
              <div className="text-[11px] font-black uppercase tracking-widest text-indigo-900 italic">
                {tr("relationship.howToRead.title")}
              </div>
            </div>
            {[0, 1].map((idx) => (
              <p
                key={`howto-p-${idx}`}
                className={`text-sm text-indigo-900/80 leading-relaxed font-medium${idx > 0 ? " mt-4" : ""}`}
              >
                {renderHtml(tr(`relationship.howToRead.paragraphs.${idx}`))}
              </p>
            ))}

            <ul className="mt-2 space-y-1 pl-5 list-disc text-sm text-indigo-900/80 leading-relaxed font-medium">
              {[0, 1, 2].map((idx) => (
                <li key={`howto-b-${idx}`}>{renderHtml(tr(`relationship.howToRead.bullets.${idx}`))}</li>
              ))}
            </ul>

            {[2, 3, 4].map((idx) => (
              <p key={`howto-p-${idx}`} className="mt-4 text-sm text-indigo-900/80 leading-relaxed font-medium">
                {renderHtml(tr(`relationship.howToRead.paragraphs.${idx}`))}
              </p>
            ))}

            {/*<div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={exportCapsJson}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-indigo-800 hover:bg-indigo-50"
              >
                <Download size={16} /> Export JSON (caps)
              </button>

              <button
                onClick={exportCapsCsv}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-indigo-800 hover:bg-indigo-50"
              >
                <Download size={16} /> Export CSV (caps)
              </button>
            </div> */}
          </div>
        </section>

        {/* Bars */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Surface */}
            <div className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-2xl font-black uppercase italic text-slate-900 leading-none">
                    {tr("relationship.bars.surfaceTitle")}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                    {tr("relationship.bars.surfaceNote")}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {driveOrder.map((d) => {
                  const raw = clamp(n((partnerIdealVec as any)?.[d]), 0, 5);
                  const pct = Math.round(clamp01(raw / 5) * 100);
                  const isFocus = surfaceFocus.includes(d);

                  return (
                    <div key={`surface-bar-${d}`} className="flex items-center gap-3">
                      <div
                        className={`w-28 text-[11px] font-black uppercase tracking-widest ${
                          isFocus ? "text-slate-800" : "text-slate-400"
                        }`}
                      >
                        {driveLabel(d)}
                      </div>

                      <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full ${isFocus ? "bg-indigo-600" : "bg-slate-300"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="w-20 text-right text-[11px] font-black text-slate-700">{fmt(raw, 2)}</div>
                    </div>
                  );
                })}
              </div>

            <div className="mt-6 text-[11px] text-slate-600 font-medium leading-relaxed">
              {renderHtml(tr("relationship.bars.surfaceExplanation"))}
            </div>
            </div>

            {/* Innate */}
            <div className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-2xl font-black uppercase italic text-slate-900 leading-none">
                    {tr("relationship.bars.innateTitle")}
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                    {tr("relationship.bars.innateNote")}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {driveOrder.map((d) => {
                  const raw = clamp(n((partnerIdealVec as any)?.[d]), 0, 5);
                  const pct = Math.round(clamp01(raw / 5) * 100);
                  const isFocus = innateFocus.includes(d);

                  return (
                    <div key={`innate-bar-${d}`} className="flex items-center gap-3">
                      <div
                        className={`w-28 text-[11px] font-black uppercase tracking-widest ${
                          isFocus ? "text-slate-800" : "text-slate-400"
                        }`}
                      >
                        {driveLabel(d)}
                      </div>

                      <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full ${isFocus ? "bg-indigo-600" : "bg-slate-300"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="w-20 text-right text-[11px] font-black text-slate-700">{fmt(raw, 2)}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 text-[11px] text-slate-600 font-medium leading-relaxed">
                {renderHtml(tr("relationship.bars.innateExplanation"))}
              </div>
            </div>
          </div>
        </section>

        {/* Partner-drive scripts + supported-drive ranks */}
        <section className="space-y-8">
          <div className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-slate-700" />
              <div className="text-[20px] font-black uppercase tracking-widest text-slate-700">
                {tr("relationship.insights.title")}
              </div>
            </div>
            <p className="text-[18px] text-slate-600 font-medium leading-relaxed">
              {tr("relationship.insights.subtitle")}
            </p>
          </div>

        {insights.map((x: any, idx: number) => {
          const drive = x.partnerDrive as DriveName;
          const shown = clamp(n((uiModel.partnerIdeal as any)[drive]), 0, 5);

          const capInfo = (uiModel as any)?.partnerCapMeta?.[drive];
          const isCapped = !!capInfo?.isCapped;

          const innateList: DriveName[] = (x.innateSupport || []) as DriveName[];
          const surfaceList: DriveName[] = (x.surfaceSupport || []) as DriveName[];
          const rows = uniqDrives([...innateList, ...surfaceList]);

          const capParagraph =
            isCapped && capInfo
              ? formatCapParagraph({
                  partnerDrive: drive,
                  capInfo,
                  rankInnate,
                  rankSurface,
                  tr,
                  driveLabel,
                })
              : null;

          const rankNum = idx + 1;

          return (
            <div
              key={`insight-${drive}`}
              className="relative overflow-hidden rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm"
            >
              {/* Watermark rank */}
              <div className="pointer-events-none absolute right-6 top-6 z-0 select-none">
                <div className="text-[72px] md:text-[96px] font-black italic text-slate-200/60 leading-none">
                  {rankNum}
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {tr("relationship.card.partnerDriveLabel")}
                    </div>

                    <div className="mt-1 flex items-center gap-3">
                      <div className="text-3xl font-black uppercase italic text-slate-900">{driveLabel(drive)}</div>

                      {isCapped ? (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-800">
                          {tr("relationship.card.capped")}
                        </span>
                      ) : null}
                    </div>

                    {/* Single clean cap paragraph (binding component + its reason) */}
                    {capParagraph ? (
                      <div className="mt-2 text-[11px] text-slate-600 font-medium max-w-2xl">
                        {capParagraph}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {tr("relationship.card.score")}
                    </div>
                    <div className="mt-1 text-2xl font-black text-indigo-700">{fmt(shown, 2)}</div>
                  </div>
                </div>

                <div className="mt-6 text-sm text-slate-700/90 leading-relaxed font-medium whitespace-pre-line">
                  {x.scriptKey ? tr(x.scriptKey) : ""}
                </div>

                {Array.isArray(x.noteKeys) && x.noteKeys.length > 0 ? (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {tr("relationship.card.notes")}
                    </div>
                    <ul className="mt-2 space-y-1 text-[11px] text-slate-700 font-medium list-disc pl-5">
                      {x.noteKeys.map((t: string, nIdx: number) => (
                        <li key={`note-${drive}-${nIdx}`}>{tr(t)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Supported drive rankings table (unchanged) */}
                <div className="mt-8">
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
                    {tr("relationship.card.supportedTitle")}
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <th className="px-5 py-3">{tr("relationship.card.supportedDrive")}</th>
                        <th className="px-5 py-3">{tr("relationship.card.innateRank")}</th>
                        <th className="px-5 py-3">{tr("relationship.card.surfaceRank")}</th>
                        <th className="px-5 py-3">{tr("relationship.card.supportType")}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {rows.length === 0 ? (
                        <tr>
                          <td className="px-5 py-4 text-[11px] text-slate-500 font-medium" colSpan={4}>
                            {tr("relationship.card.noSupported")}
                          </td>
                        </tr>
                      ) : (
                          rows.map((d) => {
                            const innate = rankInnate?.[d];
                            const surf = rankSurface?.[d];
                            const basis = driveBasis(d);


                            const isInnate = innateList.includes(d);
                            const isSurface = surfaceList.includes(d);

                            const supportType =
                              isInnate && isSurface
                                ? tr("relationship.supportType.both")
                                : isInnate
                                  ? tr("relationship.supportType.innate")
                                  : isSurface
                                    ? tr("relationship.supportType.surface")
                                    : tr("relationship.supportType.none");

                            return (
                              <tr
                                key={`support-rank-${drive}-${d}`}
                                className="border-t border-slate-200 text-[11px] text-slate-700 font-medium"
                              >
                                <td className="px-5 py-4">
                                  <strong className="uppercase">{driveLabel(d)}</strong>
                                </td>
                                <td className="px-5 py-4">
                                  {basis === "innate" && innate ? (
                                    <span>
                                      <strong>#{innate.rank}</strong> <span className="text-slate-500">({fmt(innate.score, 2)})</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>

                                <td className="px-5 py-4">
                                  {basis === "surface" && surf ? (
                                    <span>
                                      <strong>#{surf.rank}</strong> <span className="text-slate-500">({fmt(surf.score, 2)})</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>


                                <td className="px-5 py-4">
                                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                    {supportType}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </section>

        {/* Footer */}
        <section className="mt-16">
          <div className="bg-slate-100 border border-slate-200 rounded-[3rem] p-10 md:p-14 text-slate-900 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl font-black uppercase italic leading-none">
                {tr("relationship.footer.titleStart")}{" "}
                <span className="text-indigo-600">{tr("relationship.footer.titleAccent")}</span>
              </h2>
              <p className="text-sm font-medium leading-relaxed text-slate-600">
                {tr("relationship.footer.body")}
              </p>

              <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 italic">
                  {tr("relationship.footer.status")}
                </p>
                <Link
                  href={withLocale("/")}
                  className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full font-black uppercase italic text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
                >
                  <LayoutDashboard size={18} /> {tr("relationship.footer.dashboardCta")}{" "}
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
