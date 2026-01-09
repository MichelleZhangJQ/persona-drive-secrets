// app/reports/jung-analysis/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AuthHeader } from "@/components/AuthHeader";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
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

const AMBIVALENT_LABELS = ["I/E", "N/S", "T/F", "J/P"] as const;
const AXIS_LABELS = ["I/E", "N/S", "T/F", "J/P"] as const;
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
    <div className={`flex items-baseline gap-3 ${className}`}>
      {letters.map((letter, idx) => {
        const isAmbivalent = letter === "X";
        const display = isAmbivalent ? AMBIVALENT_LABELS[idx] : letter;
        const isDimmed = highlightMask ? !highlightMask[idx] : false;
        return (
          <span
            key={`${display}-${idx}`}
            className={`${isAmbivalent ? "inline-block text-[0.75em] tracking-[0.05em]" : ""} ${
              isDimmed ? "text-slate-300" : ""
            }`}
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

function formatPoleLabel(pole: string, axisIdx: number) {
  if (pole === "Ambivalent") {
    return `${AXIS_LABELS[axisIdx]} Adaptive`;
  }
  return pole;
}

function subscriptMeaning(annotations: string[], letters: string[]) {
  const axisTitles = ["Energy & Attention (I/E)", "Information Processing (N/S)", "Decision Style (T/F)", "Lifestyle (J/P)"];
  const axisAdaptive = [
    "Your I/E balance is adaptive: extroverted drives (Dominance, Pleasure, Affiliation) are balanced with introverted drives (Exploration, Care), so your socialization follows a more complex, context-driven pattern.",
    "Your N/S balance is adaptive and shifts with context, so you can move between concrete details and broader patterns as the situation requires.",
    "Your T/F balance is adaptive and shifts with context, so you can move between logic-first and value-first decisions depending on stakes and people.",
    "Your J/P balance is adaptive: goal/structure drives are balanced with exploration and flexibility, so you alternate between closure and openness based on what the moment needs.",
  ];

  const map: Record<string, string> = {
    I_care: "Your Introvert tendency is driven by a strong Care drive.",
    I_exploration: "Your Introvert tendency is driven by a strong Exploration drive.",
    E_dominance: "Your Extrovert tendency is driven by a strong Dominance drive.",
    E_pleasure: "Your Extrovert tendency is driven by a strong Pleasure drive.",
    E_affiliation: "Your Extrovert tendency is driven by a strong Affiliation drive.",
    E_extroversion: "Your Extrovert tendency is driven by outward activation and impact.",
    S_detail: "Your Sensing tendency is driven by detail-focus and precision.",
    S_practical: "Your Sensing tendency is driven by practical, concrete focus.",
    N_vision: "Your Intuition tendency is driven by big-picture vision.",
    N_patterns: "Your Intuition tendency is driven by pattern-seeking.",
    T_logic: "Your Thinking tendency is driven by logic and structure.",
    T_principles: "Your Thinking tendency is driven by principled consistency.",
    F_care: "Your Feeling tendency is driven by care and empathy.",
    F_values: "Your Feeling tendency is driven by values and human impact.",
    J_goal: "Your Judging tendency is driven by goal focus and closure.",
    J_process: "Your Judging tendency is driven by process structure.",
    P_curious: "Your Perceiving tendency is driven by curiosity and exploration.",
    P_fun: "Your Perceiving tendency is driven by spontaneous experience-seeking.",
  };

  return axisTitles.map((title, idx) => {
    const ann = annotations[idx];
    if (!ann || ann.startsWith("X_") || letters[idx] === "X") {
      return { title, text: axisAdaptive[idx] ?? "This axis is adaptive and shifts with context." };
    }
    return {
      title,
      text: map[ann] ?? "This subscript reflects the drive pattern behind this letter.",
    };
  });
}

// -----------------------------
// Page
// -----------------------------

export default function JungAnalysisReportPage() {
  const supabase = createBrowserSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErr(null);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        if (!alive) return;
        setErr("Please sign in to view this report.");
        setLoading(false);
        return;
      }

      const [innateRes, surfaceRes] = await Promise.all([
        supabase.from("innate-persona").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("surface-persona").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (!innateRes.data || !surfaceRes.data) {
        if (!alive) return;
        setErr("Required persona records were not found. Please complete the Surface and Innate modules.");
        setLoading(false);
        return;
      }

      try {
        const model = buildJungAnalysisReport({
          innateData: innateRes.data,
          surfaceData: surfaceRes.data,
        });

        if (!alive) return;
        setReport(model);
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to build Jung analysis report.");
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <AuthHeader />

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <section className="mb-10">
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-black uppercase italic text-slate-900 leading-none">
                Jung <span className="text-indigo-600">Persona Analysis</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">
                Surface vs. Innate persona through Jung-style dimensions
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
              <Sparkles size={16} /> How to use
            </h3>
            <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
              This report separates outward behavior tendencies (often captured in surface persona) from deeper cognitive
              and organizational tendencies (often captured in innate persona), then explains each dimension with clear
              reasoning.
            </p>
          </div>
        </section>

        {/* Body */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-400" />
          </div>
        ) : err ? (
          <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
              OOPS
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-700">Report unavailable</div>
              </div>

              <p className="text-sm text-slate-700/90 leading-relaxed font-medium">{err}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow"
                >
                  <LayoutDashboard className="w-4 h-4" /> Back to Dashboard <ChevronRight size={14} />
                </Link>

                <Link
                  href="/tests"
                  className="inline-flex items-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest border border-slate-200 hover:border-slate-400 transition-all"
                >
                  <ClipboardList className="w-4 h-4" /> Go to Tests <ChevronRight size={14} />
                </Link>
              </div>

              <div className="mt-5 text-[11px] text-slate-600 font-medium leading-relaxed">
                This page reads from <strong>innate-persona</strong> and <strong>surface-persona</strong> using{" "}
                <strong>user_id</strong>.
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
                    Jung Personality Overview
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">
                    A drive-based read of classic Jung dimensions
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-700/90 leading-relaxed font-medium">
                This report translates your persona drives into Jung’s four psychological dimensions. We separate
                outward behavior tendencies from inner cognitive organization to show where your surface and innate
                systems align or diverge.
              </p>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="text-[11px] font-black uppercase tracking-widest text-indigo-900/80 mb-2 italic">
                    01. Surface vs. Innate
                  </div>
                  <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                    Surface persona reflects your visible behavior and social strategy. Innate persona reflects the
                    deeper default patterns you return to when you are not adapting.
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="group relative inline-flex items-center gap-3">
                      <button className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-700 transition hover:border-indigo-400 hover:text-indigo-900">
                        Quick Overview
                      </button>
                      <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 w-[420px] rounded-2xl border border-slate-200 bg-white p-4 text-[12px] text-slate-700 shadow-xl opacity-0 transition group-hover:opacity-100">
                        <p className="mb-3">
                          In our framework, Surface Persona is closest to Jung’s ego-facing layer: your conscious,
                          deliberate way of showing up—how you explain yourself, steer behavior, and manage impressions.
                          Jung also emphasized that the ego sits atop a much larger unconscious (including disowned
                          traits, unrealized potentials, and autonomous tendencies).
                        </p>
                        <p className="mb-3">
                          Our Innate Persona is not the unconscious, and we don’t call it an “unconscious persona.”
                          Instead, it’s the hidden-but-knowable baseline: stable underlying preferences and
                          drive-structure that shape what feels natural and sustaining, often outside awareness unless
                          measured directly. Many people miss this baseline because their Surface Persona is trained by
                          roles, demands, and adaptation.
                        </p>
                        <p>
                          When the Surface Persona becomes too dominant—when a role becomes “who I am”—Jung’s warning
                          applies: what doesn’t fit gets pushed down and may return as shadow reactions (friction,
                          defensiveness, compulsive patterns). Growth, in Jung’s view, is individuation: bringing the
                          surface self into better alignment with what lies underneath, so the mask stays useful—but not
                          mistaken for the whole person.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/theories/multiple-persona"
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-700 hover:text-indigo-900 hover:underline"
                    >
                      Detailed Theory -&gt;
                    </Link>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 relative">
                  <div className="text-[11px] font-black uppercase tracking-widest text-indigo-900/80 mb-2 italic">
                    02. Four Jung Dimensions
                  </div>
                  <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                    We map Energy & Attention, Information Processing, Decision Style, and Lifestyle to show how your
                    drives organize attention, decisions, and action.
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="group relative inline-flex items-center gap-3">
                      <button className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-700 transition hover:border-indigo-400 hover:text-indigo-900">
                        Quick Overview
                      </button>
                      <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 text-[12px] text-slate-700 shadow-xl opacity-0 transition group-hover:opacity-100">
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-900 mb-2">
                          Energy & Attention (I / E)
                        </div>
                        <p className="mb-3">
                          <strong>Introversion</strong> means you recharge by going inward and prefer depth over constant
                          stimulation. <strong>Extroversion</strong> means you recharge through outward activity and gain
                          energy from people and action.
                        </p>
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-900 mb-2">
                          Information Processing (N / S)
                        </div>
                        <p className="mb-3">
                          <strong>Intuition</strong> looks for patterns and future possibilities.{" "}
                          <strong>Sensing</strong> focuses on concrete details and what is real right now.
                        </p>
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-900 mb-2">
                          Decision Style (T / F)
                        </div>
                        <p className="mb-3">
                          <strong>Thinking</strong> decides by logic and consistency. <strong>Feeling</strong> decides by
                          values and how choices affect people.
                        </p>
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-900 mb-2">
                          Lifestyle (J / P)
                        </div>
                        <p>
                          <strong>Judging</strong> prefers plans and closure. <strong>Perceiving</strong> prefers keeping
                          options open and adapting as new information appears.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/theories/jung-analysis"
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-700 hover:text-indigo-900 hover:underline"
                    >
                      Detailed Theory -&gt;
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
                    Innate & Surface Codes
                  </h2>
                </div>

                <p className="mt-3 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
                  Surface (behavior-facing) vs. Innate (core-facing)
                </p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Surface (left) */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      {report.opening.left.title || "Surface Persona"}
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
                            Subscript Meaning
                          </button>
                          <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 text-[12px] text-slate-700 shadow-xl opacity-0 transition group-hover:opacity-100">
                            {subscriptMeaning(
                              report.opening.left.codeBlock.annotations,
                              report.opening.left.codeBlock.letters
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
                      {report.opening.right.title || "Innate Persona"}
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
                            Subscript Meaning
                          </button>
                          <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 text-[12px] text-slate-700 shadow-xl opacity-0 transition group-hover:opacity-100">
                            {subscriptMeaning(
                              report.opening.right.codeBlock.annotations,
                              report.opening.right.codeBlock.letters
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
                  Mapped Behavior Jung Personality Traits
                </h2>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
                  <div className="text-[11px] font-black uppercase tracking-widest text-indigo-900 italic mb-2">
                    {report.opening.behaviorMapping.title || "Behavior-test comparison"}
                  </div>
                  <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                    {report.opening.behaviorMapping.explanation}
                  </p>
                </div>

                <div className="bg-white border border-indigo-100 rounded-3xl p-6">
                  <div className="text-[10px] font-black uppercase tracking-widest text-indigo-900/70">
                    Estimated behavior-based result
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
                      Mapping Logic
                    </button>
                    <div className="pointer-events-none absolute left-0 top-full z-20 mt-3 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 text-[12px] text-slate-700 shadow-xl opacity-0 transition group-hover:opacity-100">
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-900 mb-2">
                        How this mapping is built
                      </div>
                      <p className="mb-2">
                        <strong>Energy & Attention (I/E)</strong> is taken from your <strong>Surface Persona</strong>.
                      </p>
                      <p className="mb-2">
                        <strong>Information Processing (N/S)</strong> is taken from your <strong>Innate Persona</strong>.
                      </p>
                      <p className="mb-2">
                        <strong>Decision Style (T/F)</strong> is taken from your <strong>Surface Persona</strong>.
                      </p>
                      <p>
                        <strong>Lifestyle (J/P)</strong> is taken from your <strong>Innate Persona</strong>.
                      </p>
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
                        Dimension {idx + 1} / 4
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
                                Surface Dimension
                              </div>
                              <div
                                className={`text-3xl font-black italic tracking-[0.12em] ${
                                  surfaceHighlighted ? "text-indigo-900" : "text-slate-400"
                                }`}
                              >
                                {formatPoleLabel(p.surface.pole, idx)}
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
                                Archetype: <strong>{p.surface.archetype}</strong>
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
                                This is the surface adaptation you use to navigate the outside world.
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
                                Innate Dimension
                              </div>
                              <div
                                className={`text-3xl font-black italic tracking-[0.12em] ${
                                  innateHighlighted ? "text-indigo-900" : "text-slate-400"
                                }`}
                              >
                                {formatPoleLabel(p.innate.pole, idx)}
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
                                Archetype: <strong>{p.innate.archetype}</strong>
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
                                This is the baseline preference that feels natural and sustaining.
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {p.analysis ? (
                      <div className="mt-6 bg-white border border-slate-200 rounded-3xl p-6">
                        <div className="text-[11px] font-black uppercase tracking-widest text-slate-700 mb-2">
                          Analysis
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
      </main>
    </div>
  );
}
