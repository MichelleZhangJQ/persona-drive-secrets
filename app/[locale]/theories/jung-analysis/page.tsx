"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AuthHeader } from "@/components/AuthHeader";
import { BookOpen, ChevronRight, LayoutDashboard, Sparkles, Network, Brain, Compass, Layers } from "lucide-react";

type Reference = {
  id: string;
  citation: string;
};

type DimensionCard = {
  key: string;
  title: string;
  definition: string;
  jung: string;
  mbti: string;
  drive: string;
  refs: string[];
  color: {
    border: string;
    bg: string;
    text: string;
  };
};

const references: Reference[] = [
  { id: "J1", citation: "Jung, C. G. (1921/1971). Psychological Types." },
  {
    id: "MB1",
    citation:
      "Myers, I. B., McCaulley, M. H., Quenk, N. L., & Hammer, A. L. (1998). MBTI Manual (3rd ed.).",
  },
  {
    id: "E1",
    citation:
      "Depue, R. A., & Collins, P. F. (1999). Neurobiology of personality: dopamine, incentive motivation, and extraversion.",
  },
  { id: "E2", citation: "McClelland, D. C. (1985). Human Motivation." },
  {
    id: "P1",
    citation:
      "Kashdan, T. B., Rose, P., & Fincham, F. D. (2004). Curiosity and exploration in personality.",
  },
  {
    id: "P2",
    citation:
      "DeYoung, C. G., Quilty, L. C., & Peterson, J. B. (2007). The Big Five aspects: openness/intellect.",
  },
  {
    id: "J2",
    citation:
      "Davis, M. H. (1983). Measuring individual differences in empathy: A multidimensional approach.",
  },
  {
    id: "J3",
    citation:
      "Haidt, J. (2001). The emotional dog and its rational tail: A social intuitionist approach to moral judgment.",
  },
  {
    id: "O1",
    citation:
      "Webster, D. M., & Kruglanski, A. W. (1994). Individual differences in need for cognitive closure.",
  },
];

const dimensions: DimensionCard[] = [
  {
    key: "energy",
    title: "Energy & Attention (Extraversion / Introversion)",
    definition:
      "Energy and attention describe where you recharge. Introversion turns inward to restore energy; Extraversion turns outward to gain energy from people, activity, and engagement.",
    jung:
      "Jung framed Introversion and Extroversion as basic attitudes: whether the psyche orients primarily toward the inner world of ideas or the outer world of people and events. [J1]",
    mbti:
      "Behavior-based tests like the MBTI use I/E to describe social energy, stimulation preferences, and the pace of outward engagement. [MB1]",
    drive:
      "We estimate this from drive structure: patterns tied to social impact, affiliation, and reward sensitivity push the signal outward, while patterns tied to quiet recovery and protective focus pull it inward. Balanced signals appear as ambivalence. [E1] [E2]",
    refs: ["J1", "MB1", "E1", "E2"],
    color: {
      border: "border-emerald-200",
      bg: "bg-emerald-50/60",
      text: "text-emerald-900",
    },
  },
  {
    key: "perception",
    title: "Information Processing (Sensing / Intuition)",
    definition:
      "Information processing is how you take in information. Sensing focuses on concrete facts and what is immediately real. Intuition looks for patterns, meaning, and what might happen next.",
    jung:
      "Jung described Sensing and Intuition as two ways of perceiving: one grounded in direct sensory data, the other in inferred possibilities and patterns. [J1]",
    mbti:
      "MBTI-style tests treat S/N as a preference for detail vs pattern, present reality vs future possibility, and step-by-step vs big-picture focus. [MB1]",
    drive:
      "We infer this from whether drive responses favor concrete, immediate cues or exploration of possibilities and meaning. When both are strong, we report a flexible S/N profile. [P1] [P2]",
    refs: ["J1", "MB1", "P1", "P2"],
    color: {
      border: "border-sky-200",
      bg: "bg-sky-50/60",
      text: "text-sky-900",
    },
  },
  {
    key: "judgment",
    title: "Decision Style (Thinking / Feeling)",
    definition:
      "Decision style is how you decide. Thinking prioritizes logic, consistency, and objective criteria. Feeling prioritizes values, human impact, and what feels right for people involved.",
    jung:
      "Jung framed Thinking and Feeling as judgment functions: one evaluates by reason and coherence, the other evaluates by value and personal meaning. [J1]",
    mbti:
      "In MBTI applications, T/F is expressed as a preference for objective criteria vs relational impact when making decisions. [MB1]",
    drive:
      "We estimate this from drive structure by seeing whether your pattern emphasizes consistency and rule-coherence versus care, empathy, and value alignment. Mixed signals show up as an adaptive T/F style. [J2] [J3]",
    refs: ["J1", "MB1", "J2", "J3"],
    color: {
      border: "border-amber-200",
      bg: "bg-amber-50/60",
      text: "text-amber-900",
    },
  },
  {
    key: "orientation",
    title: "Lifestyle (Judging / Perceiving)",
    definition:
      "Lifestyle is how you organize action. Judging prefers plans, closure, and clear timelines. Perceiving prefers flexibility, open options, and discovery as new information arrives.",
    jung:
      "Jung described a broader attitude toward closure vs openness, later adapted into the J/P axis in typology systems. [J1]",
    mbti:
      "Behavior tests use J/P to capture how people structure tasks: scheduled and decisive vs exploratory and adaptable. [MB1]",
    drive:
      "We infer this from drive patterns that prioritize closure and goal completion versus exploration and keeping options open. If both are strong, we present an ambivalent, highly adaptable orientation. [O1] [E2]",
    refs: ["J1", "MB1", "O1", "E2"],
    color: {
      border: "border-violet-200",
      bg: "bg-violet-50/60",
      text: "text-violet-900",
    },
  },
];

