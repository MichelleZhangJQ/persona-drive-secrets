"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";
import Link from "next/link";
import dynamic from "next/dynamic";

import { DownloadInstrumentationPDFButton } from "../_components/DownloadInstrumentationPDFButton";
import {
  calculateInnateScores,
  getInnateDriveDetails,
  getSurfaceDriveDetails,
  calculateImposedSatisfaction,
} from "@/lib/core-utils/fit-core";
import {
  Loader2,
  ShieldAlert,
  Zap,
  Lock,
  ArrowDownCircle,
  ArrowUpCircle,
  LayoutDashboard,
  ChevronRight,
  Download,
} from "lucide-react";

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

export default function InstrumentationReport() {
  const supabase = createBrowserSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [reportFlow, setReportFlow] = useState<any[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [summaryCounts, setSummaryCounts] = useState({ suppression: 0, priority: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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

        const innateScores = calculateInnateScores(innateRes.data) || {};
        const imposedSatisfaction = calculateImposedSatisfaction(imposedRes.data) || {};
        const q18 = Number(surfaceRes.data?.q18_answer) || 0;
        const q19 = Number(surfaceRes.data?.q19_answer) || 0;
        const q20 = Number(surfaceRes.data?.q20_answer) || 0;

        const sortedDrives = Object.entries(innateScores).sort(([, a]: any, [, b]: any) => b - a);

        let totalSuppression = 0;
        let totalPriority = 0;

        const analysis = sortedDrives.map(([driveName], index) => {
          const innatePairs = getInnateDriveDetails(driveName, innateRes.data) || [];
          const surfacePairs = getSurfaceDriveDetails(driveName, surfaceRes.data) || [];
          const reversals: any[] = [];

          innatePairs.forEach(([otherDrive, innateVal]: [string, number]) => {
            if (innateVal > 3) {
              const surfaceMatch = surfacePairs.find(
                ([d]) => d.toLowerCase().replace(/private|public/i, "") === otherDrive.toLowerCase()
              );

              if (surfaceMatch && surfaceMatch[1] <= 3) {
                const satisfaction = imposedSatisfaction[driveName] ?? 0;
                let reason = "prioritization";

                if (satisfaction < 3) {
                  reason = "suppression";
                  totalSuppression++;

                  // ✅ Option B: store structured fields instead of a fully-rendered string
                  reversals.push({
                    reason,
                    sourceDrive: driveName.toLowerCase(),
                    targetDrive: otherDrive.toLowerCase(),
                    template: "suppression_compensation",
                  });
                } else {
                  reason = "prioritization";
                  totalPriority++;

                  // ✅ Option B
                  reversals.push({
                    reason,
                    sourceDrive: driveName.toLowerCase(),
                    targetDrive: otherDrive.toLowerCase(),
                    template: "prioritization_redirect",
                  });
                }
              }
            }
          });

          let contextualNote = "";
          const targetDrives = ["Dominance", "Affiliation", "Pleasure"];
          if (targetDrives.includes(driveName) && (q18 < 3 || q19 < 3 || q20 < 3)) {
            contextualNote = `Because of your preference for private contexts, you likely only manifest the ${driveName.toLowerCase()} drive in smaller groups or more private settings.`;
          }

          const satisfaction = imposedSatisfaction[driveName] ?? 0;

          // NEW: Low satisfaction + no instrumentation => genuine passion note
          const hasNoInstrumentation = reversals.length === 0;
          const isLowSatisfaction = satisfaction < 3;

          const genuinePassionNote =
            isLowSatisfaction && hasNoInstrumentation
              ? `Even though your environment currently undersatisfies your ${driveName.toLowerCase()} drive, it is not being instrumentalized into other drives. This usually indicates a genuine, self-directed passion to fulfill it on its own terms.`
              : "";

          return {
            name: driveName,
            rank: index + 1,
            score: innateScores[driveName] ?? 0,
            satisfaction,
            contextualNote,
            genuinePassionNote,
            reversals,
          };
        });

        setSummaryCounts({ suppression: totalSuppression, priority: totalPriority });
        setReportFlow(analysis);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest italic">Calculating Adaptation Vectors...</p>
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
      <main className="max-w-4xl mx-auto px-6 py-16">
        <section className="mb-20">
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-black uppercase italic text-slate-900 leading-none">
                Instrumentation <span className="text-indigo-600">Analysis</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">
                Structural Adaptation Profile
              </p>
            </div>

            {/* Top Right Download Button */}
            <div className="flex justify-center">
              {isClient && reportFlow.length > 0 && (
                <DownloadInstrumentationPDFButton reportFlow={reportFlow} driveDefinitions={driveDefinitions} />
              )}
            </div>
          </header>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 md:p-10">
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-900 mb-4 italic">
              About this Report
            </h3>
            <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
              <strong>Instrumentation</strong> maps the tension between who you are and what your environment demands.
              It occurs when your innate drives are deprioritized due to your environment, forcing other drives to act as
              instruments for compensation. While successful <strong>adaptation</strong> allows you to thrive under
              pressure, unresolved instrumentation leads to <strong>suppression</strong> and internal conflict. Below,
              we list your dirves by your innate preference ranking. If it is demoted to a lower priority in your surface
              persona, we then report whether it is due to instrumentation adaptation, or suppression.
            </p>
          </div>
        </section>

        {/* Drives List */}
        <div className="space-y-16">
          {reportFlow.map((item) => {
            const colors = driveColors[item.name] || driveColors.Dominance;
            const explanation = driveDefinitions[item.name] || "a core psychological motivator.";
            const satisfaction = item.satisfaction ?? 0;

            return (
              <section
                key={item.name}
                className={`rounded-[2.5rem] border-2 ${colors.border} ${colors.bg} p-8 md:p-12 shadow-sm relative overflow-hidden`}
              >
                <div className="absolute -top-4 -right-2 text-[10rem] font-black italic text-slate-900/5 pointer-events-none select-none">
                  {item.rank}
                </div>
                <div className="flex items-center gap-6 mb-10 relative z-10">
                  <div
                    className={`w-16 h-16 ${colors.accent} text-white rounded-3xl flex items-center justify-center font-black text-3xl italic shadow-lg`}
                  >
                    {item.name[0]}
                  </div>
                  <div>
                    <h2 className={`text-3xl font-black ${colors.text} uppercase italic leading-none`}>{item.name}</h2>
                    <div className="flex gap-2 mt-3">
                      <span className="text-[9px] font-black bg-white/60 px-2 py-1 rounded text-slate-600 uppercase tracking-widest border border-slate-200">
                        Rank {item.rank} of 7
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-1 rounded text-white uppercase tracking-widest shadow-sm ${
                          satisfaction < 3 ? "bg-rose-500" : "bg-emerald-500"
                        }`}
                      >
                        Satisfaction: {satisfaction.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2">
                      <Zap size={14} /> Innate Positioning
                    </h3>
                    <div className="space-y-3">
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        The <strong>{item.name.toLowerCase()}</strong> drive is {explanation} It is ranked{" "}
                        <strong>#{item.rank}</strong> in your innate persona.
                      </p>

                      {/* NEW: Genuine passion note */}
                      {item.genuinePassionNote && (
                        <p className="text-[11px] text-slate-700/80 leading-relaxed font-medium italic border-l-2 border-amber-400 pl-4 py-1 bg-white/40 rounded-r-md">
                          {item.genuinePassionNote}
                        </p>
                      )}

                      {item.contextualNote && (
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic border-l-2 border-slate-300 pl-4 py-1">
                          {item.contextualNote}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-2">
                      <ShieldAlert size={14} /> Drive Instrumentation
                    </h3>

                    {item.reversals.length > 0 ? (
                      item.reversals.map((rev: any, rIdx: number) => {
                        const isSuppression = rev.reason === "suppression";

                        return (
                          <div
                            key={rIdx}
                            className={`p-5 rounded-2xl border ${
                              isSuppression ? "bg-white/80 border-rose-200" : "bg-white/80 border-blue-200"
                            } shadow-sm`}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              {isSuppression ? (
                                <ArrowDownCircle size={16} className="text-rose-500" />
                              ) : (
                                <ArrowUpCircle size={16} className="text-blue-500" />
                              )}
                              <span
                                className={`text-[10px] font-black uppercase tracking-widest ${
                                  isSuppression ? "text-rose-700" : "text-blue-700"
                                }`}
                              >
                                {isSuppression ? "Drive Suppression" : "Drive Instrumentation"}
                              </span>
                            </div>

                            {/* ✅ Option B: render structured text so we can bold the target drive */}
                            {rev.template === "suppression_compensation" ? (
                              <p className="text-[11px] font-medium leading-relaxed text-slate-600">
                                Your environment prevents you from satisfying the{" "}
                                <strong>{rev.sourceDrive}</strong> drive directly, while compensating it with the{" "}
                                <strong>{rev.targetDrive}</strong> drive is not fully satisfactory.
                              </p>
                            ) : rev.template === "prioritization_redirect" ? (
                              <p className="text-[11px] font-medium leading-relaxed text-slate-600">
                                Your <strong>{rev.sourceDrive}</strong> drive is compensated by redirecting some of its
                                energy to the <strong>{rev.targetDrive}</strong> drive.
                              </p>
                            ) : (
                              // Backward compatibility: if something older still has `description`
                              <p className="text-[11px] font-medium leading-relaxed text-slate-600">{rev.description}</p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-8 bg-white/40 rounded-3xl border border-dashed border-slate-300 text-center">
                        <div className="text-emerald-500 mb-2 font-black italic text-sm">NO INSTRUMENTATION</div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Natural Alignment Maintained
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* Strategic Synthesis - Gray/Light Mode */}
        <section className="mt-24 space-y-8">
          <div className="bg-slate-100 border border-slate-200 rounded-[3rem] p-10 md:p-14 text-slate-900 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl font-black uppercase italic leading-none">
                Strategic <span className="text-indigo-600">Synthesis</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {summaryCounts.suppression > 0 && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600">
                      Regarding Suppressed Drives
                    </span>
                    <p className="text-sm font-medium leading-relaxed text-slate-600">
                      We've identified areas where your innate drives are currently suppressed. To maintain long-term
                      well-being, find a balanced approach that respects both inner needs and environmental demands.
                      Please explore our
                    </p>
                  </div>
                )}
                {summaryCounts.priority > 0 && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">
                      Regarding Drive Instrumention
                    </span>
                    <p className="text-sm font-medium leading-relaxed text-slate-600">
                      While your innate drives are largely fulfilled, your environment necessitates a strategic shift in
                      priority. When this realignment occurs without causing internal friction, it represents an
                      effective instrumentation, where one drive is successfully utilized to support the needs of
                      another. This highlights your adaptive flexibility, though you retain the agency to revert to your
                      innate priorities whenever the situation demands.
                    </p>
                  </div>
                )}
              </div>
              <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 italic">
                  Integration complete. Behavioral vectors aligned.
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