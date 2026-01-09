// app/theories/page.tsx
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
  Split,
  Leaf,
  Sparkles,
} from "lucide-react";

type MenuKey =
  | "couples"
  | "driveStructure"
  | "innerConflicts"
  | "adaptation"
  | "multiplePersonas"
  | "dashboard";

type MenuItem = {
  key: MenuKey;
  label: string;
  icon: React.ReactNode;
};

export default function TheoriesPage() {
  const menu: MenuItem[] = useMemo(
    () => [
      { key: "couples", label: "Couple's Theory", icon: <HeartHandshake className="w-5 h-5" /> },
      { key: "driveStructure", label: "Drive Structure Theory", icon: <Network className="w-5 h-5" /> },
      { key: "innerConflicts", label: "Reasons for Inner Conflicts", icon: <Split className="w-5 h-5" /> },
      { key: "adaptation", label: "Environmental Adaptation Strategies", icon: <Leaf className="w-5 h-5" /> },
      { key: "multiplePersonas", label: "Multiple Personas", icon: <Users className="w-5 h-5" /> },
      { key: "dashboard", label: "Return to Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
    []
  );

  const [active, setActive] = useState<MenuKey>("couples");
  const isSelected = (k: MenuKey) => active === k;

  const Panel = () => {
    if (active === "couples") {
      return (
        <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
            LOVE
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-indigo-600" />
              <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-none">Couple&apos;s Theory</h2>
            </div>

            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
              Relationship needs, support dynamics, and stability mechanisms
            </p>

            <div className="mt-8 bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
              <div className="text-[11px] font-black uppercase tracking-widest text-indigo-900 italic mb-2">
                What you’ll find here
              </div>
              <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                A drive-based model of relationship needs: what you tend to need (receiving drives), what a partner can
                supply (supporting drives), and how compensatory routes can stabilize the system when direct alignment is
                imperfect.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/theories/relationship"
                className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow"
              >
                <BookOpen className="w-4 h-4" /> Open Couple&apos;s Theory <ChevronRight size={14} />
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-full font-black uppercase italic text-[11px] tracking-widest border border-slate-200 hover:border-slate-400 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard <ChevronRight size={14} />
              </Link>
            </div>

            <div className="mt-6 text-[11px] text-slate-600 font-medium">
              Link:{" "}
              <Link href="/theories/relationship" className="font-black text-indigo-700 hover:underline">
                /theory/relationship
              </Link>
            </div>
          </div>
        </section>
      );
    }

    if (active === "driveStructure") {
      return (
        <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
            DRIVE
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-600" />
              <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-none">
                Drive Structure Theory
              </h2>
            </div>

            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
              How drives are organized, expressed, and constrained
            </p>

            <div className="mt-8 bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
              <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                A theory page describing how innate/surface layers interact, how constraints/caps emerge, and how the
                same drive can be expressed differently across contexts.
              </p>
            </div>

            <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
              Coming soon
            </div>
          </div>
        </section>
      );
    }

    if (active === "innerConflicts") {
      return (
        <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
            WHY
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Split className="w-5 h-5 text-indigo-600" />
              <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-none">
                Reasons for Inner Conflicts
              </h2>
            </div>

            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
              Why parts of you pull in different directions
            </p>

            <div className="mt-8 bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
              <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                A framework for explaining conflicts between incentives, values, and needs—plus how to diagnose the tradeoff
                structure and resolve it cleanly.
              </p>
            </div>

            <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
              Coming soon
            </div>
          </div>
        </section>
      );
    }

    if (active === "adaptation") {
      return (
        <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
            ADAPT
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-indigo-600" />
              <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-none">
                Environmental Adaptation Strategies
              </h2>
            </div>

            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
              How context shapes behavior and coping
            </p>

            <div className="mt-8 bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
              <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                A theory page on how people adapt to environments and stressors—protective strategies, growth strategies,
                and stability tactics (and the costs/tradeoffs of each).
              </p>
            </div>

            <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
              Coming soon
            </div>
          </div>
        </section>
      );
    }

    if (active === "multiplePersonas") {
      return (
        <section className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
            SELF
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-none">Multiple Personas</h2>
            </div>

            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
              Role-based selves and situational profiles
            </p>

            <div className="mt-8 bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
              <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
                A theory page for why different contexts evoke different persona patterns (work, family, romance,
                leadership), and how to coordinate them rather than letting them compete.
              </p>
            </div>

            <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
              Coming soon
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
            Jump back to your main dashboard to run tests and view reports.
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
                Theory <span className="text-indigo-600">Library</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">
                Concept pages that define the models behind your reports
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
              Select a topic on the left. The right panel shows an overview and links to the theory page (when available).
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
                    onClick={() => setActive(m.key)}
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
                    <ChevronRight size={16} className={`${isSelected(m.key) ? "text-white" : "text-slate-400"}`} />
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