export default function JungAnalysisTheoryPage() {
  const menu = useMemo(
    () => [
      { key: "overview", label: "Overview", icon: <BookOpen className="w-4 h-4" /> },
      { key: "energy", label: "Energy & Attention", icon: <Sparkles className="w-4 h-4" /> },
      { key: "perception", label: "Information Processing", icon: <Brain className="w-4 h-4" /> },
      { key: "judgment", label: "Decision Style", icon: <Layers className="w-4 h-4" /> },
      { key: "orientation", label: "Lifestyle", icon: <Compass className="w-4 h-4" /> },
      { key: "references", label: "References", icon: <Network className="w-4 h-4" /> },
    ],
    []
  );
  const [active, setActive] = useState<string>("overview");
  const isSelected = (k: string) => active === k;
  const activeDimension = dimensions.find((d) => d.key === active);

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <AuthHeader />

      <main className="max-w-5xl mx-auto px-6 py-16">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h1 className="text-4xl font-black uppercase italic text-slate-900">Jung Personality Theory</h1>
          </div>
          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
            Easy introduction to the classic four dimensions
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
          <aside className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Menu</div>
            {menu.map((item) => (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={`w-full flex items-center gap-2 rounded-2xl border px-4 py-3 text-[11px] font-black uppercase tracking-widest transition ${
                  isSelected(item.key)
                    ? "border-indigo-400 bg-indigo-50 text-indigo-900"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </aside>

          <div className="space-y-8">
            {active === "overview" ? (
              <section className="rounded-[2.5rem] border-2 border-indigo-100 bg-white p-8 md:p-10 shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-2xl font-black uppercase italic text-slate-900 leading-none">
                    Carl Jung’s Type Lens (Surface + Innate Persona)
                  </h2>
                </div>
                <p className="mt-4 text-sm text-slate-700/90 leading-relaxed font-medium">
                  Carl Jung proposed that personality can be understood through a small set of consistent preferences.
                  These preferences shape how we gain energy, notice information, make choices, and organize our lives.
                  Modern behavior-based tests (like the MBTI) describe these dimensions as observable patterns, while our
                  model infers them by reading the structure of underlying drives rather than relying on behavior-only
                  questionnaires.{" "}
                  <a href="#ref-j1" className="font-black text-indigo-700 hover:underline">
                    [J1]
                  </a>{" "}
                  <a href="#ref-mb1" className="font-black text-indigo-700 hover:underline">
                    [MB1]
                  </a>
                </p>
                <p className="mt-4 text-sm text-slate-700/90 leading-relaxed font-medium">
                  In <em>Psychological Types</em> (1921), Jung organized personality around two core{" "}
                  <strong>attitudes</strong>—<strong>introversion</strong> and <strong>extraversion</strong>—and four
                  primary <strong>functions</strong> of consciousness: <strong>thinking</strong>,{" "}
                  <strong>feeling</strong>, <strong>sensation</strong>, and <strong>intuition</strong>. The “type” you
                  present is not just a label: Jung argued that one function typically becomes{" "}
                  <strong>dominant</strong>, supported by auxiliary tendencies, and that this dominant function expresses
                  itself through either an introverted or extraverted attitude. This yields Jung’s well-known set of
                  “eight types” (e.g., introverted thinking, extraverted intuition, etc.).{" "}
                  <a href="#ref-j1" className="font-black text-indigo-700 hover:underline">
                    [J1]
                  </a>
                </p>
                <p className="mt-4 text-sm text-slate-700/90 leading-relaxed font-medium">
                  Later, MBTI-style frameworks expanded Jung’s ideas into four preference pairs (often called
                  “dichotomies”): <strong>Extraversion–Introversion</strong>, <strong>Sensing–Intuition</strong>,{" "}
                  <strong>Thinking–Feeling</strong>, and <strong>Judging–Perceiving</strong>. In MBTI terminology, these
                  are frequently described as: <strong>Energy Source</strong> (E/I),{" "}
                  <strong>Taking In of Information</strong> (S/N), <strong>Decision Making</strong> (T/F), and{" "}
                  <strong>Orientation to the External World</strong> (J/P).{" "}
                  <a href="#ref-mb1" className="font-black text-indigo-700 hover:underline">
                    [MB1]
                  </a>
                </p>
                <p className="mt-4 text-sm text-slate-700/90 leading-relaxed font-medium">
                  A subtle but important historical point: Jung did not present “J/P” as a standalone axis in the same
                  way later MBTI materials do. Instead, Jung distinguished between <strong>rational (judging)</strong>{" "}
                  functions (thinking/feeling) and <strong>irrational (perceiving)</strong> functions
                  (sensation/intuition), and discussed how different functions become expressed outwardly vs. inwardly
                  depending on attitude. The later J/P letter makes this outward orientation legible as a preference for{" "}
                  <em>closure/structure</em> versus <em>openness/adaptability</em> in the external world.{" "}
                  <a href="#ref-j1" className="font-black text-indigo-700 hover:underline">
                    [J1]
                  </a>{" "}
                  <a href="#ref-mb1" className="font-black text-indigo-700 hover:underline">
                    [MB1]
                  </a>
                </p>
                <hr className="my-6 border-slate-200" />
                <h3 className="text-lg font-black uppercase tracking-widest text-slate-700">References</h3>
                <ol className="mt-4 space-y-2 text-[13px] text-slate-700 list-decimal list-inside">
                  <li id="ref-j1">
                    <strong>[J1]</strong>{" "}
                    <a
                      href="https://en.wikipedia.org/wiki/Psychological_Types"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-indigo-700 hover:underline"
                    >
                      Jung, C. G. — Psychological Types (overview)
                    </a>
                  </li>
                  <li id="ref-mb1">
                    <strong>[MB1]</strong>{" "}
                    <a
                      href="https://eu.themyersbriggs.com/-/media/Files/PDFs/Book-Previews/MB6177e_preview.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-indigo-700 hover:underline"
                    >
                      The Myers-Briggs Company — MBTI preferences overview (Energy Source / Taking In of Information /
                      Decision Making / Orientation to the External World)
                    </a>
                  </li>
                </ol>
              </section>
            ) : null}

            {activeDimension ? (
              <section
                className={`rounded-[2.5rem] border-2 ${activeDimension.color.border} bg-white p-8 md:p-10 shadow-sm relative overflow-hidden`}
              >
                <div className="absolute -top-6 -right-6 text-[6rem] font-black italic text-slate-900/5 pointer-events-none select-none">
                  {activeDimension.title.split(" ")[0].toUpperCase()}
                </div>

                <div className="relative z-10">
                  <h3 className={`text-2xl font-black uppercase italic ${activeDimension.color.text} leading-none`}>
                    {activeDimension.title}
                  </h3>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6">
                      <div className="text-[13px] font-black uppercase tracking-widest text-slate-700 mb-2">
                        Definition
                      </div>
                      <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                        {activeDimension.definition}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6">
                      <div className="text-[13px] font-black uppercase tracking-widest text-slate-700 mb-2">
                        Jung&apos;s Original Framing
                      </div>
                      <p className="text-[13px] text-slate-700 leading-relaxed font-medium">{activeDimension.jung}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-3xl border border-sky-200 bg-sky-50/70 p-6">
                      <div className="text-[13px] font-black uppercase tracking-widest text-sky-900 mb-2">
                        Behavior-Based Tests (MBTI)
                      </div>
                      <p className="text-[13px] text-slate-700 leading-relaxed font-medium">{activeDimension.mbti}</p>
                    </div>
                    <div className="rounded-3xl border border-violet-200 bg-violet-50/70 p-6">
                      <div className="text-[13px] font-black uppercase tracking-widest text-violet-900 mb-2">
                        Our Drive-Based Prediction
                      </div>
                      <p className="text-[13px] text-slate-700 leading-relaxed font-medium">{activeDimension.drive}</p>
                    </div>
                  </div>

                  <div className="mt-4 text-[11px] text-slate-500 font-semibold">
                    References: {activeDimension.refs.map((r) => `[${r}]`).join(" ")}
                  </div>
                </div>
              </section>
            ) : null}

            {active === "references" ? (
              <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-2xl font-black uppercase italic text-slate-900 leading-none">References</h2>
                </div>
                <div className="mt-6 space-y-3 text-[13px] text-slate-700">
                  {references.map((ref) => (
                    <div key={ref.id}>
                      <span className="font-black text-slate-900">[{ref.id}]</span> {ref.citation}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </section>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link
            href="/reports/jung-analysis"
            className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow"
          >
            Back to Jung Report <ChevronRight size={14} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest border border-slate-200 hover:border-slate-400 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard <ChevronRight size={14} />
          </Link>
        </div>
      </main>
    </div>
  );
}
