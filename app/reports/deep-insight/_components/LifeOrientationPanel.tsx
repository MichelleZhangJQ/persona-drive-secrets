"use client";
import PanelUI from "./PanelUI";

export default function LifeOrientationPanel({ data, rosewood }: { data: any, rosewood: string }) {
  const { rawPriv: rp, rawInn: ri } = data;

  const qP = (n: number) => Number(rp[`q${n}_answer`]) || 0;
  const qI = (n: number) => Number(ri[`q${n}_answer`]) || 0;
  
  const check = (matchups: number[]) => matchups.every(score => score > 3);

  const JUDGING = 1;
  const PERSPECTIVE = 2;
  const AMBIV = 3;

  // Archetype Names: No parentheses, direct vocabulary
  const archetypes: Record<string, string> = {
    "Goal Judging": "Target Driven Closure",
    "Process Judging": "Structured Systematic Order",
    "Curious Perspective": "Unrestrained Mental Explorer",
    "Fun Perspective": "Spontaneous Experience Seeker",
    "Ambivalent": "Flexible Adaptive Navigator"
  };

  const labelDefinitions: Record<string, string> = {
    "Judging": "Judging types seek closure, organization, and a planned approach. They feel most comfortable when decisions are finalized and goals are structured.",
    "Perspective": "Perspective types seek openness, spontaneity, and discovery. They feel most comfortable keeping options open and reacting to new information.",
    "Ambivalent": "Ambivalent individuals possess a balanced, flexible orientation, shifting between structure and openness as the context requires."
  };

  // --- DRIVE CALCULATIONS ---
  const achM_P = [qP(1), qP(13), qP(16)]; 
  const valM_P = [qP(6), 6 - qP(13), 6 - qP(15)];
  const expM_P = [6 - qP(1), 6 - qP(3), 6 - qP(6)]; 
  const pleM_P = [qP(3), qP(15), 6 - qP(16)]; 

  const achM_I = [6 - qI(1), qI(13), qI(16)]; 
  const valM_I = [6 - qI(6), 6 - qI(13), qI(15)];
  const expM_I = [qI(1), qI(3), qI(6)]; 
  const pleM_I = [6 - qI(3), 6 - qI(15), 6 - qI(16)]; 

  const determine = (ach: number[], val: number[], exp: number[], ple: number[]) => {
    const isJ = check(ach) || check(val);
    const isP = check(exp) || check(ple);
    if (isJ) {
      const aAvg = ach.reduce((a, b) => a + b, 0) / ach.length;
      const vAvg = val.reduce((a, b) => a + b, 0) / val.length;
      return { type: JUDGING, group: "Judging", id: aAvg >= vAvg ? "Goal Judging" : "Process Judging" };
    }
    if (isP) {
      const eAvg = exp.reduce((a, b) => a + b, 0) / exp.length;
      const lAvg = ple.reduce((a, b) => a + b, 0) / ple.length;
      return { type: PERSPECTIVE, group: "Perspective", id: eAvg >= lAvg ? "Curious Perspective" : "Fun Perspective" };
    }
    return { type: AMBIV, group: "Ambivalent", id: "Ambivalent" };
  };

  const privRes = determine(achM_P, valM_P, expM_P, pleM_P);
  const innRes = determine(achM_I, valM_I, expM_I, pleM_I);

  // --- FALLBACK LOGIC ---
  let finalDisplayLabel = privRes.group;
  let finalArchetypeKey = privRes.id;

  if (privRes.type === AMBIV && innRes.type !== AMBIV) {
    finalDisplayLabel = innRes.group;
    finalArchetypeKey = innRes.id;
  }

  // --- NARRATIVE CONSTRUCTION ---
  let summary = "";
  let analysis = "";

  if (privRes.type === AMBIV && innRes.type !== AMBIV) {
    summary = `You are naturally anchored in a **${innRes.group}** orientation as a **${archetypes[innRes.id]}**. This biological baseline provides you with a reliable internal compass prioritizing ${
      innRes.id.includes("Goal") ? "deliberate results and closure" : 
      innRes.id.includes("Process") ? "systemic order and consistency" : 
      innRes.id.includes("Curious") ? "unrestrained mental exploration" : "immediate, spontaneous experience"
    }.`;
    analysis = `While your innate nature is distinctively structured, your conscious persona remains beautifully flexible. You have developed the capacity to be adaptive in your daily life, skillfully applying your natural ${innRes.group.toLowerCase()} strengths only when they are most effective.`;
  } 
  else {
    summary = privRes.type === AMBIV 
      ? "You demonstrate a masterfully balanced approach to life. By remaining Ambivalent, you skillfully navigate both structure and discovery, choosing to move with high cognitive agility and a perfectly adaptive mindset." 
      : `You operate with a clear and powerful **${privRes.group}** orientation as a **${archetypes[privRes.id]}**. You move through the world with purpose, effectively prioritizing ${
          privRes.id.includes("Goal") ? "efficiency and finalized results" : 
          privRes.id.includes("Process") ? "order and principled structure" : 
          privRes.id.includes("Curious") ? "open-ended exploration" : 
          "spontaneity and immediate presence"
        }.`;
    
    analysis = (privRes.type === innRes.type && privRes.id === innRes.id)
      ? `This conscious clarity is a direct reflection of your innate biology. You are in total harmony with your baseline nature, allowing your ${privRes.group.toLowerCase()} traits to flourish without internal conflict.`
      : `Your conscious strategy shows great strength and focus. This orientation is a sophisticated development of your nature, allowing you to channel your ${innRes.group === "Ambivalent" ? "natural flexibility" : "innate " + innRes.group + " traits"} into a specialized, high-impact life strategy.`;
  }

  return (
    <PanelUI 
      rosewood={rosewood}
      number="4"
      title="Judging or Perspective"
      label={finalDisplayLabel}
      labelDetails={labelDefinitions[finalDisplayLabel]}
      archetype={archetypes[finalArchetypeKey]}
      summary={summary}
      analysis={analysis}
      matrix={[
        { c1: "Private Mode", c2: archetypes[privRes.id], n: "Conscious" },
        { c1: "Innate Mode", c2: archetypes[innRes.id], n: "Biological" },
        { c1: "Primary Driver", c2: finalDisplayLabel, n: "Confirmed" }
      ]}
    />
  );
}