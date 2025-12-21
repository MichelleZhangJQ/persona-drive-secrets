"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";
import Link from "next/link";
// Import centralized utilities
import { 
  calculateInnateScores, 
  calculatePrivateScores, 
  calculatePublicScores,
  driveNames 
} from "@/lib/persona-utils";

// Sub-component Imports
import EnergyDirectionPanel from "./_components/EnergyDirectionPanel";
import CognitiveProcessingPanel from "./_components/CognitiveProcessingPanel";
import InterpersonalJudgmentPanel from "./_components/InterpersonalJudgmentPanel";
import LifeOrientationPanel from "./_components/LifeOrientationPanel";

export default function DeepInsightReport() {
  const supabase = createBrowserSupabaseClient();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const rosewood = "#c77b84";

  useEffect(() => {
    async function fetchAllData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [privRes, innRes, pubRes] = await Promise.all([
          supabase.from('private-persona').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
          supabase.from('innate-persona').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
          supabase.from('public-persona').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
        ]);

        if (privRes.data && innRes.data && pubRes.data) {
          
          // --- 1. PROCESS INNATE SCORES (Utility) ---
          const normalizedInn = calculateInnateScores(innRes.data);

          // --- 2. PROCESS PRIVATE SCORES (Utility) ---
          const normalizedPriv = calculatePrivateScores(privRes.data);

          // --- 3. PROCESS PUBLIC SCORES (Utility + Scaling) ---
          const publicScoresObj = calculatePublicScores(pubRes.data);
          
          // The components expect a flat object with drive: value for public, 
          // but Public Utility returns { env, self, total }. 
          // We extract the 'total' and scale to 5 to match the original logic.
          const rawPubTotals = driveNames.map(name => ({
            name,
            val: publicScoresObj ? publicScoresObj[name as keyof typeof publicScoresObj].total : 0
          }));

          const maxPubRaw = Math.max(...rawPubTotals.map(d => d.val));
          const normalizedPub = rawPubTotals.reduce((acc: any, d) => ({ 
            ...acc, [d.name]: maxPubRaw > 0 ? (d.val / maxPubRaw) * 5 : 0 
          }), {});

          // --- 4. PACKAGE DATA ---
          setData({ 
            pub: normalizedPub, 
            inn: normalizedInn, 
            priv: normalizedPriv,
            rawPriv: privRes.data, 
            rawInn: innRes.data,   
            rawPub: pubRes.data    
          });
        } else {
          setError("Required data records were not found.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("An error occurred while loading your insights.");
      }
    }
    fetchAllData();
  }, [supabase]);

  if (error) return <div className="p-20 text-center text-rose-500 font-bold">{error}</div>;
  if (!data) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Deepening Insights...</div>;

  return (
    <div className="min-h-screen bg-[#fffafa] text-slate-900 pb-20 font-sans">
      <AuthHeader />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-black uppercase tracking-[0.3em] mb-3" style={{ color: rosewood }}>Deep Insight</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Drive Tension & Archetype Analysis</p>
        </header>

        {/* Modular Sections */}
        <section className="space-y-12">
            <EnergyDirectionPanel data={data} rosewood={rosewood} />
            <CognitiveProcessingPanel data={data} rosewood={rosewood} />
            <InterpersonalJudgmentPanel data={data} rosewood={rosewood} />
            <LifeOrientationPanel data={data} rosewood={rosewood} />
        </section>

        {/* Action Bar */}
        <div className="mt-16 flex flex-col sm:flex-row justify-center items-center gap-6">
          <Link href="/dashboard" className="px-10 py-5 border-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-white" style={{ borderColor: rosewood, color: rosewood }}>
            Dashboard
          </Link>
          <Link href="/reports/overall" className="px-10 py-5 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all hover:brightness-110" style={{ backgroundColor: rosewood }}>
            Overall Report
          </Link>
        </div>
      </main>
    </div>
  );
}