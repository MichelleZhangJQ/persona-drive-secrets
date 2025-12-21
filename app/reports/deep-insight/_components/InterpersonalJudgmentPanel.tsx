"use client";
import PanelUI from "./PanelUI";

export default function InterpersonalJudgmentPanel({ data, rosewood }: { data: any, rosewood: string }) {
  const { pub, inn, rawPriv: rp, rawInn: ri } = data;

  const qP = (n: number) => Number(rp[`q${n}_answer`]) || 0;
  const qI = (n: number) => Number(ri[`q${n}_answer`]) || 0;
  
  const check = (matchups: number[]) => (matchups.reduce((a, b) => a + b, 0) / matchups.length) > 3;

  const THINKING = 1;
  const FEELING = 2;
  const AMBIV = 3;

  // Definitions for the label popup
  const labelDefinitions: Record<string, string> = {
    "Thinking": "Thinking types prioritize objective logic, exploration of ideas, and detached analysis. They focus on 'what is true' and functional efficiency.",
    "Feeling": "Feeling types prioritize social harmony, core values, and emotional connection. They focus on 'what is important' and interpersonal impact.",
    "Ambivalent": "Ambivalent individuals demonstrate cognitive versatility, skillfully balancing analytical logic with emotional intelligence depending on the context."
  };

  let privateRes = { id: "Ambivalent", type: AMBIV };
  let innateRes = { id: "Ambivalent", type: AMBIV };

  // --- 1. PRIVATE PERSONA LOGIC ---
  const privThinkM = [6 - qP(4), 6 - qP(5), 6 - qP(6)]; 
  const privFeelM = [qP(4), qP(5), qP(6), qP(7), qP(13), qP(15)];

  if (check(privThinkM) && !check(privFeelM)) {
    privateRes = { id: "Thinking", type: THINKING };
  } else if (check(privFeelM)) {
    privateRes = { id: "Feeling", type: FEELING };
  }

  // --- 2. INNATE PERSONA LOGIC ---
  const innThinkM = [qI(4), qI(5), qI(6)];
  const innFeelM = [qI(7), qI(10), qI(12), qI(15), 6 - qI(4), 6 - qI(5), 6 - qI(6)];

  if (check(innThinkM) && !check(innFeelM)) {
    innateRes = { id: "Thinking", type: THINKING };
  } else if (check(innFeelM)) {
    innateRes = { id: "Feeling", type: FEELING };
  }

  // --- 3. PUBLIC PERSONA LOGIC ---
  const pubExp = pub.Exploration;
  const pubFeel = (pub.Care + pub.Affiliation + pub.Value) / 3;
  const publicType = pubExp > pubFeel ? THINKING : FEELING;

  // --- POSITIVE & CONFIRMATIVE NARRATIVE GENERATION ---
  let summary = "";
  let analysis = "";

  // FALLBACK LABEL LOGIC: Private first, then Innate
  let finalLabel = privateRes.id;
  if (privateRes.type === AMBIV && innateRes.type !== AMBIV) {
    finalLabel = innateRes.id;
  }

  // CASE: Innate is set but Private is Ambivalent (Priority switch)
  if (privateRes.type === AMBIV && innateRes.type !== AMBIV) {
    summary = `You are fundamentally anchored in an innate **${innateRes.id}** orientation. This biological core provides you with a natural gift for ${innateRes.type === THINKING ? "objective analysis and intellectual discovery" : "emotional depth and building meaningful connections"}.`;
    analysis = `Consciously, you have developed a masterfully balanced approach. While your internal engine is ${innateRes.id.toLowerCase()}-driven, your daily life is characterized by high adaptability, allowing you to bridge logic and empathy with great professional and personal skill.`;
  }
  // CASE 1: Private Thinking, Innate Thinking (Genuine Alignment)
  else if (privateRes.type === THINKING && innateRes.type === THINKING) {
    summary = "You demonstrate a powerful and consistent Thinking preference. Both your conscious strategy and your natural instincts are perfectly aligned toward clarity, logic, and the pursuit of objective truth.";
    analysis = `This authentic intellectual focus is supported by an innate drive for exploration. You navigate the world with a high degree of rationality, making decisions based on evidence and functional effectiveness.`;
  } 
  // CASE 2: Private Thinking, Innate Feeling (Adaptive Specialist)
  else if (privateRes.type === THINKING && innateRes.type === FEELING) {
    summary = "You operate with a high-functioning Thinking mindset in your daily life, effectively prioritizing logic and task-oriented clarity.";
    analysis = "Interestingly, your biological core is deeply rooted in Feeling. This indicates a sophisticated ability to apply analytical logic to your environment while maintaining a hidden, powerful sensitivity to human values and core emotions.";
  }
  // CASE 3: Private Feeling, Innate Thinking (Strategic Collaborator)
  else if (privateRes.type === FEELING && innateRes.type === THINKING) {
    summary = "You lead with a warm Feeling preference in your conscious life, prioritizing harmony, core values, and effective social bonding.";
    analysis = "Beneath this collaborative exterior, your internal processing is remarkably analytical. You have the unique advantage of possessing a 'Thinking brain' that drives your inner logic, while using a 'Feeling heart' to navigate your social reality.";
  }
  // CASE 4: Private Feeling, Innate Feeling (Consistent Empath)
  else if (privateRes.type === FEELING && innateRes.type === FEELING) {
    summary = "You are consistently and authentically driven by a Feeling orientation. Your choices are guided by a deep commitment to personal values, empathy, and interpersonal connection.";
    analysis = "This alignment between your conscious persona and innate biology creates a life of great integrity. People likely experience you as deeply sincere, as your social warmth is fueled by a genuine biological need for harmony.";
  }
  // Fallback for full Ambivalence
  else {
    summary = "You possess a masterfully flexible orientation, seamlessly balancing Thinking and Feeling depending on the needs of the moment.";
    analysis = "This adaptive system prevents you from being limited by a single mode of judgment, allowing you to be logical when precision is required and empathetic when connection is key.";
  }

  // Public Persona Addition
  const pubText = publicType === THINKING 
    ? " Furthermore, you present a strong public persona of intellectual focus and analytical competence." 
    : " Furthermore, you project a public persona of interpersonal warmth and shared commitment to values.";

  return (
    <PanelUI 
      rosewood={rosewood}
      number="3"
      title="Thinking or Feeling"
      label={finalLabel}
      labelDetails={labelDefinitions[finalLabel]}
      archetype={finalLabel === "Ambivalent" ? "The Adaptive Navigator" : `The ${finalLabel} Individual`}
      summary={summary}
      analysis={analysis + pubText}
      matrix={[
        { c1: "Private Judgment", c2: privateRes.id, n: "Conscious" },
        { c1: "Innate Baseline", c2: innateRes.id, n: "Biological" },
        { c1: "Public Projection", c2: publicType === THINKING ? "Thinking" : "Feeling", n: "Persona" }
      ]}
    />
  );
}