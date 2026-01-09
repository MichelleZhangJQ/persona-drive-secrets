"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";
import Link from "next/link";
import { calculateInnateScores, driveNames } from "@/lib/core-utils/fit-core";

export default function InnatePersonaReport() {
  const supabase = createBrowserSupabaseClient();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const dustyPurple = "#a28bb5"; 
  const themeBlue = "#7c94be";    
  const rosewood = "#651010";     
  const pieColors = { epistemic: "#6366f1", feeling: "#e66a2c", desire: "#f4ee3f" };

  const driveDescriptions: Record<string, string> = {
    Exploration: "discovery is your primary anchor; you do not explore to achieve, you achieve to keep exploring.",
    Achievement: "competence is an end in itself; you seek excellence because it is your natural state of operation.",
    Dominance: "agency is non-negotiable; you influence outcomes because your instinct requires a seat at the wheel.",
    Pleasure: "the quality of your experience is the ultimate metric of a life well-lived.",
    Care: "nurturing others is your fundamental orientation, not a social obligation but a core necessity.",
    Affiliation: "belonging is your bedrock; your identity is inextricably linked to your place within the collective.",
    Value: "integrity is your gravity; you do not act on values to be 'good', but because you cannot act otherwise."
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        
        const { data: testData } = await supabase
          .from('innate-persona')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (testData) {
          const scores = calculateInnateScores(testData);

          if (scores) {
            const eScore = scores.Exploration;
            const fScore = (scores.Care + scores.Affiliation + scores.Value) / 3;
            const dScore = (scores.Achievement + scores.Dominance + scores.Pleasure) / 3;
            const total = eScore + fScore + dScore;

            setData({
              drives: driveNames.map(name => ({
                name,
                val: scores[name as keyof typeof scores],
                desc: driveDescriptions[name]
              })),
              pie: { 
                e: total > 0 ? (eScore / total) * 100 : 0, 
                f: total > 0 ? (fScore / total) * 100 : 0, 
                d: total > 0 ? (dScore / total) * 100 : 0 
              }
            });
          }
        }
      } catch (error) {
        console.error("Error fetching innate persona:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Unlocking Core Instincts...</div>;

  if (!data || !data.pie) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center">
      <h2 className="text-xl font-black uppercase tracking-widest text-slate-400 mb-6">Innate Data Not Found</h2>
      <Link href="/tests/innate-persona" className="px-8 py-4 bg-black text-white rounded-full font-bold uppercase text-xs tracking-widest">
        Take the Test
      </Link>
    </div>
  );

  const dominantDrives = data.drives.filter((d: any) => d.val >= 3.5).sort((a: any, b: any) => b.val - a.val);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <AuthHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-black uppercase tracking-[0.25em]" style={{ color: dustyPurple }}>
            Innate Persona Report
          </h1>
          <p className="text-slate-400 mt-2 font-bold text-xs uppercase tracking-[0.2em]">The Biological Bedrock of Motivation</p>
        </header>

        <section className="rounded-3xl border-t-8 bg-white shadow-2xl overflow-hidden mb-12" style={{ borderColor: dustyPurple }}>
          <div className="px-8 py-5 text-white flex justify-between items-center" style={{ backgroundColor: dustyPurple }}>
            <h2 className="text-lg font-black uppercase tracking-widest">Fixed Motivation Profile</h2>
            <span className="text-[10px] font-bold opacity-60 tracking-[0.2em]">CORE ARCHIVE</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            <div className="p-10 border-r border-slate-100 bg-slate-50/40 flex flex-col gap-12">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Structural Composition</h3>
                <div className="flex justify-center relative">
                  <div className="h-44 w-44 rounded-full overflow-hidden shadow-sm border-2 border-white">
                    {/* SVG renders only when data.pie is guaranteed */}
                    <svg viewBox="0 0 32 32" className="h-full w-full -rotate-90">
                      <circle r="16" cx="16" cy="16" fill="transparent" stroke={pieColors.epistemic} strokeWidth="32" strokeDasharray={`${data.pie.e} 100`} />
                      <circle r="16" cx="16" cy="16" fill="transparent" stroke={pieColors.feeling} strokeWidth="32" strokeDasharray={`${data.pie.f} 100`} strokeDashoffset={`-${data.pie.e}`} />
                      <circle r="16" cx="16" cy="16" fill="transparent" stroke={pieColors.desire} strokeWidth="32" strokeDasharray={`${data.pie.d} 100`} strokeDashoffset={`-${data.pie.e + data.pie.f}`} />
                    </svg>
                  </div>
                </div>
                <div className="flex justify-center gap-6 mt-8">
                  {['Epistemic', 'Feeling', 'Desire'].map((label, i) => (
                    <div key={label} className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: Object.values(pieColors)[i] }} /> {label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Innate Drive Magnitude</h3>
                <div className="space-y-6">
                  {data.drives.map((drive: any) => (
                    <div key={drive.name}>
                      <div className="flex justify-between text-[10px] font-bold uppercase mb-2 text-slate-400">
                        <span>{drive.name}</span>
                        <span style={{ color: dustyPurple }}>{drive.val.toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-1000" style={{ width: `${(drive.val/5)*100}%`, backgroundColor: dustyPurple }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-10 flex flex-col gap-8 bg-white">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Prioritization Anchors</h3>
              <div className="space-y-8">
                {dominantDrives.length > 0 ? (
                  dominantDrives.map((drive: any) => (
                    <div key={drive.name} className="relative pl-8 border-l-4" style={{ borderColor: dustyPurple }}>
                      <div className="text-[13px] text-slate-700 leading-relaxed">
                        <strong className="block text-[11px] uppercase tracking-widest mb-2" style={{ color: dustyPurple }}>{drive.name} Drive</strong>
                        As an anchoring point of your innate persona, you do not instrumentalize this drive for others. You prioritize {drive.desc}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">No drive currently acts as a dominant innate anchor.</p>
                )}
              </div>
              <div className="mt-auto p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-[11px] text-slate-500 leading-relaxed">
                "The Innate Persona represents your internal 'gravity'. These drives are not strategies you employ, but the reasons you exist within your environment."
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <Link href="/tests/surface-persona" className="px-8 py-5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-center shadow-xl hover:brightness-110 transition-all" style={{ backgroundColor: themeBlue }}>
            Retake Private Persona Test
          </Link>
          <Link href="/tests/innate-persona" className="px-8 py-5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-center shadow-xl hover:brightness-110 transition-all" style={{ backgroundColor: dustyPurple }}>
            Retake This Test
          </Link>
          <Link href="/reports/overall" className="px-8 py-5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-center shadow-xl hover:brightness-110 transition-all" style={{ backgroundColor: rosewood }}>
            Overall Report
          </Link>
        </div>
      </main>
    </div>
  );
}