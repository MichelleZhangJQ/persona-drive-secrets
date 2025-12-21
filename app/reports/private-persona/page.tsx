"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";
import Link from "next/link";
// Import the centralized utility
import { calculatePrivateScores, driveNames } from "@/lib/persona-utils";

export default function PrivatePersonaReport() {
  const supabase = createBrowserSupabaseClient();
  const [data, setData] = useState<any>(null);
  
  // Theme Colors
  const themeBlue = "#7c94be"; // Muted Blue for Private Page Theme
  const sage = "#93a97c";
  const deepPurple = "#2e1065";

  // Pie Chart Colors (Matched to Public Persona Report)
  const pieColors = {
    epistemic: "#6366f1", // Blue
    feeling: "#e66a2c",   // Orange
    desire: "#f4ee3f"    // Yellow
  };

  const driveDescriptions: Record<string, string> = {
    Exploration: "intellectual curiosity and the pursuit of new ideas even without guaranteed rewards.",
    Care: "the wellbeing of those close to you and maintaining nurturing relationships.",
    Affiliation: "group harmony and your sense of belonging within your social circle.",
    Value: "your core moral convictions and staying loyal to your internal principles.",
    Achievement: "tangible success and the pursuit of clear, valuable accomplishments.",
    Dominance: "personal agency, decision-making power, and influencing outcomes.",
    Pleasure: "comfort, relaxation, and the enjoyment of life's experiences."
  };

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: testData } = await supabase
        .from('private-persona')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (testData) {
        // --- UTILIZING CENTRALIZED UTILITY ---
        const scores = calculatePrivateScores(testData);

        if (scores) {
          const eScore = scores.Exploration;
          const fScore = (scores.Care + scores.Affiliation + scores.Value) / 3;
          const dScore = (scores.Achievement + scores.Dominance + scores.Pleasure) / 3;
          const totalScore = eScore + fScore + dScore;

          setData({
            drives: driveNames.map(name => ({
              name,
              val: scores[name as keyof typeof scores],
              desc: driveDescriptions[name]
            })),
            pie: {
              e: totalScore > 0 ? (eScore / totalScore) * 100 : 0,
              f: totalScore > 0 ? (fScore / totalScore) * 100 : 0,
              d: totalScore > 0 ? (dScore / totalScore) * 100 : 0
            }
          });
        }
      }
    }
    fetchData();
  }, [supabase]);

  if (!data) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Loading Insights...</div>;

  // Dominance Logic: Drives with a value above 3.0
  const dominantDrives = data.drives.filter((d: any) => d.val > 3);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <AuthHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-black uppercase tracking-widest" style={{ color: themeBlue }}>
            Private Persona Report
          </h1>
          <p className="text-slate-500 mt-2 italic text-sm font-bold uppercase tracking-widest">Internal Motivation Analysis</p>
        </header>

        <section className="rounded-3xl border-t-8 bg-white shadow-2xl overflow-hidden mb-12" style={{ borderColor: themeBlue }}>
          <div className="px-8 py-4 text-white flex justify-between items-center" style={{ backgroundColor: themeBlue }}>
            <h2 className="text-xl font-black uppercase tracking-widest">Internal Landscape</h2>
            <span className="text-[10px] font-bold opacity-80 italic tracking-widest">SECURE DATA</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* LEFT PANEL: Charts */}
            <div className="p-8 border-r border-slate-100 bg-slate-50/50 flex flex-col gap-10">
              
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Drive Composition</h3>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6">
                  <div className="flex items-center gap-8 justify-center">
                    <div className="relative h-32 w-32 shrink-0">
                      <svg viewBox="0 0 32 32" className="h-full w-full -rotate-90 rounded-full">
                        {/* Epistemic - Blue */}
                        <circle r="16" cx="16" cy="16" fill="transparent" stroke={pieColors.epistemic} strokeWidth="32" strokeDasharray={`${data.pie.e} 100`} />
                        {/* Feeling - Orange */}
                        <circle r="16" cx="16" cy="16" fill="transparent" stroke={pieColors.feeling} strokeWidth="32" strokeDasharray={`${data.pie.f} 100`} strokeDashoffset={`-${data.pie.e}`} />
                        {/* Desire - Yellow */}
                        <circle r="16" cx="16" cy="16" fill="transparent" stroke={pieColors.desire} strokeWidth="32" strokeDasharray={`${data.pie.d} 100`} strokeDashoffset={`-${data.pie.e + data.pie.f}`} />
                      </svg>
                    </div>
                  </div>
                  <div className="flex justify-center gap-6 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: pieColors.epistemic }} /> Epistemic</div>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: pieColors.feeling }} /> Feeling</div>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: pieColors.desire }} /> Desire</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detailed Drive Strength</h3>
                <div className="space-y-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  {data.drives.map((drive: any) => (
                    <div key={drive.name}>
                      <div className="flex justify-between text-[10px] font-black uppercase mb-1.5 text-slate-500">
                        <span>{drive.name}</span>
                        <span>{drive.val.toFixed(1)}</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-1000 ease-out" 
                          style={{ width: `${(drive.val / 5) * 100}%`, backgroundColor: themeBlue }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT PANEL: Narratives */}
            <div className="p-8 flex flex-col gap-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Prioritization Narrative</h3>
              <div className="bg-slate-50/50 rounded-2xl p-8 border border-slate-100 space-y-6">
                {dominantDrives.length > 0 ? (
                  dominantDrives.map((drive: any) => (
                    <div key={drive.name} className="border-l-4 pl-6" style={{ borderColor: themeBlue }}>
                      <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                        <span className="font-black uppercase text-[10px] block mb-1" style={{ color: themeBlue }}>{drive.name} Drive</span>
                        In your own private perception, you prioritize {drive.desc}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-[12px] text-slate-400 italic">No single drive exceeds the significant threshold of 3.0.</p>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* --- NAVIGATION FOOTER --- */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-16 max-w-4xl mx-auto">
          <Link 
            href="/tests/public-persona" 
            className="w-full sm:w-auto px-8 py-4 border-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all text-center hover:bg-white"
            style={{ borderColor: sage, color: sage }}
          >
            Retake Public Persona Test
          </Link>

          <Link 
            href="/tests/private-persona" 
            className="w-full sm:w-auto px-8 py-4 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:brightness-110 transition-all text-center" 
            style={{ backgroundColor: themeBlue }}
          >
            Retake This Test
          </Link>

          <Link 
            href="/tests/innate-persona" 
            className="w-full sm:w-auto px-8 py-4 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:brightness-110 transition-all text-center" 
            style={{ backgroundColor: deepPurple }}
          >
            Take Innate Persona Test
          </Link>
        </div>
      </main>
    </div>
  );
}