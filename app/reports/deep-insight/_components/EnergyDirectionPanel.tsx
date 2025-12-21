"use client";
import PanelUI from "./PanelUI";

export default function EnergyDirectionPanel({ data, rosewood }: { data: any, rosewood: string }) {
  const { pub, inn, rawPriv: rp, rawInn: ri } = data;

  const qP = (n: number) => Number(rp[`q${n}_answer`]) || 0;
  const qI = (n: number) => Number(ri[`q${n}_answer`]) || 0;
  
  const check = (matchups: number[]) => (matchups.reduce((a, b) => a + b, 0) / matchups.length) > 3;

  const INTRO = 1;
  const EXTRO = 2;
  const AMBIV = 3;

  const labelDefinitions: Record<string, string> = {
    "Introvert": "Introverts draw energy from their internal world. They prioritize depth, reflection, and selective engagement, often feeling recharged by solitude or quiet environments.",
    "Extrovert": "Extroverts draw energy from external stimulation. They prioritize social impact, high-energy environments, and active engagement with people and surroundings.",
    "Ambivalent": "Ambivalent (or Ambiverted) individuals possess a flexible energy system, skillfully shifting between internal reflection and external action depending on the context."
  };

  const archetypes: Record<string, string> = {
    "Exploration Introvert": "The Insightful Voyager (Internal Discovery)",
    "Care Introvert": "The Protective Guardian (Deep Empathy & Focus)",
    "Dominant Extrovert": "The Strategic Leader (Influence & Impact)",
    "Pleasure Extrovert": "The Vibrant Enthusiast (Experience & Joy)",
    "Social Extrovert": "The Connected Connector (Bonding & Unity)",
    "Ambivalent": "The Adaptive Socialite (Cognitive Versatility)"
  };

  let privateRes = { id: "Ambivalent", type: AMBIV };
  let innateRes = { id: "Ambivalent", type: AMBIV };

  // --- 1. PRIVATE PERSONA LOGIC ---
  const expM = [6 - qP(2), 6 - qP(3), 6 - qP(5)];        
  const carM = [qP(4), 6 - qP(8), 6 - qP(9)];            
  const domM = [qP(2), qP(8), qP(11)];                   
  const pleM = [qP(3), qP(9), qP(12)];                   
  const affM = [qP(5), 6 - qP(11), 6 - qP(12)];          

  const isPrivIntro = check(expM) || check(carM);
  const isPrivExtro = check(domM) || check(pleM) || check(affM);

  if (isPrivIntro) {
    privateRes.type = INTRO;
    const expAvg = ((6 - qP(1)) + (6 - qP(2)) + (6 - qP(3)) + (6 - qP(4)) + (6 - qP(5))) / 5;
    const carAvg = (qP(4) + (6 - qP(7)) + (6 - qP(8)) + (6 - qP(9))) / 4;
    privateRes.id = expAvg >= carAvg ? "Exploration Introvert" : "Care Introvert";
  } else if (isPrivExtro) {
    privateRes.type = EXTRO;
    const domAvg = (qP(2) + qP(8) + qP(11) + qP(14)) / 4;
    const pleAvg = (qP(3) + qP(9) + qP(12) + qP(15)) / 4;
    const affAvg = (qP(5) + (6 - qP(10)) + (6 - qP(11)) + (6 - qP(12))) / 4;
    const maxVal = Math.max(domAvg, pleAvg, affAvg);
    if (maxVal === domAvg) privateRes.id = "Dominant Extrovert";
    else if (maxVal === pleAvg) privateRes.id = "Pleasure Extrovert";
    else privateRes.id = "Social Extrovert";
  }

  // --- 2. INNATE PERSONA LOGIC ---
  const innExpM = [qI(2), qI(3), qI(5)]; 
  const innCarM = [qI(10), qI(12), 6 - qI(8)]; 
  const innDomM = [qI(8), qI(11), 6 - qI(2)];  
  const innPleM = [6 - qI(3), 6 - qI(7), 6 - qI(9), 6 - qI(12), 6 - qI(15)]; 
  const innAffM = [qI(10), qI(12), 6 - qI(11)]; 

  const isInnIntro = check(innExpM) || check(innCarM);
  const isInnExtro = check(innDomM) || check(innPleM) || check(innAffM);

  if (isInnIntro) {
    innateRes.type = INTRO;
    innateRes.id = inn.Exploration >= inn.Care ? "Exploration Introvert" : "Care Introvert";
  } else if (isInnExtro) {
    innateRes.type = EXTRO;
    const maxInn = Math.max(inn.Dominance, inn.Pleasure, inn.Affiliation);
    if (maxInn === inn.Dominance) innateRes.id = "Dominant Extrovert";
    else if (maxInn === inn.Pleasure) innateRes.id = "Pleasure Extrovert";
    else innateRes.id = "Social Extrovert";
  }

  // --- 3. PUBLIC PERSONA LOGIC ---
  const avgExtrovert = (pub.Dominance + pub.Pleasure + pub.Affiliation) / 3;
  const avgIntrovert = (pub.Care + pub.Exploration) / 2;
  const publicType = avgExtrovert > avgIntrovert ? EXTRO : INTRO;

  // --- FALLBACK & NARRATIVE LOGIC ---
  let finalLabel = "Ambivalent";
  if (privateRes.type === INTRO) finalLabel = "Introvert";
  else if (privateRes.type === EXTRO) finalLabel = "Extrovert";
  else if (innateRes.type !== AMBIV) finalLabel = innateRes.type === INTRO ? "Introvert" : "Extrovert";

  let summary = "";
  let analysis = "";

  // CASE: Innate is decisive, Private is Ambivalent
  if (privateRes.type === AMBIV && innateRes.type !== AMBIV) {
    summary = `You possess an innate biological baseline as a **${innateRes.id}**. This core nature provides you with a robust internal foundation for processing social energy through ${innateRes.id.toLowerCase().includes("exploration") ? "deep insight" : "focused care"}.`;
    analysis = `Consciously, you have mastered the art of social adaptability. While your internal engine is firmly ${finalLabel.toLowerCase()}ed, your daily interactions are characterized by a sophisticated flexibility that allows you to engage effectively across all social spectrums.`;
  } 
  // STANDARD CASES
  else {
    summary = privateRes.type === AMBIV 
      ? "You demonstrate a masterfully balanced social orientation. By remaining Ambivalent, you skillfully navigate both internal reflection and external engagement, adapting your energy flow to the specific needs of your environment." 
      : `You operate with a clear and confident **${privateRes.id}** profile. Your social strategy is defined by a primary drive for ${privateRes.id.split(' ')[0]}, allowing you to filter experiences with precision and impact.`;

    analysis = (privateRes.type === innateRes.type)
      ? `This conscious orientation is beautifully synchronized with your innate biology, as your biological baseline confirms a natural ${innateRes.id} pattern.`
      : `This conscious strategy represents a sophisticated social development. While your innate baseline leans toward ${innateRes.id}, you have successfully evolved a ${privateRes.id} approach to optimize your life goals.`;
  }

  const publicNote = publicType === EXTRO 
    ? " In public, you project an energetic and engaging persona, prioritizing external impact." 
    : " In public, you project a thoughtful and contained persona, prioritizing internal depth.";

  return (
    <PanelUI 
      rosewood={rosewood}
      number="1"
      title="Introversion or Extrovertion"
      label={finalLabel}
      labelDetails={labelDefinitions[finalLabel]}
      archetype={archetypes[privateRes.type === AMBIV ? innateRes.id : privateRes.id]}
      summary={summary}
      analysis={analysis + publicNote}
      matrix={[
        { c1: "Conscious Logic", c2: privateRes.id, n: "Private" },
        { c1: "Biological Baseline", c2: innateRes.id, n: "Innate" },
        { c1: "External Presentation", c2: publicType === EXTRO ? "Extrovert" : "Introvert", n: "Public" }
      ]}
    />
  );
}