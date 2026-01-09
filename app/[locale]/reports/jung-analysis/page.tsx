// app/reports/jung-analysis/page.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthHeader } from "@/components/AuthHeader";
import { usePersonaDerived } from "@/lib/persona-derived/usePersonaDerived";
import { ensurePersonaDerived } from "@/lib/persona-derived/persona-derived";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useMessages, useTranslations } from "next-intl";
import {
  ChevronRight,
  LayoutDashboard,
  Loader2,
  Sparkles,
  Brain,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";

import { buildJungAnalysisReport } from "@/lib/jung-analysis/jung-analysis";
import type { PersonaCodeBlock } from "@/lib/jung-analysis/jung-analysis";

// -----------------------------
// UI helpers
// -----------------------------

function spaced(code: string) {
  return String(code || "—")
    .trim()
    .split("")
    .join(" ");
}

function HtmlBlock({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

const isAnonymousUser = (user: any) =>
  user?.is_anonymous === true || user?.app_metadata?.provider === "anonymous";

const AMBIVALENT_LABELS = ["I/E", "N/S", "T/F", "J/P"] as const;
const AXIS_LABELS = ["I/E", "N/S", "T/F", "J/P"] as const;
const POLE_ZH: Record<string, string> = {
  Introvert: "内倾 (Introvert)",
  Extrovert: "外倾 (Extrovert)",
  Ambivalent: "混合型 (Mixed)",
  Sensing: "感知 (Sensing)",
  Intuitive: "直觉 (Intuition)",
  Thinking: "思考 (Thinking)",
  Feeling: "情感 (Feeling)",
  Judging: "判定 (Judging)",
  Perspective: "观望 (Perspective)",
};
const PANEL_STYLES: Record<
  "energy" | "perception" | "judgment" | "orientation",
  { border: string; bg: string; text: string; badge: string }
> = {
  energy: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    badge: "bg-emerald-600 text-white",
  },
  perception: {
    border: "border-sky-200",
    bg: "bg-sky-50",
    text: "text-sky-700",
    badge: "bg-sky-600 text-white",
  },
  judgment: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-500 text-white",
  },
  orientation: {
    border: "border-violet-200",
    bg: "bg-violet-50",
    text: "text-violet-700",
    badge: "bg-violet-600 text-white",
  },
};

function CodeDisplay({
  codeBlock,
  className = "",
  highlightMask,
}: {
  codeBlock?: PersonaCodeBlock;
  className?: string;
  highlightMask?: boolean[];
}) {
  const letters = codeBlock?.letters ?? [];
  if (!letters.length) {
    return <div className={className}>{spaced(codeBlock?.code ?? "—")}</div>;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {letters.map((letter, idx) => {
        const isAmbivalent = letter === "X";
        const display = isAmbivalent ? AMBIVALENT_LABELS[idx] : letter;
        const isDimmed = highlightMask ? !highlightMask[idx] : false;
        const textClass = isDimmed ? "text-slate-300" : "text-slate-900";
        const borderClass = isDimmed ? "border-slate-100" : "border-slate-200";

        if (display.includes("/")) {
          const [a, b] = display.split("/").map((x) => x.trim());
          return (
            <span
              key={`${display}-${idx}`}
              className={`inline-flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-white border ${borderClass} font-mono`}
            >
              <span className={`text-[12px] leading-[12px] font-black ${textClass}`}>{a}</span>
              <span className={`text-[12px] leading-[12px] font-black ${textClass}`}>{b}</span>
            </span>
          );
        }

        return (
          <span
            key={`${display}-${idx}`}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white border ${borderClass} font-mono text-2xl font-black ${textClass}`}
          >
            {display}
          </span>
        );
      })}
    </div>
  );
}

function formatAnnotations(annotations: string[], letters: string[]) {
  return annotations.map((ann, idx) => {
    if (!ann) return ann;
    if (ann.startsWith("X_")) {
      const suffix = ann.slice(2);
      const axis = AXIS_LABELS[idx] ?? "X";
      return `${axis}_${suffix}`;
    }
    return ann;
  });
}

function formatSubscript(ann: string, letter: string, axisIdx: number) {
  if (!ann) return "—";
  if (ann.startsWith("X_") || letter === "X") {
    const suffix = ann.startsWith("X_") ? ann.slice(2) : "adaptive";
    return `${AXIS_LABELS[axisIdx]}_${suffix}`;
  }
  return ann;
}

function formatPoleLabel(pole: string, axisIdx: number, locale?: string) {
  if (pole === "Ambivalent") {
    return locale === "zh" ? `${AXIS_LABELS[axisIdx]} 混合型` : `${AXIS_LABELS[axisIdx]} Adaptive`;
  }
  if (locale === "zh") return POLE_ZH[pole] ?? pole;
  return pole;
}

function subscriptMeaning(
  annotations: string[],
  letters: string[],
  translate: (key: string) => string
) {
  const axisTitles = [
    translate("subscript.axisTitles.energy"),
    translate("subscript.axisTitles.perception"),
    translate("subscript.axisTitles.judgment"),
    translate("subscript.axisTitles.orientation"),
  ];
  const axisAdaptive = [
    translate("subscript.adaptive.energy"),
    translate("subscript.adaptive.perception"),
    translate("subscript.adaptive.judgment"),
    translate("subscript.adaptive.orientation"),
  ];

  const map: Record<string, string> = {
    I_care: translate("subscript.map.I_care"),
    I_exploration: translate("subscript.map.I_exploration"),
    E_dominance: translate("subscript.map.E_dominance"),
    E_pleasure: translate("subscript.map.E_pleasure"),
    E_affiliation: translate("subscript.map.E_affiliation"),
    E_extroversion: translate("subscript.map.E_extroversion"),
    S_detail: translate("subscript.map.S_detail"),
    S_practical: translate("subscript.map.S_practical"),
    N_vision: translate("subscript.map.N_vision"),
    N_patterns: translate("subscript.map.N_patterns"),
    T_logic: translate("subscript.map.T_logic"),
    T_principles: translate("subscript.map.T_principles"),
    F_care: translate("subscript.map.F_care"),
    F_values: translate("subscript.map.F_values"),
    J_goal: translate("subscript.map.J_goal"),
    J_process: translate("subscript.map.J_process"),
    P_curious: translate("subscript.map.P_curious"),
    P_fun: translate("subscript.map.P_fun"),
  };

  return axisTitles.map((title, idx) => {
    const ann = annotations[idx];
    if (!ann || ann.startsWith("X_") || letters[idx] === "X") {
      return { title, text: axisAdaptive[idx] ?? translate("subscript.fallback") };
    }
    return {
      title,
      text: map[ann] ?? translate("subscript.fallback"),
    };
  });
}

// -----------------------------
// Page
// -----------------------------

export default function JungAnalysisReportPage() {
  const params = useParams();
  const locale = typeof (params as any)?.locale === "string" ? ((params as any).locale as string) : "en";
  const t = useTranslations("jung");
  const messages = useMessages();
  const jungMessages = (messages as any)?.jung ?? {};
  const jungReportMessages = (messages as any)?.jungReport ?? {};

  const hasJungKey = useCallback(
    (key: string) => {
      const parts = key.split(".");
      let node: any = jungMessages;
      for (const part of parts) {
        if (!node || typeof node !== "object" || !(part in node)) return false;
        node = node[part];
      }
      return typeof node === "string";
    },
    [jungMessages]
  );

  const tSafe = useCallback(
    (key: string, values?: Record<string, any>) => {
      if (!hasJungKey(key)) return key;
      try {
        return t(key, values);
      } catch {
        return key;
      }
    },
    [t, hasJungKey]
  );

  const formatTemplate = useCallback((text: string, values?: Record<string, any>) => {
    if (!values) return text;
    return text.replace(/\{(\w+)\}/g, (_, k) => {
      const value = values[k];
      return value === undefined || value === null ? "" : String(value);
    });
  }, []);

  const translateReport = useCallback(
    (key: string, values?: Record<string, any>) => {
      const normalized = key.startsWith("jungReport.") ? key.slice("jungReport.".length) : key;
      const parts = normalized.split(".");
      let node: any = jungReportMessages;
      for (const part of parts) {
        if (!node || typeof node !== "object" || !(part in node)) return key;
        node = node[part];
      }
      if (typeof node !== "string") return key;
      return formatTemplate(node, values);
    },
    [jungReportMessages, formatTemplate]
  );

  const withLocale = (href: string) => {
    if (!href) return `/${locale}`;
    if (href.startsWith("http")) return href;
    if (href.startsWith("mailto:")) return href;
    if (href.startsWith("/")) return `/${locale}${href}`;
    return `/${locale}/${href}`;
  };

  const { loading: derivedLoading, error: derivedError, latestTests, missingTests } = usePersonaDerived();
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [statusDetail, setStatusDetail] = useState<string | null>(null);
  const [authGate, setAuthGate] = useState<"unknown" | "anon" | "user">("unknown");

  useEffect(() => {
    let active = true;
    const loadStatus = async () => {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) {
        if (active) setAuthGate("anon");
        return;
      }

      if (isAnonymousUser(user)) {
        if (active) setAuthGate("anon");
        return;
      }

      if (active) setAuthGate("user");

      const result = await ensurePersonaDerived({ supabase, userId: user.id });
      if (!active) return;

      if (result?.reasons?.includes("upsert_failed")) {
        setStatusNote(tSafe("status.upsertFailed"));
        setStatusDetail(result?.error ?? tSafe("status.upsertDetailFallback"));
        return;
      }

      if (result?.reasons?.length) {
        setStatusNote(tSafe("status.recomputed"));
        setStatusDetail(null);
        return;
      }

      setStatusNote(tSafe("status.cached"));
      setStatusDetail(null);
    };

    void loadStatus();
    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    if (!latestTests) {
      setReport(null);
      return;
    }

    try {
      const model = buildJungAnalysisReport(
        {
          innateData: latestTests.innate,
          surfaceData: latestTests.surface,
        },
        translateReport
      );
      setReport(model);
      setErr(null);
    } catch (e: any) {
      setReport(null);
      setErr(e?.message || "build_failed");
    }
  }, [latestTests]);

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <AuthHeader />

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <section className="mb-10">
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-black uppercase italic text-slate-900 leading-none">
                {tSafe("header.titleStart")} <span className="text-indigo-600">{tSafe("header.titleAccent")}</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">
                {tSafe("header.subtitle")}
              </p>
              {statusNote ? (
                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">
                  {statusNote}
                  {statusDetail ? ` — ${statusDetail}` : ""}
                </p>
              ) : null}
            </div>

            <div className="flex justify-center">
              <Link
                href={withLocale("/")}
                className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
              >
                  <LayoutDashboard size={16} /> {tSafe("links.dashboard")}{" "}
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
          </header>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 md:p-10">
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-900 mb-4 italic flex items-center gap-2">
              <Sparkles size={16} /> {tSafe("howToUse.title")}
            </h3>
            <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
              {tSafe("howToUse.body")}
            </p>
          </div>
        </section>

        {/* Body */}
        {derivedLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-400" />
          </div>
        ) : authGate === "anon" ? (
          <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
              LOGIN
            </div>

            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                  {tSafe("auth.title")}
                </div>
              </div>

              <p className="text-sm text-slate-700/90 leading-relaxed font-medium">{tSafe("auth.subtitle")}</p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href={withLocale("/upgrade")}
                  className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full font-black uppercase italic text-[10px] tracking-widest shadow"
                >
                  {tSafe("auth.upgradeCta")} <ChevronRight size={12} />
                </Link>

                <Link
                  href={withLocale("/login?redirect=/reports/jung-analysis")}
                  className="inline-flex items-center gap-2 bg-white text-slate-900 px-5 py-2 rounded-full font-black uppercase italic text-[10px] tracking-widest border border-slate-200 shadow"
                >
                  {tSafe("auth.loginCta")} <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </section>
        ) : derivedError === "no_user" ? (
          <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
              LOGIN
            </div>

            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                  {tSafe("auth.title")}
                </div>
              </div>

              <p className="text-sm text-slate-700/90 leading-relaxed font-medium">{tSafe("auth.subtitle")}</p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href={withLocale("/login?redirect=/reports/jung-analysis")}
                  className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full font-black uppercase italic text-[10px] tracking-widest shadow"
                >
                  {tSafe("auth.cta")} <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </section>
        ) : derivedError === "missing_tests" ? (
          <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
              TESTS
            </div>

            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                  {tSafe("missingTests.title")}
                </div>
              </div>

              <p className="text-sm text-slate-700/90 leading-relaxed font-medium">{tSafe("missingTests.subtitle")}</p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {(missingTests ?? []).includes("imposed") ? (
                  <Link
                    href={withLocale("/tests/imposed-persona")}
                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full font-black uppercase italic text-[10px] tracking-widest shadow"
                  >
                    {tSafe("missingTests.imposed")} <ChevronRight size={12} />
                  </Link>
                ) : null}
                {(missingTests ?? []).includes("surface") ? (
                  <Link
                    href={withLocale("/tests/surface-persona")}
                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full font-black uppercase italic text-[10px] tracking-widest shadow"
                  >
                    {tSafe("missingTests.surface")} <ChevronRight size={12} />
                  </Link>
                ) : null}
                {(missingTests ?? []).includes("innate") ? (
                  <Link
                    href={withLocale("/tests/innate-persona")}
                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-full font-black uppercase italic text-[10px] tracking-widest shadow"
                  >
                    {tSafe("missingTests.innate")} <ChevronRight size={12} />
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        ) : derivedError ? (
          <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
              OOPS
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                  {tSafe("errors.unavailableTitle")}
                </div>
              </div>

              <p className="text-sm text-slate-700/90 leading-relaxed font-medium">{tSafe("errors.unavailableBody")}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={withLocale("/")}
                  className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow"
                >
                  <LayoutDashboard className="w-4 h-4" /> {tSafe("links.dashboard")} <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        ) : err || !report ? (
          <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
              OOPS
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                  {tSafe("errors.unavailableTitle")}
                </div>
              </div>

              <p className="text-sm text-slate-700/90 leading-relaxed font-medium">
                {err && err !== "build_failed" ? err : tSafe("errors.fallbackBody")}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={withLocale("/")}
                  className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow"
                >
                  <LayoutDashboard className="w-4 h-4" /> {tSafe("links.dashboard")} <ChevronRight size={14} />
                </Link>

                <Link
                  href={withLocale("/tests")}
                  className="inline-flex items-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest border border-slate-200 hover:border-slate-400 transition-all"
                >
                  <ClipboardList className="w-4 h-4" /> {tSafe("links.tests")} <ChevronRight size={14} />
                </Link>
              </div>

              <div className="mt-5 text-[11px] text-slate-600 font-medium leading-relaxed">
                {tSafe("errors.sourceNote")}
              </div>
            </div>
          </section>
        ) : (
          <div className="space-y-8">
            {/* Opening introduction */}
            <section className="rounded-[2.5rem] border-2 border-indigo-100 bg-white p-8 md:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic text-slate-900 leading-none">
                    {tSafe("intro.title")}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">
                    {tSafe("intro.subtitle")}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-700/90 leading-relaxed font-medium">
                {tSafe("intro.body")}
              </p>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="text-[11px] font-black uppercase tracking-widest text-indigo-900/80 mb-2 italic">
                    {tSafe("intro.panel1Title")}
                  </div>
                  <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                    {tSafe("intro.panel1Body")}
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="group relative inline-flex items-center gap-3">
                      <button className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-700 transition hover:border-indigo-400 hover:text-indigo-900">
                        {tSafe("overview.quickOverview")}
                      </button>
                      <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 w-[420px] rounded-2xl border border-slate-200 bg-white p-4 text-[12px] text-slate-700 shadow-xl opacity-0 transition group-hover:opacity-100">
                        <p className="mb-3">{tSafe("overviewText.surface1")}</p>
                        <p className="mb-3">{tSafe("overviewText.surface2")}</p>
                        <p>{tSafe("overviewText.surface3")}</p>
                      </div>
                    </div>
                    <Link
                      href={withLocale("/theories/multiple-persona")}
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-700 hover:text-indigo-900 hover:underline"
                    >
                      {tSafe("links.theory")}
                    </Link>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 relative">
                  <div className="text-[11px] font-black uppercase tracking-widest text-indigo-900/80 mb-2 italic">
                    {tSafe("intro.panel2Title")}
                  </div>
                  <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                    {tSafe("intro.panel2Body")}
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="group relative inline-flex items-center gap-3">
                      <button className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-700 transition hover:border-indigo-400 hover:text-indigo-900">
                        {tSafe("overview.quickOverview")}
                      </button>
                      <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 text-[12px] text-slate-700 shadow-xl opacity-0 transition group-hover:opacity-100">
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-900 mb-2">
                          {tSafe("overviewText.energyTitle")}
                        </div>
                        <p className="mb-3">{tSafe("overviewText.energyBody")}</p>
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-900 mb-2">
                          {tSafe("overviewText.perceptionTitle")}
                        </div>
                        <p className="mb-3">{tSafe("overviewText.perceptionBody")}</p>
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-900 mb-2">
                          {tSafe("overviewText.judgmentTitle")}
                        </div>
                        <p className="mb-3">{tSafe("overviewText.judgmentBody")}</p>
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-900 mb-2">
                          {tSafe("overviewText.orientationTitle")}
                        </div>
                        <p>{tSafe("overviewText.orientationBody")}</p>
                      </div>
                    </div>
                    <Link
                      href={withLocale("/theories/jung-analysis")}
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-700 hover:text-indigo-900 hover:underline"
                    >
                      {tSafe("links.theory")}
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Innate + Surface codes */}
            <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-visible">
              <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
                JUNG
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-none">
                    {tSafe("codes.title")}
                  </h2>
                </div>

                <p className="mt-3 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
                  {tSafe("codes.subtitle")}
                </p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Surface (left) */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      {report.opening.left.title || tSafe("codes.surfaceFallback")}
                    </div>

                    <CodeDisplay
                      codeBlock={report.opening.left.codeBlock}
                      className="text-5xl font-black italic text-slate-900 tracking-[0.2em]"
                      highlightMask={[true, false, true, false]}
                    />

                    {Array.isArray(report?.opening?.left?.codeBlock?.annotations) ? (
                      <>
                        <div className="mt-3 text-[12px] text-slate-700 font-semibold leading-relaxed">
                          {formatAnnotations(
                            report.opening.left.codeBlock.annotations,
                            report.opening.left.codeBlock.letters
                          ).join(" · ")}
                        </div>
                        <div className="mt-3 group relative inline-flex">
                          <button className="text-[10px] font-black uppercase tracking-widest text-indigo-700 hover:text-indigo-900 transition">
                            {tSafe("overview.subscriptMeaning")}
                          </button>
                          <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 text-[12px] text-slate-700 shadow-xl opacity-0 transition group-hover:opacity-100">
                            {subscriptMeaning(
                              report.opening.left.codeBlock.annotations,
                              report.opening.left.codeBlock.letters,
                              tSafe
                            ).map((line, i) => (
                              <div key={`sub-left-${i}`} className="mb-2 last:mb-0">
                                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-900 mb-1">
                                  {line.title}
                                </div>
                                <p>{line.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : null}

                    {report?.opening?.left?.subtitle ? (
                      <div className="mt-3 text-[12px] text-slate-600 font-medium leading-relaxed">
                        {report.opening.left.subtitle}
                      </div>
                    ) : null}
                  </div>

                  {/* Innate (right) */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      {report.opening.right.title || tSafe("codes.innateFallback")}
                    </div>

                    <CodeDisplay
                      codeBlock={report.opening.right.codeBlock}
                      className="text-5xl font-black italic text-slate-900 tracking-[0.2em]"
                      highlightMask={[false, true, false, true]}
                    />

                    {Array.isArray(report?.opening?.right?.codeBlock?.annotations) ? (
                      <>
                        <div className="mt-3 text-[12px] text-slate-700 font-semibold leading-relaxed">
                          {formatAnnotations(
                            report.opening.right.codeBlock.annotations,
                            report.opening.right.codeBlock.letters
                          ).join(" · ")}
                        </div>
                        <div className="mt-3 group relative inline-flex">
                          <button className="text-[10px] font-black uppercase tracking-widest text-indigo-700 hover:text-indigo-900 transition">
                            {tSafe("overview.subscriptMeaning")}
                          </button>
                          <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 text-[12px] text-slate-700 shadow-xl opacity-0 transition group-hover:opacity-100">
                            {subscriptMeaning(
                              report.opening.right.codeBlock.annotations,
                              report.opening.right.codeBlock.letters,
                              tSafe
                            ).map((line, i) => (
                              <div key={`sub-right-${i}`} className="mb-2 last:mb-0">
                                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-900 mb-1">
                                  {line.title}
                                </div>
                                <p>{line.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : null}

                    {report?.opening?.right?.subtitle ? (
                      <div className="mt-3 text-[12px] text-slate-600 font-medium leading-relaxed">
                        {report.opening.right.subtitle}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            {/* Mapped behavior traits */}
            <section className="rounded-[2.5rem] border-2 border-indigo-100 bg-white p-8 md:p-10 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-2xl font-black uppercase italic text-slate-900 leading-none">
                  {tSafe("mapped.title")}
                </h2>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
                  <div className="text-[11px] font-black uppercase tracking-widest text-indigo-900 italic mb-2">
                    {report.opening.behaviorMapping.title || tSafe("mapped.panelTitle")}
                  </div>
                  <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                    {report.opening.behaviorMapping.explanation}
                  </p>
                </div>

                <div className="bg-white border border-indigo-100 rounded-3xl p-6">
                  <div className="text-[10px] font-black uppercase tracking-widest text-indigo-900/70">
                    {tSafe("mapped.estimateLabel")}
                  </div>
                  <CodeDisplay
                    codeBlock={report.opening.behaviorMapping.mappedCode}
                    className="mt-3 text-6xl md:text-7xl font-black uppercase italic text-indigo-900 tracking-[0.18em]"
                  />
                  <div className="mt-3 text-[12px] text-indigo-900/70 font-semibold">
                    {formatAnnotations(
                      report.opening.behaviorMapping.mappedCode.annotations,
                      report.opening.behaviorMapping.mappedCode.letters
                    ).join(" · ")}
                  </div>
                  <div className="mt-3 group relative inline-flex items-center gap-2">
                    <button className="text-[10px] font-black uppercase tracking-widest text-indigo-700 hover:text-indigo-900 transition">
                      {tSafe("mapped.mappingLogic")}
                    </button>
                    <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 text-[12px] text-slate-700 shadow-xl opacity-0 transition group-hover:opacity-100">
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-900 mb-2">
                        {tSafe("mapped.mappingTitle")}
                      </div>
                      <p className="mb-2">{tSafe("mapped.mapEnergy")}</p>
                      <p className="mb-2">{tSafe("mapped.mapPerception")}</p>
                      <p className="mb-2">{tSafe("mapped.mapJudgment")}</p>
                      <p>{tSafe("mapped.mapOrientation")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Four dimension panels */}
            <section className="space-y-6">
              {(report?.panels || []).map((p: any, idx: number) => {
                const style = PANEL_STYLES[p.key as keyof typeof PANEL_STYLES];
                return (
                <div
                  key={`jung-panel-${p.key || idx}`}
                  className={`rounded-[2.5rem] border-2 ${style?.border ?? "border-slate-200"} bg-white p-8 md:p-10 shadow-sm relative overflow-hidden`}
                >
                  <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
                    {(p?.number || "0").toString()}
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow ${
                            style?.badge ?? "bg-indigo-600 text-white"
                          }`}
                        >
                          <Brain className="w-6 h-6" />
                        </div>
                        <div>
                          <h3
                            className={`text-2xl font-black uppercase italic leading-none ${
                              style?.text ?? "text-slate-900"
                            }`}
                          >
                            {p.title}
                          </h3>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">
                            {p.label} · {p.archetype}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`rounded-full border ${style?.border ?? "border-slate-200"} ${
                          style?.bg ?? "bg-slate-50"
                        } px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700`}
                      >
                        {tSafe("dimension.badge", { index: idx + 1 })}
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(() => {
                        const surfaceHighlighted = p.key === "energy" || p.key === "judgment";
                        const innateHighlighted = p.key === "perception" || p.key === "orientation";
                        return (
                          <>
                            <div
                              className={`rounded-3xl border p-6 ${
                                surfaceHighlighted ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-100/60"
                              }`}
                            >
                              <div
                                className={`text-[10px] font-black uppercase tracking-widest mb-2 ${
                                  surfaceHighlighted ? "text-slate-500" : "text-slate-300"
                                }`}
                              >
                                {tSafe("dimension.surfaceLabel")}
                              </div>
                              <div
                                className={`text-3xl font-black italic tracking-[0.12em] ${
                                  surfaceHighlighted ? "text-indigo-900" : "text-slate-400"
                                }`}
                              >
                                {formatPoleLabel(p.surface.pole, idx, locale)}
                              </div>
                              <div
                                className={`mt-2 text-[12px] font-bold ${
                                  surfaceHighlighted ? "text-indigo-900" : "text-slate-400"
                                }`}
                              >
                                {formatSubscript(p.surface.annotation, p.surface.letter, idx)}
                              </div>
                              <div
                                className={`mt-3 text-[12px] font-semibold leading-relaxed ${
                                  surfaceHighlighted ? "text-slate-700" : "text-slate-400"
                                }`}
                              >
                                {tSafe("dimension.archetype")}: <strong>{p.surface.archetype}</strong>
                              </div>
                              <div
                                className={`mt-2 text-[12px] font-semibold leading-relaxed ${
                                  surfaceHighlighted ? "text-slate-700" : "text-slate-400"
                                }`}
                              >
                                {p.surface.description}
                              </div>
                              <div
                                className={`mt-2 text-[12px] font-semibold leading-relaxed ${
                                  surfaceHighlighted ? "text-slate-700" : "text-slate-400"
                                }`}
                              >
                                {tSafe("dimension.surfaceNote")}
                              </div>
                            </div>

                            <div
                              className={`rounded-3xl border p-6 ${
                                innateHighlighted ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-100/60"
                              }`}
                            >
                              <div
                                className={`text-[10px] font-black uppercase tracking-widest mb-2 ${
                                  innateHighlighted ? "text-slate-500" : "text-slate-300"
                                }`}
                              >
                                {tSafe("dimension.innateLabel")}
                              </div>
                              <div
                                className={`text-3xl font-black italic tracking-[0.12em] ${
                                  innateHighlighted ? "text-indigo-900" : "text-slate-400"
                                }`}
                              >
                                {formatPoleLabel(p.innate.pole, idx, locale)}
                              </div>
                              <div
                                className={`mt-2 text-[12px] font-bold ${
                                  innateHighlighted ? "text-indigo-900" : "text-slate-400"
                                }`}
                              >
                                {formatSubscript(p.innate.annotation, p.innate.letter, idx)}
                              </div>
                              <div
                                className={`mt-3 text-[12px] font-semibold leading-relaxed ${
                                  innateHighlighted ? "text-slate-700" : "text-slate-400"
                                }`}
                              >
                                {tSafe("dimension.archetype")}: <strong>{p.innate.archetype}</strong>
                              </div>
                              <div
                                className={`mt-2 text-[12px] font-semibold leading-relaxed ${
                                  innateHighlighted ? "text-slate-700" : "text-slate-400"
                                }`}
                              >
                                {p.innate.description}
                              </div>
                              <div
                                className={`mt-2 text-[12px] font-semibold leading-relaxed ${
                                  innateHighlighted ? "text-slate-700" : "text-slate-400"
                                }`}
                              >
                                {tSafe("dimension.innateNote")}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {p.analysis ? (
                      <div className="mt-6 bg-white border border-slate-200 rounded-3xl p-6">
                        <div className="text-[11px] font-black uppercase tracking-widest text-slate-700 mb-2">
                          {tSafe("dimension.analysisTitle")}
                        </div>
                        <div className="text-sm text-slate-700/90 leading-relaxed font-medium">
                          <HtmlBlock html={p.analysis} />
                        </div>
                      </div>
                    ) : null}

                    {Array.isArray(p?.matrix) && p.matrix.length > 0 ? (
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {p.matrix.map((m: any, mi: number) => (
                          <div key={`jung-m-${idx}-${mi}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              {m.c1}
                            </div>
                            <div className="mt-2 text-base font-black text-slate-900">{m.c2}</div>
                            <div className="mt-2 text-[12px] text-slate-700 font-medium leading-relaxed">{m.n}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
              })}
            </section>
          </div>
        )}

        <section className="mt-16">
          <div className="bg-slate-100 border border-slate-200 rounded-[3rem] p-10 md:p-14 text-slate-900 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl font-black uppercase italic leading-none">
                {tSafe("footer.titleStart")} <span className="text-indigo-600">{tSafe("footer.titleAccent")}</span>
              </h2>
              <p className="text-sm font-medium leading-relaxed text-slate-600">
                {tSafe("footer.bodyPrefix")}{" "}
                <Link
                  href={withLocale("/reports/drain-analysis")}
                  className="font-black text-indigo-600 hover:text-indigo-700 underline decoration-2 underline-offset-2"
                >
                  {tSafe("footer.bodyLink")}
                </Link>
                {tSafe("footer.bodySuffix")}
              </p>

              <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-end gap-6">
                <Link
                  href={withLocale("/")}
                  className="group flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full font-black uppercase italic text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
                >
                  <LayoutDashboard size={18} /> {tSafe("footer.dashboardCta")}{" "}
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
