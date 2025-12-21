"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";
import Link from "next/link";
// Adjusted import to match your project structure
import { 
  calculateInnateScores, 
  calculatePrivateScores, 
  calculatePublicScores, 
  driveNames 
} from "@/lib/persona-utils";

export default function OverallReport() {
  const supabase = createBrowserSupabaseClient();
  const [data, setData] = useState<any>(null);
  const [instrumentationList, setInstrumentationList] = useState<string[]>([]);
  const [missingTests, setMissingTests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const rosewood = "#c77b84";
  const pubColor = "#93a97c";
  const privColor = "#7c94be";
  const innColor = "#a28bb5";
  const pieColors = { epistemic: "#6366f1", feeling: "#e66a2c", desire: "#f4ee3f" };

  const getTailoredAdvice = (front: string, back: string) => {
    const adviceMap: Record<string, string> = {
      "Exploration-Achievement": "You pay close attention to reaching milestones for the purpose of opening up new avenues for discovery.",
      "Exploration-Dominance": "You focus on maintaining influence for the purpose of clearing a path for your personal growth and exploration.",
      "Exploration-Pleasure": "You pay attention to moments of enjoyment for the purpose of keeping your mind open and curious.",
      "Exploration-Care": "You focus on the well-being of others for the purpose of creating a stable environment for collective growth.",
      "Exploration-Affiliation": "You pay attention to your bonds with others for the purpose of supporting your exploration goals through shared perspectives.",
      "Exploration-Value": "You hold tight to your moral framework for the purpose of safely navigating through new and unknown territory.",
      "Care-Achievement": "You pay attention to your personal success for the purpose of better protecting and providing for those you care about.",
      "Care-Dominance": "You focus on holding a position of influence for the purpose of ensuring the safety of your community.",
      "Care-Pleasure": "You pay attention to your own comfort for the purpose of sustaining the energy you need to look after others.",
      "Affiliation-Achievement": "You focus on your accomplishments for the purpose of deepening your sense of belonging within your peer groups.",
      "Affiliation-Dominance": "You pay attention to your social standing for the purpose of fostering stronger, more unified bonds.",
      "Affiliation-Pleasure": "You lean into shared moments of joy for the purpose of strengthening the emotional glue in your relationships.",
      "Value-Achievement": "You pay close attention to your excellence for the purpose of honoring the high standards you set for yourself.",
      "Value-Dominance": "You focus on your personal influence for the purpose of standing up for the ethical causes you believe in.",
      "Value-Pleasure": "You pay attention to what brings you joy for the purpose of ensuring your life stays in harmony with your deepest beliefs.",
    };
    const key = `${front}-${back}`;
    return adviceMap[key] || `You pay attention to your **${back}** drive for the purpose of supporting your **${front}** goals.`;
  };

  useEffect(() => {
    async function fetchAllData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [pubRes, privRes, innRes] = await Promise.all([
        supabase.from('public-persona').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('private-persona').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('innate-persona').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
      ]);

      // 1. Protection: Identify missing data
      const missing = [];
      if (!innRes.data) missing.push("Innate Persona");
      if (!privRes.data) missing.push("Private Persona");
      if (!pubRes.data) missing.push("Public Persona");

      if (missing.length > 0) {
        setMissingTests(missing);
        setLoading(false);
        return;
      }

      // 2. Calculation: Use centralized formulas from /lib/persona-utils
      const innObj = calculateInnateScores(innRes.data)!;
      const privObj = calculatePrivateScores(privRes.data)!;
      const pubObj = calculatePublicScores(pubRes.data)!;

      const normalizedInn = driveNames.map(name => ({ name, val: innObj[name as keyof typeof innObj] }));
      const normalizedPriv = driveNames.map(name => ({ name, val: privObj[name as keyof typeof privObj] }));
      const normalizedPub = driveNames.map(name => ({ name, val: pubObj[name as keyof typeof pubObj] }));

      // 3. Instrumentation Logic
      const pairs = [
        { q: 1, front: "Exploration", back: "Achievement" }, { q: 2, front: "Exploration", back: "Dominance" },
        { q: 3, front: "Exploration", back: "Pleasure" }, { q: 4, front: "Exploration", back: "Care" },
        { q: 5, front: "Exploration", back: "Affiliation" }, { q: 6, front: "Exploration", back: "Value" },
        { q: 7, front: "Care", back: "Achievement" }, { q: 8, front: "Care", back: "Dominance" },
        { q: 9, front: "Care", back: "Pleasure" }, { q: 10, front: "Affiliation", back: "Achievement" },
        { q: 11, front: "Affiliation", back: "Dominance" }, { q: 12, front: "Affiliation", back: "Pleasure" },
        { q: 13, front: "Value", back: "Achievement" }, { q: 14, front: "Value", back: "Dominance" },
        { q: 15, front: "Value", back: "Pleasure" }
      ];

      const instrum = pairs
        .filter(p => {
          const privFront = 6 - Number(privRes.data[`q${p.q}_answer`]);
          const innFront = Number(innRes.data[`q${p.q}_answer`]);
          return (privFront - innFront >= 1) && (innFront >= 2.5);
        })
        .map(p => getTailoredAdvice(p.front, p.back));

      setInstrumentationList(instrum);
      setData({ pub: normalizedPub, priv: normalizedPriv, inn: normalizedInn });
      setLoading(false);
    }
    fetchAllData();
  }, [supabase]);

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Synthesizing Overall Report...</div>;

  // Render Missing Tests View
  if (missingTests.length > 0) {
    return (
      <div className="min-h-screen bg-[#fffafa] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border-t-8" style={{ borderColor: rosewood }}>
          <h2 className="text-xl font-black uppercase tracking-widest mb-4" style={{ color: rosewood }}>Incomplete Profile</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            We need all three persona layers to generate an Integrated Analysis. Please complete:
          </p>
          <div className="flex flex-col gap-3 mb-10">
            {missingTests.map(test => (
              <div key={test} className="py-2 px-4 bg-slate-50 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100">
                {test}
              </div>
            ))}
          </div>
          <Link href="/dashboard" className="block w-full py-4 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-transform hover:scale-[1.02]" style={{ backgroundColor: rosewood }}>
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // --- Narrative and Shift Calculations ---
  const getSortedDrives = (set: any[]) => [...set].sort((a, b) => b.val - a.val);
  const pubSorted = getSortedDrives(data.pub);
  const innSorted = getSortedDrives(data.inn);
  const privSorted = getSortedDrives(data.priv);
  
  const topPub = pubSorted[0].name;
  const topInn = innSorted[0].name;

  let rankingNarrative = topPub !== topInn 
    ? `Publicly, you rank the ${topPub} drive as your top priority, while innately, you value ${topInn} as your primary anchor.`
    : `You are consistently guided by your ${topPub} drive. This creates a powerful and authentic foundation for your life.`;

  const driveShifts: string[] = [];
  driveNames.forEach(name => {
    const rPub = pubSorted.findIndex(r => r.name === name) + 1;
    const rInn = innSorted.findIndex(r => r.name === name) + 1;
    const innVal = data.inn.find((d: any) => d.name === name).val;
    const pubVal = data.pub.find((d: any) => d.name === name).val;

    if (rInn < rPub && innVal >= 3) {
      driveShifts.push(`For the ${name} drive, you value it higher innately, yet in public you present yourself as if other drives are more important.`);
    } else if (rPub < rInn && pubVal >= 3) {
      driveShifts.push(`In public, you are driven to work on ${name} more than you value the drive innately.`);
    }
  });

  return (
    <div className="min-h-screen bg-[#fffafa] text-slate-900 pb-20 font-sans">
      <AuthHeader />
      <main className="max-w-6xl mx-auto px-4 py-12">
        
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-black uppercase tracking-[0.3em] mb-3" style={{ color: rosewood }}>
            The Integrated Self Analysis
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
            Understanding Your Persona Shifts and Strategic Instrumentation
          </p>
        </header>

        {/* Persona Change Analysis Panel */}
        <section className="mb-12 bg-white rounded-3xl shadow-xl border-2 p-10 relative" style={{ borderColor: rosewood }}>
           <h2 className="text-lg font-black uppercase tracking-widest mb-10" style={{ color: rosewood }}>Persona Change Analysis</h2>
           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {["pub", "priv", "inn"].map((key, i) => {
                const labels = { pub: "Public", priv: "Private", inn: "Innate" };
                const getS = (set: any[], name: string) => set.find(d => d.name === name)?.val || 0;
                const set = data[key as keyof typeof data];
                const e = getS(set, 'Exploration'), 
                      f = (getS(set, 'Care') + getS(set, 'Affiliation') + getS(set, 'Value')) / 3, 
                      d = (getS(set, 'Achievement') + getS(set, 'Dominance') + getS(set, 'Pleasure')) / 3;
                const sum = e + f + d, stats = { e: (e/sum)*100, f: (f/sum)*100, d: (d/sum)*100 };

                return (
                  <div key={i} className="flex flex-col items-center gap-5 flex-1">
                    <h4 className="font-black uppercase tracking-widest text-slate-400 text-[10px]">{labels[key as keyof typeof labels]}</h4>
                    <div className="h-28 w-28 rounded-full overflow-hidden shadow-inner border-4 border-white relative bg-slate-50">
                      <svg viewBox="0 0 32 32" className="h-full w-full -rotate-90">
                        <circle r="16" cx="16" cy="16" fill="transparent" stroke={pieColors.epistemic} strokeWidth="32" strokeDasharray={`${stats.e} 100`} />
                        <circle r="16" cx="16" cy="16" fill="transparent" stroke={pieColors.feeling} strokeWidth="32" strokeDasharray={`${stats.f} 100`} strokeDashoffset={`-${stats.e}`} />
                        <circle r="16" cx="16" cy="16" fill="transparent" stroke={pieColors.desire} strokeWidth="32" strokeDasharray={`${stats.d} 100`} strokeDashoffset={`-${stats.e + stats.f}`} />
                      </svg>
                    </div>
                  </div>
                );
              })}
           </div>
           <div className="mt-10 p-6 bg-slate-50/70 rounded-2xl border-l-4 italic text-[14px]" style={{ borderColor: rosewood }}>"{rankingNarrative}"</div>
        </section>

        {/* Detailed Drive Analysis Panel */}
        <section className="mb-12 bg-white rounded-3xl shadow-xl border-2 p-10" style={{ borderColor: rosewood }}>
          <h2 className="text-lg font-black uppercase tracking-widest mb-10" style={{ color: rosewood }}>Detailed Drive Analysis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {[{ label: "Public Ranking", color: pubColor, set: pubSorted }, { label: "Private Ranking", color: privColor, set: privSorted }, { label: "Innate Ranking", color: innColor, set: innSorted }].map((persona, i) => (
              <div key={i} className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-widest border-b pb-2" style={{ color: persona.color }}>{persona.label}</h4>
                <div className="space-y-5">
                  {persona.set.map((d: any, idx: number) => (
                    <div key={d.name}>
                      <div className="flex justify-between items-end text-[9px] font-black uppercase mb-1.5">
                        <span className="text-slate-400 mr-2">#{idx + 1}</span>
                        <span className="flex-1 text-slate-600 font-bold">{d.name}</span>
                        <span className="text-slate-400">{d.val.toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full" style={{ width: `${(d.val/5)*100}%`, backgroundColor: persona.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 p-8 bg-[#fffafa] rounded-2xl border border-rose-100 italic text-[13px] space-y-4">
            {driveShifts.map((s, i) => <p key={i}>◆ {s}</p>)}
          </div>
        </section>

        {/* Strategic Drive Instrumentation Panel */}
        <section className="mb-12 bg-white rounded-3xl shadow-xl border-2 p-10" style={{ borderColor: rosewood }}>
          <h2 className="text-lg font-black uppercase tracking-widest mb-10" style={{ color: rosewood }}>Strategic Drive Instrumentation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col justify-center">
              <p className="text-[13px] text-slate-600 leading-relaxed italic">
                Strategic instrumentation occurs when your conscious mind elevates a drive's priority to serve a deeper, innate need. This represents how you skillfully manage your personality to achieve balance and fulfillment.
              </p>
            </div>
            <div className="space-y-5">
              {instrumentationList.length > 0 ? (
                instrumentationList.map((text, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className="text-rose-400 mt-1">✨</span>
                    <p className="text-[13px] text-slate-700 leading-relaxed italic">{text}</p>
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-slate-400 italic">No instrumentation detected; your current strategies are in direct alignment with your instincts.</p>
              )}
            </div>
          </div>
        </section>

        <div className="mt-16 flex justify-center gap-6">
          <Link href="/dashboard" className="px-10 py-5 border-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em]" style={{ borderColor: rosewood, color: rosewood }}>Dashboard</Link>
          <Link href="/reports/deep-insight" className="px-10 py-5 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl" style={{ backgroundColor: rosewood }}>Deepen Insight</Link>
        </div>
      </main>
    </div>
  );
}