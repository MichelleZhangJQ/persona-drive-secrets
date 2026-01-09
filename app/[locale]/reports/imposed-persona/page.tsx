import { createServerClientComponent } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthHeader } from "@/components/AuthHeader";

export default async function ImposedPersonaReportPage() {
  const supabase = createServerClientComponent();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [imposedRes] = await Promise.all([
    supabase.from('imposed-persona').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
  ]);

  const themeColor = "#93a97c"; // Sage Green Theme
  const mutedBlue = "#7c94be"; // Muted Blue for Surface Test
  const selfDriveColor = "#c5d1b7"; // Lighter sage
  const driveNames = ["Exploration", "Achievement", "Domination", "Pleasure", "Intimacy/Care", "Affiliation", "Value"];
  
  const getDriveNarrative = (name: string, envPct: number) => {
    const isEnvLed = envPct > 66;
    const isSelfLed = envPct < 33;
    const scripts: Record<string, any> = {
      "Exploration": { 
        base: "You present yourself in  as a person who is constantly seeking new ideas and intellectual growth.", 
        env: "You demonstrate an impressive ability to remain curious and well-informed, ensuring you add value to your environment's evolving needs.", 
        self: "You are eager to find more opportunities to discover and learn, driven by an authentic, internal passion for knowledge.", 
        balanced: "You skillfully navigate the group's need for information while satisfying your own aspiration for intellectual discovery." 
      },
      "Achievement": { 
        base: "You project an image of a goal-oriented individual who values tangible success and competence.", 
        env: "You show great dedication in delivering results, prioritizing the collective goals of your environment with professionalism and focus.", 
        self: "You are eager to push your limits and secure new wins, fueled by a strong internal drive for excellence.", 
        balanced: "You effectively meet professional milestones while finding personal fulfillment in the challenges you overcome." 
      },
      "Domination": { 
        base: "You present yourself in public as a person who is willing to take the responsibility of making decisions.", 
        env: "You rise to the occasion as a leader when the situation calls for it, putting the needs of the group first to ensure clear direction.", 
        self: "You are eager to gain more opportunities to exercise influence and steer the direction of your projects.", 
        balanced: "You are fulfilling your leadership role with grace while also meeting your own aspiration for authority and impact." 
      },
      "Pleasure": { 
        base: "You present a persona that prioritizes enjoyment, aesthetic appreciation, and positive experiences.", 
        env: "You act as a positive anchor for those around you, ensuring a pleasant atmosphere that benefits the collective wellbeing.", 
        self: "You are eager to maximize sensory and emotional enjoyment, valuing the beauty and joy life has to offer.", 
        balanced: "You contribute to a positive environment while authentically pursuing your own sources of happiness." 
      },
      "Intimacy/Care": { 
        base: "You project an image of a supportive and empathetic person who deeply values close relationships.", 
        env: "You are highly attuned to the emotional needs of others, providing a sense of care and stability that strengthens your community.", 
        self: "You are eager to deepen your emotional bonds, as providing care is a deeply rewarding part of your identity.", 
        balanced: "You meet the emotional needs of your circle while finding your own sense of security and warmth in those connections." 
      },
      "Affiliation": { 
        base: "You present yourself as a cooperative team player who values group harmony and belonging.", 
        env: "You demonstrate excellent social adaptability, working hard to maintain group cohesion and support the shared journey.", 
        self: "You are eager to be part of a community and contribute to the collective because you thrive on social connection.", 
        balanced: "You fulfill your role as a vital group member while satisfying your own need for social integration." 
      },
      "Value": { 
        base: "You project a persona rooted in strong principles and an ethical moral compass.", 
        env: "You serve as a principled example for others, upholding ethical standards that help guide the environment toward integrity.", 
        self: "You are eager to act on your convictions, as living according to your values is your highest internal priority.", 
        balanced: "You uphold communal standards of integrity while finding personal peace in living out your own ethics." 
      }
    };
    const s = scripts[name];
    return `${s.base} ${isEnvLed ? s.env : isSelfLed ? s.self : s.balanced}`;
  };

  const calculateImposedData = (data: any) => {
    if (!data) return null;
    const calculatedDrives = driveNames.map((name, index) => {
      const startIndex = index * 3 + 1;
      const q1 = data[`q${startIndex}_answer`] || 0;
      const q2 = data[`q${startIndex + 1}_answer`] || 0;
      const q3 = data[`q${startIndex + 2}_answer`] || 0;
      const envInduced = (q1 * q2) / 5;
      const selfDrive = q3;
      const total = envInduced + selfDrive;
      const envPct = total > 0 ? (envInduced / total) * 100 : 0;
      return { name, envInduced, selfDrive, total, envPct, narrative: getDriveNarrative(name, envPct) };
    });

    const maxTotal = Math.max(...calculatedDrives.map(d => d.total));
    const prominentDrives = calculatedDrives
      .filter(d => d.total >= maxTotal / 2 && d.total > 0)
      .sort((a, b) => b.total - a.total);

    let weightedEnvSum = 0, weightedSelfSum = 0;
    prominentDrives.forEach(d => { weightedEnvSum += d.envInduced * d.total; weightedSelfSum += d.selfDrive * d.total; });
    const envSelfRatio = weightedSelfSum > 0 ? weightedEnvSum / weightedSelfSum : 0;

    const getGroupScore = (names: string[]) => {
      const found = calculatedDrives.filter(d => names.includes(d.name));
      return found.reduce((a, b) => a + b.total, 0) / (found.length || 1);
    };

    const eScore = getGroupScore(["Exploration"]), fScore = getGroupScore(["Intimacy/Care", "Affiliation", "Value"]), dScore = getGroupScore(["Achievement", "Domination", "Pleasure"]);
    const sum = eScore + fScore + dScore;
    const eDom = eScore > 5 && (eScore / sum) > 0.3, fDom = fScore > 5 && (fScore / sum) > 0.3, dDom = dScore > 5 && (dScore / sum) > 0.3;

    let compNarrative = "Your drives are currently distributed without a singular dominant focus.";
    if (eDom && fDom && dDom) compNarrative = "You are driven by a complex balance of intellectual exploration, emotional connection, and achievement-oriented goals.";
    else if (eDom && fDom) compNarrative = "You are driven by both the exploration of new ideas and a deep need for meaningful emotional connection.";
    else if (eDom && dDom) compNarrative = "You are driven by both a need to explore new ideas and a strong push to achieve tangible goals.";
    else if (fDom && dDom) compNarrative = "You are driven by a combination of social-emotional bonds and the desire for personal achievement.";
    else if (eDom) compNarrative = "You are mainly driven by the exploration of new ideas and intellectual discovery in your life.";
    else if (fDom) compNarrative = "You are primarily driven by your values and the strength of your social and caring connections.";
    else if (dDom) compNarrative = "You are primarily driven by your desires for achievement, influence, and personal satisfaction.";

    return { calculatedDrives, prominentDrives, envSelfRatio, compNarrative, pie: { epistemic: eScore, feeling: fScore, desire: dScore } };
  };

  const pub = calculateImposedData(imposedRes.data);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <AuthHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-black uppercase tracking-widest text-slate-800"> Imposed Persona Report</h1>
          <p className="text-slate-500 mt-2 italic text-sm font-bold uppercase tracking-widest"> Drive Analysis</p>
        </header>

        {pub && (
          <section className="rounded-3xl border-t-8 bg-white shadow-2xl overflow-hidden mb-12" style={{ borderColor: themeColor }}>
            <div className="px-8 py-4 text-white flex justify-between items-center" style={{ backgroundColor: themeColor }}>
              <h2 className="text-xl font-black uppercase tracking-widest">Imposed Persona Analysis</h2>
              <span className="text-[10px] font-bold opacity-80 italic tracking-widest">REPORT GENERATED</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* LEFT PANEL: Charts & Data */}
              <div className="p-8 border-r border-slate-100 bg-slate-50/50 flex flex-col gap-10">
                {/* 1. Pie Chart */}
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Imposed Persona Drive Composition</h3>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6">
                    <div className="flex items-center gap-6">
                      <div className="relative h-24 w-24 shrink-0">
                         <svg viewBox="0 0 32 32" className="h-full w-full -rotate-90 rounded-full">
                            <circle r="16" cx="16" cy="16" fill="transparent" stroke="#6366f1" strokeWidth="32" strokeDasharray={`${(pub.pie.epistemic / (pub.pie.epistemic+pub.pie.feeling+pub.pie.desire)) * 100} 100`} />
                            <circle r="16" cx="16" cy="16" fill="transparent" stroke="#e66a2cff" strokeWidth="32" strokeDasharray={`${(pub.pie.feeling / (pub.pie.epistemic+pub.pie.feeling+pub.pie.desire)) * 100} 100`} strokeDashoffset={`-${(pub.pie.epistemic / (pub.pie.epistemic+pub.pie.feeling+pub.pie.desire)) * 100}`} />
                            <circle r="16" cx="16" cy="16" fill="transparent" stroke="#f4ee3fff" strokeWidth="32" strokeDasharray={`${(pub.pie.desire / (pub.pie.epistemic+pub.pie.feeling+pub.pie.desire)) * 100} 100`} strokeDashoffset={`-${((pub.pie.epistemic + pub.pie.feeling) / (pub.pie.epistemic+pub.pie.feeling+pub.pie.desire)) * 100}`} />
                         </svg>
                      </div>
                      <div className="text-[11px] text-slate-600 leading-snug italic font-medium">"{pub.compNarrative}"</div>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-50">
                       <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500"><span className="h-2 w-2 rounded-full bg-[#6366f1]" /> Epistemic</div>
                       <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500"><span className="h-2 w-2 rounded-full bg-[#e66a2cff]" /> Feeling</div>
                       <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500"><span className="h-2 w-2 rounded-full bg-[#f4ee3fff]" /> Desire</div>
                    </div>
                  </div>
                </div>

                {/* 2. Adaptation */}
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Adaptation Analysis</h3>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Environment/Self Drive Ratio</span>
                      <span className="text-xl font-black" style={{ color: themeColor }}>{pub.envSelfRatio.toFixed(2)}</span>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[11px] text-slate-600 leading-relaxed font-semibold italic border-b border-slate-50 pb-3">
                        {pub.envSelfRatio > 1.5 ? "You possess a strong ability to align with environmental demands, showing great dedication to collective expectations." : pub.envSelfRatio < 0.75 ? "You prioritize your internal compass and innate needs, maintaining an authentic and self-consistent public persona." : "You have achieved a graceful balance between honoring your own needs and meeting the requirements of your environment."}
                      </p>
                      <div className="text-[10px] text-slate-400 leading-relaxed space-y-2">
                        <p><strong>Ratio Insights:</strong> This index measures the balance of your public energy (1/5 to 5 range). </p>
                        <p>A higher ratio reflects an <strong>exceptional adaptive capacity</strong>; you are highly attuned to the needs of your community, often prioritizing collective progress. A lower ratio indicates a <strong>deeply anchored self</strong>, where public actions remain closely aligned with your core internal values.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Detailed Bars */}
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Drive Strength Details</h3>
                    <div className="flex gap-4 text-[9px] font-bold uppercase">
                       <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded" style={{ backgroundColor: themeColor }} /> Env</div>
                       <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded" style={{ backgroundColor: selfDriveColor }} /> Self</div>
                    </div>
                  </div>
                  <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    {pub.calculatedDrives.map((drive) => (
                      <div key={drive.name}>
                        <div className="flex justify-between text-[10px] font-black uppercase mb-1 text-slate-500">
                          <span>{drive.name}</span>
                          <span>{drive.total.toFixed(1)}</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div className="h-full transition-all duration-500" style={{ width: `${(drive.envInduced/10)*100}%`, backgroundColor: themeColor }} />
                          <div className="h-full transition-all duration-500" style={{ width: `${(drive.selfDrive/10)*100}%`, backgroundColor: selfDriveColor }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL: Narratives */}
              <div className="p-8 flex flex-col gap-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Imposed Persona Details</h3>
                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 space-y-6">
                  {pub.prominentDrives.map((d) => (
                    <div key={d.name} className="border-l-2 pl-4" style={{ borderColor: themeColor }}>
                       <p className="text-[11px] text-slate-600 leading-relaxed">
                         <span className="font-black uppercase text-[9px] block mb-1" style={{ color: themeColor }}>{d.name}</span>
                         {d.narrative}
                       </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --- MODIFIED BUTTON SECTION --- */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-16 max-w-4xl mx-auto">
          
          {/* LEFT: Return to Dashboard (Grey Theme) */}
          <Link 
            href="/" 
            className="w-full sm:w-auto px-8 py-4 bg-slate-200 text-slate-600 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-md hover:bg-slate-300 transition-all text-center"
          >
            Return to Dashboard
          </Link>

          {/* MIDDLE: Return to Imposed Test (Sage Green) */}
          <Link 
            href="/tests/imposed-persona" 
            className="w-full sm:w-auto px-8 py-4 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:brightness-95 transition-all text-center" 
            style={{ backgroundColor: themeColor }}
          >
            Retake This Test
          </Link>

          {/* RIGHT: Start Surface Test (Muted Blue) */}
          <Link 
            href="/tests/surface-persona" 
            className="w-full sm:w-auto px-8 py-4 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:brightness-95 transition-all text-center" 
            style={{ backgroundColor: mutedBlue }}
          >
            Take Surface Persona Test
          </Link>
        </div>
      </main>
    </div>
  );
}