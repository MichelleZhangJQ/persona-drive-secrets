"use client";
import PanelUI from "./PanelUI";

export default function InformationProcessingPanel({ data, rosewood }: { data: any, rosewood: string }) {
  const { pub, inn, rawPriv: rp, rawInn: ri } = data;

  const qP = (n: number) => Number(rp[`q${n}_answer`]) || 0;
  const qI = (n: number) => Number(ri[`q${n}_answer`]) || 0;
  
  // Logic helper: threshold check (avg > 3)
  const check = (matchups: number[]) => (matchups.reduce((a, b) => a + b, 0) / matchups.length) > 3;

  const INTUITIVE = 1;
  const SENSING = 2;
  const AMBIV = 3;

  const labelDefinitions: Record<string, string> = {
    "Intuitive": "Intuitive types process information through patterns, possibilities, and the 'big picture.' They are future-oriented and prefer abstract concepts over concrete data.",
    "Sensing": "Sensing types process information through facts, details, and immediate reality. They are present-oriented and prefer practical, proven methods over theoretical ideas.",
    "Ambivalent": "Ambivalent processors demonstrate high cognitive versatility, switching between detail-oriented focus and abstract pattern-recognition based on the task at hand."
  };

  const archetypes: Record<string, string> = {
    "Intuitive": "The Visionary Explorer",
    "Sensing": "The Pragmatic Achiever",
    "Ambivalent": "The Adaptive Analyst"
  };

  // --- 1. PRIVATE PERSONA LOGIC (Conscious) ---
  // Intuition is driven by Exploration (Exp)
  // Sensing is driven by Achievement (Ach)
  const privExpM = [6 - qP(1)]; // Higher = Intuitive
  const privAchM = [qP(1)];             // Higher = Sensing

  let privRes = { id: "Ambivalent", type: AMBIV };
  if (check(privExpM) && !check(privAchM)) {
    privRes = { id: "Intuitive", type: INTUITIVE };
  } else if (check(privAchM)) {
    privRes = { id: "Sensing", type: SENSING };
  }

  // --- 2. INNATE PERSONA LOGIC (Biological) ---
  const innExpM = [qI(1)];
  const innAchM = [6-qI(1)];

  let innRes = { id: "Ambivalent", type: AMBIV };
  if (check(innExpM) && !check(innAchM)) {
    innRes = { id: "Intuitive", type: INTUITIVE };
  } else if (check(innAchM)) {
    innRes = { id: "Sensing", type: SENSING };
  }

  // --- 3. PUBLIC PERSONA LOGIC (External) ---
  const publicType = pub.Exploration > pub.Achievement ? INTUITIVE : SENSING;

  // --- FALLBACK & NARRATIVE LOGIC ---
  let finalLabel = privRes.id;
  if (privRes.type === AMBIV && innRes.type !== AMBIV) {
    finalLabel = innRes.id;
  }

  let summary = "";
  let analysis = "";

  // CASE: Innate is decisive, Private is Ambivalent
  if (privRes.type === AMBIV && innRes.type !== AMBIV) {
    summary = `You possess an innate biological baseline as an **${innRes.id}** processor. Your mind is naturally calibrated to ${innRes.type === INTUITIVE ? "seek out patterns and future possibilities" : "focus on concrete facts and tangible results"}.`;
    analysis = `Consciously, you have developed an impressive cognitive flexibility. While your internal engine is ${innRes.id.toLowerCase()}ly charged, you navigate daily information with an adaptive mindset, ensuring you don't miss the forest for the trees (or vice versa).`;
  } 
  // STANDARD POSITIVE MAPPING
  else {
    summary = privRes.type === AMBIV 
      ? "You demonstrate a masterfully balanced approach to information. By remaining Ambivalent, you skillfully toggle between high-level vision and detailed execution, allowing you to be both a dreamer and a doer." 
      : `You operate with a clear and confident **${privRes.id}** processing style. You move through information with precision, prioritizing ${privRes.type === INTUITIVE ? "innovation and abstract connections" : "reliability and factual accuracy"}.`;

    analysis = (privRes.type === innRes.type)
      ? `This conscious style is perfectly synchronized with your innate biology, creating a seamless flow between how you think and how you act.`
      : `This conscious approach is a sophisticated mental development. While your innate baseline leans toward ${innRes.id}, you have evolved a ${privRes.id} strategy to better meet your professional or personal goals.`;
  }

  const publicNote = publicType === INTUITIVE 
    ? " In public settings, you project a visionary persona, emphasizing ideas and future potential." 
    : " In public settings, you present a grounded persona, emphasizing competence and practical details.";

  return (
    <PanelUI 
      rosewood={rosewood}
      number="2"
      title="Sensing or Intuition"
      label={finalLabel}
      labelDetails={labelDefinitions[finalLabel]}
      archetype={archetypes[finalLabel]}
      summary={summary}
      analysis={analysis + publicNote}
      matrix={[
        { c1: "Private Mode", c2: privRes.id, n: "Conscious" },
        { c1: "Innate Mode", c2: innRes.id, n: "Biological" },
        { c1: "Data Preference", c2: finalLabel, n: "Dominant" }
      ]}
    />
  );
}