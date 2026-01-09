// app/resources/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AuthHeader } from "@/components/AuthHeader";
import {
  LayoutDashboard,
  ChevronRight,
  BookOpen,
  Layers,
  Network,
  Users,
  HeartHandshake,
  Brain,
  Sparkles,
} from "lucide-react";

type MenuKey = "drive" | "persona" | "relationships" | "jung" | "dashboard";

type MenuItem = {
  key: MenuKey;
  label: string;
  icon: React.ReactNode;
};

export default function ResourcesPage() {
  const menu: MenuItem[] = useMemo(
    () => [
      { key: "drive", label: "Drive Structures", icon: <Network className="w-5 h-5" /> },
      { key: "persona", label: "Multiple Persona Theories", icon: <Users className="w-5 h-5" /> },
      { key: "relationships", label: "Relationships", icon: <HeartHandshake className="w-5 h-5" /> },
      { key: "jung", label: "Jung Personality Dimensions", icon: <Brain className="w-5 h-5" /> },
      { key: "dashboard", label: "Return to Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
    []
  );

  const [active, setActive] = useState<MenuKey>("drive");

  const isSelected = (k: MenuKey) => active === k;

  const Panel = () => {
    if (active === "drive") {
      return (
        <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
            DRIVES
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-600" />
              <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-none">Drive Structures</h2>
            </div>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
              The motivational backbone used across reports
            </p>

            <div className="mt-8 bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
              <div className="text-[11px] font-black uppercase tracking-widest text-indigo-900 italic mb-2">
                What you’ll find here
              </div>
              <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                A quick reference for the 7-drive system, how drive vectors are formed, and how “surface,” “innate,” and
                “imposed” components interact in your simulations.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Concepts</div>
                <ul className="mt-3 space-y-2 text-[12px] text-slate-700 font-medium list-disc pl-5">
                  <li>Drive vectors (0–5), demand vs. effective surface</li>
                  <li>Instrumentation routes: diversion + leakage</li>
                  <li>SurfaceAdjusted vs. SurfaceAdjustedAspired</li>
                  <li>Drain and transfer as “energy accounting”</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Where it’s used</div>
                <ul className="mt-3 space-y-2 text-[12px] text-slate-700 font-medium list-disc pl-5">
                  <li>Profession Fit report</li>
                  <li>Instrumentation report</li>
                  <li>Drain & Adaptation analysis</li>
                  <li>Custom job fit simulator</li>
                </ul>
              </div>
            </div>

            <div className="mt-10">
              <Link
                href="/reports/profession-fit"
                className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow"
              >
                <Sparkles className="w-4 h-4" /> Go to Profession Fit <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      );
    }

    if (active === "persona") {
      return (
        <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
            PERSONA
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-none">
                Multiple Persona Theories
              </h2>
            </div>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
              Why a single “personality” is rarely enough
            </p>

            <div className="mt-8 bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
              <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                This section frames how people express different stable/learned layers across contexts—e.g., “innate”
                preferences, “surface” adaptations, and “imposed” constraints (environment, competence, self-interest).
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Core ideas</div>
                <ul className="mt-3 space-y-2 text-[12px] text-slate-700 font-medium list-disc pl-5">
                  <li>Trait vs. state vs. role-based adaptations</li>
                  <li>Context-specific “persona” layers</li>
                  <li>Costs of adaptation: drain vs. transfer</li>
                  <li>Mismatch as a systems property (not moral failure)</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">How to use</div>
                <ul className="mt-3 space-y-2 text-[12px] text-slate-700 font-medium list-disc pl-5">
                  <li>Interpret results across time, not a single snapshot</li>
                  <li>Use Drain Analysis to find costly compensations</li>
                  <li>Use Aspired vs. Job Match to compare “want” vs. “fit”</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (active === "relationships") {
      return (
        <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
            LOVE
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-indigo-600" />
              <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-none">Relationships</h2>
            </div>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
              Couple theory references and needs frameworks
            </p>

            <div className="mt-8 bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
              <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                Jump into the curated theory library (attachment, responsiveness, autonomy support, commitment, fairness,
                repair, thriving support) and the APA references you can cite in your relationship needs analysis.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/resources/relationship"
                className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow"
              >
                <BookOpen className="w-4 h-4" /> Open Relationship References <ChevronRight size={14} />
              </Link>

              <Link
                href="/drain-analysis"
                className="inline-flex items-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest border border-slate-200 hover:border-slate-400 transition-all"
              >
                <Layers className="w-4 h-4" /> Go to Drain Analysis <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      );
    }

    if (active === "jung") {
      return (
        <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
            JUNG
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600" />
              <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-none">
                Jung Personality Dimensions
              </h2>
            </div>
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
              A conceptual bridge to typology-based language
            </p>

            <div className="mt-8 bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
              <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                Placeholder panel for Jungian dimensions / typology references. You can link out to a dedicated page later
                (e.g., /resources/jung) once the content is finalized.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Suggested content</div>
                <ul className="mt-3 space-y-2 text-[12px] text-slate-700 font-medium list-disc pl-5">
                  <li>Introversion–Extraversion</li>
                  <li>Sensing–Intuition</li>
                  <li>Thinking–Feeling</li>
                  <li>Judging–Perceiving (via later typology)</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notes</div>
                <ul className="mt-3 space-y-2 text-[12px] text-slate-700 font-medium list-disc pl-5">
                  <li>Use as language for preferences—not as destiny</li>
                  <li>Pair with drive vectors for behavioral grounding</li>
                  <li>Avoid over-fitting to type labels in conflict</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      );
    }

    // dashboard
    return (
      <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
          HOME
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-600" />
            <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-none">Return to Dashboard</h2>
          </div>

          <p className="mt-4 text-sm text-slate-700 font-medium leading-relaxed">
            Jump back to your main dashboard to run reports and simulations.
          </p>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow"
            >
              <LayoutDashboard className="w-4 h-4" /> Go to Dashboard <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <AuthHeader />

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <section className="mb-10">
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-black uppercase italic text-slate-900 leading-none">
                Resource <span className="text-indigo-600">Library</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">
                Quick references for theory, constructs, and report interpretation
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
              Select a topic on the left. The right panel shows a short overview and links to deeper pages (when
              available).
            </p>
          </div>
        </section>

        {/* Two-panel layout */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left menu */}
          <aside className="lg:col-span-2">
            <div className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-slate-700" />
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-700">Menu</div>
              </div>

              <div className="space-y-2">
                {menu.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => {
                      if (m.key === "dashboard") {
                        // keep in-panel option, but also allow immediate navigation via the button below in the panel
                        setActive("dashboard");
                        return;
                      }
                      setActive(m.key);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all text-left ${
                      isSelected(m.key)
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-800 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`${isSelected(m.key) ? "text-white" : "text-slate-700"}`}>{m.icon}</span>
                      <span className="text-[11px] font-black uppercase tracking-widest">{m.label}</span>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`${isSelected(m.key) ? "text-white" : "text-slate-400"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right content */}
          <div className="lg:col-span-3">
            <Panel />
          </div>
        </section>
      </main>
    </div>
  );
}