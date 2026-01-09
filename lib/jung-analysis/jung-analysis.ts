// lib/reports/jung-analysis.ts
// Report builder (non-UI) for Jung surface + innate persona analysis.
// Produces a UI-friendly model that your page can render.

import { determineJungProfile, getPersonaDriveVectors } from "@/lib/core-utils/jung-core";
import type {
  AxisResult,
  EnergyPole,
  EnergyArchetypeId,
  PerceptionPole,
  PerceptionArchetypeId,
  JudgmentPole,
  JudgmentArchetypeId,
  OrientationPole,
  OrientationArchetypeId,
} from "@/lib/core-utils/jung-core";
import type { DriveVector } from "@/lib/core-utils/fit-core";

// ---------------------------------
// Types exported for UI consumption
// ---------------------------------

export type JungLetter = "I" | "E" | "N" | "S" | "T" | "F" | "J" | "P" | "X";

export type PersonaCodeBlock = {
  code: string; // e.g. "INTP"
  letters: [JungLetter, JungLetter, JungLetter, JungLetter];
  annotations: [string, string, string, string]; // e.g. ["I_exploration","N_patterns","T_logic","P_curious"]
};

export type JungOpeningModel = {
  left: {
    title: string; // "Surface Persona"
    codeBlock: PersonaCodeBlock;
    subtitle: string;
  };
  right: {
    title: string; // "Innate Persona"
    codeBlock: PersonaCodeBlock;
    subtitle: string;
  };

  behaviorMapping: {
    title: string;
    explanation: string; // paragraph text
    mappedCode: PersonaCodeBlock; // behavior-test style
  };
};

export type JungPanelModel = {
  key: "energy" | "perception" | "judgment" | "orientation";
  number: "1" | "2" | "3" | "4";
  title: string;

  // these map cleanly to your existing PanelUI usage
  label: string;
  labelDetails: string;
  archetype: string;

  surface: {
    pole: string;
    letter: JungLetter;
    annotation: string;
    archetype: string;
    description: string;
  };
  innate: {
    pole: string;
    letter: JungLetter;
    annotation: string;
    archetype: string;
    description: string;
  };

  summary: string;
  analysis: string;

  matrix: { c1: string; c2: string; n: string }[];

  // optional debug payloads if you want
  debug?: any;
};

export type JungAnalysisReport = {
  opening: JungOpeningModel;
  panels: JungPanelModel[];

  // raw axis outputs in case you want to render badges/tables later
  axes: ReturnType<typeof determineJungProfile>;

  // handy for future visuals
  vectors: {
    surfaceAvg: DriveVector;
    innateAvg: DriveVector;
  };
};

export type JungAnalysisInputs = {
  innateData: any; // row from innate-persona
  surfaceData: any; // row from surface-persona
};

type TranslateFn = (key: string, values?: Record<string, any>) => string;

// -------------------------
// Public entrypoint
// -------------------------

export function buildJungAnalysisReport(
  input: JungAnalysisInputs,
  translate?: TranslateFn
): JungAnalysisReport {
  const tr = (key: string, fallback: string, values?: Record<string, any>) => {
    if (translate) {
      try {
        const result = translate(key, values);
        if (result && result !== key) return result;
      } catch {
        // fall back to default string
      }
    }
    return formatTemplate(fallback, values);
  };

  const axes = determineJungProfile(input);
  const vectors = getPersonaDriveVectors(input);

  const surfaceCode = buildPersonaCode({
    energy: axes.energy.surface,
    perception: axes.perception.surface,
    judgment: axes.judgment.surface,
    orientation: axes.orientation.surface,
  });

  const innateCode = buildPersonaCode({
    energy: axes.energy.innate,
    perception: axes.perception.innate,
    judgment: axes.judgment.innate,
    orientation: axes.orientation.innate,
  });

  // Behavior-test mapping:
  // I/E + T/F from Surface; N/S + P/J from Innate
  const mappedCode = buildPersonaCode({
    energy: axes.energy.surface,
    perception: axes.perception.innate,
    judgment: axes.judgment.surface,
    orientation: axes.orientation.innate,
  });

  const opening: JungOpeningModel = {
    left: {
      title: tr("jungReport.opening.left.title", "Surface Persona"),
      codeBlock: surfaceCode,
      subtitle: tr(
        "jungReport.opening.left.subtitle",
        "How you typically show up outwardly (in behavior, interaction, and visible choices)."
      ),
    },
    right: {
      title: tr("jungReport.opening.right.title", "Innate Persona"),
      codeBlock: innateCode,
      subtitle: tr(
        "jungReport.opening.right.subtitle",
        "Your deeper default patterns (what feels natural when you’re not forcing adaptation)."
      ),
    },
    behaviorMapping: {
      title: tr("jungReport.opening.behaviorMapping.title", "Mapping to common behavior-test personas"),
      explanation: tr(
        "jungReport.opening.behaviorMapping.explanation",
        "Behavior-based tests focus on how you typically act across the four Jung dimensions. We treat I/E and T/F as everyday, action-facing axes, and S/N and J/P as inner cognitive and organizational axes. So, to estimate a behavior-based result (like MBTI), we take I/E and T/F from your Surface Persona and S/N and J/P from your Innate Persona."
      ),
      mappedCode,
    },
  };

  const panels: JungPanelModel[] = [
    buildEnergyPanel(axes.energy, tr),
    buildPerceptionPanel(axes.perception, tr),
    buildJudgmentPanel(axes.judgment, tr),
    buildOrientationPanel(axes.orientation, tr),
  ];

  return { opening, panels, axes, vectors };
}

function formatTemplate(text: string, values?: Record<string, any>) {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    const value = values[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

// ---------------------------------
// Persona code + annotations builder
// ---------------------------------

function toEnergyLetter(p: EnergyPole): JungLetter {
  if (p === "Introvert") return "I";
  if (p === "Extrovert") return "E";
  return "X";
}
function toPerceptionLetter(p: PerceptionPole): JungLetter {
  if (p === "Intuitive") return "N";
  if (p === "Sensing") return "S";
  return "X";
}
function toJudgmentLetter(p: JudgmentPole): JungLetter {
  if (p === "Thinking") return "T";
  if (p === "Feeling") return "F";
  return "X";
}
function toOrientationLetter(p: OrientationPole): JungLetter {
  if (p === "Judging") return "J";
  if (p === "Perspective") return "P";
  return "X";
}

function energyAnnotation(id: EnergyArchetypeId, pole: EnergyPole) {
  if (pole === "Introvert") return id === "Care Introvert" ? "I_care" : "I_exploration";
  if (pole === "Extrovert") {
    if (id === "Dominant Extrovert") return "E_dominance";
    if (id === "Pleasure Extrovert") return "E_pleasure";
    if (id === "Social Extrovert") return "E_affiliation";
    return "E_extroversion";
  }
  return "X_adaptive";
}

function perceptionAnnotation(id: PerceptionArchetypeId, pole: PerceptionPole) {
  if (pole === "Sensing") return id === "Detail Specialist" ? "S_detail" : "S_practical";
  if (pole === "Intuitive") return id === "Conceptual Visionary" ? "N_vision" : "N_patterns";
  return "X_flexible";
}

function judgmentAnnotation(id: JudgmentArchetypeId, pole: JudgmentPole) {
  if (pole === "Thinking") return id === "Analytical Architect" ? "T_logic" : "T_principles";
  if (pole === "Feeling") return id === "Empathetic Guardian" ? "F_care" : "F_values";
  return "X_contextual";
}

function orientationAnnotation(id: OrientationArchetypeId, pole: OrientationPole) {
  if (pole === "Judging") return id === "Goal Judging" ? "J_goal" : "J_process";
  if (pole === "Perspective") return id === "Curious Perspective" ? "P_curious" : "P_fun";
  return "X_adaptive";
}

function energySubscriptLabel(
  ann: string,
  tr: (key: string, fallback: string, values?: Record<string, any>) => string
) {
  if (ann.startsWith("I_")) {
    const subtype = ann.replace("I_", "");
    return tr(`jungReport.energy.subscript.introversion.${subtype}`, `Introversion_${subtype}`);
  }
  if (ann.startsWith("E_")) {
    const subtype = ann.replace("E_", "");
    return tr(`jungReport.energy.subscript.extroversion.${subtype}`, `Extroversion_${subtype}`);
  }
  if (ann.startsWith("X_")) {
    return tr("jungReport.energy.subscript.adaptive", "Introversion/Extroversion adaptive");
  }
  return ann;
}

function energyDrivePhrase(
  ann: string,
  pole: EnergyPole,
  tr: (key: string, fallback: string, values?: Record<string, any>) => string
) {
  if (ann.startsWith("I_")) {
    if (ann.includes("care")) {
      return tr("jungReport.energy.drivePhrase.introvert.care", "care and protection (Care)");
    }
    if (ann.includes("exploration")) {
      return tr("jungReport.energy.drivePhrase.introvert.exploration", "curiosity and discovery (Exploration)");
    }
    return tr("jungReport.energy.drivePhrase.introvert.fallback", "inward recovery (Exploration/Care)");
  }
  if (ann.startsWith("E_")) {
    if (ann.includes("dominance")) {
      return tr("jungReport.energy.drivePhrase.extrovert.dominance", "impact and leadership (Dominance)");
    }
    if (ann.includes("pleasure")) {
      return tr("jungReport.energy.drivePhrase.extrovert.pleasure", "stimulation and enjoyment (Pleasure)");
    }
    if (ann.includes("affiliation")) {
      return tr("jungReport.energy.drivePhrase.extrovert.affiliation", "connection and belonging (Affiliation)");
    }
    return tr("jungReport.energy.drivePhrase.extrovert.fallback", "outward activation (Dominance/Pleasure/Affiliation)");
  }
  return pole === "Introvert"
    ? tr("jungReport.energy.drivePhrase.mixed.introvert", "inward recovery (Exploration/Care)")
    : pole === "Extrovert"
      ? tr("jungReport.energy.drivePhrase.mixed.extrovert", "outward activation (Dominance/Pleasure/Affiliation)")
      : tr(
          "jungReport.energy.drivePhrase.mixed.balanced",
          "a balance of inward recovery (Exploration/Care) and outward activation (Dominance/Pleasure/Affiliation)"
        );
}

function perceptionSubscriptLabel(ann: string) {
  if (ann.startsWith("S_")) return ann.replace("S_", "Sensing_");
  if (ann.startsWith("N_")) return ann.replace("N_", "Intuition_");
  if (ann.startsWith("X_")) return "Sensing/Intuition adaptive";
  return ann;
}

function judgmentSubscriptLabel(ann: string) {
  if (ann.startsWith("T_")) return ann.replace("T_", "Thinking_");
  if (ann.startsWith("F_")) return ann.replace("F_", "Feeling_");
  if (ann.startsWith("X_")) return "Thinking/Feeling adaptive";
  return ann;
}

function orientationSubscriptLabel(ann: string) {
  if (ann.startsWith("J_")) return ann.replace("J_", "Judging_");
  if (ann.startsWith("P_")) return ann.replace("P_", "Perceiving_");
  if (ann.startsWith("X_")) return "Judging/Perceiving adaptive";
  return ann;
}

function buildPersonaCode(args: {
  energy: { pole: EnergyPole; archetypeId: EnergyArchetypeId };
  perception: { pole: PerceptionPole; archetypeId: PerceptionArchetypeId };
  judgment: { pole: JudgmentPole; archetypeId: JudgmentArchetypeId };
  orientation: { pole: OrientationPole; archetypeId: OrientationArchetypeId };
}): PersonaCodeBlock {
  const l1 = toEnergyLetter(args.energy.pole);
  const l2 = toPerceptionLetter(args.perception.pole);
  const l3 = toJudgmentLetter(args.judgment.pole);
  const l4 = toOrientationLetter(args.orientation.pole);

  const a1 = energyAnnotation(args.energy.archetypeId, args.energy.pole);
  const a2 = perceptionAnnotation(args.perception.archetypeId, args.perception.pole);
  const a3 = judgmentAnnotation(args.judgment.archetypeId, args.judgment.pole);
  const a4 = orientationAnnotation(args.orientation.archetypeId, args.orientation.pole);

  return {
    code: `${l1}${l2}${l3}${l4}`,
    letters: [l1, l2, l3, l4],
    annotations: [a1, a2, a3, a4],
  };
}

// -------------------------
// Panel model builders
// -------------------------

function buildEnergyPanel(
  axis: AxisResult<"energy", EnergyPole, EnergyArchetypeId>,
  tr: (key: string, fallback: string, values?: Record<string, any>) => string
): JungPanelModel {
  const labelDefs: Record<EnergyPole, string> = {
    Introvert: tr(
      "jungReport.energy.labelDefs.introvert",
      "Introversion is a surface strategy: you prefer depth, selectivity, and internal processing to manage energy."
    ),
    Extrovert: tr(
      "jungReport.energy.labelDefs.extrovert",
      "Extroversion is a surface strategy: you prefer outward engagement, activation, and external impact to manage energy."
    ),
    Ambivalent: tr(
      "jungReport.energy.labelDefs.ambivalent",
      "Ambivalence means you can switch: you may be outgoing in some contexts and quiet in others, depending on needs and safety."
    ),
  };

  const archetypes: Record<EnergyArchetypeId, string> = {
    "Exploration Introvert": tr("jungReport.energy.archetypes.explorationIntrovert", "The Insightful Voyager"),
    "Care Introvert": tr("jungReport.energy.archetypes.careIntrovert", "The Protective Guardian"),
    "Dominant Extrovert": tr("jungReport.energy.archetypes.dominantExtrovert", "The Strategic Leader"),
    "Pleasure Extrovert": tr("jungReport.energy.archetypes.pleasureExtrovert", "The Vibrant Enthusiast"),
    "Social Extrovert": tr("jungReport.energy.archetypes.socialExtrovert", "The Connected Connector"),
    "Adaptive Navigator": tr("jungReport.energy.archetypes.adaptiveNavigator", "The Versatile Socialite"),
  };

  const archetypeDescriptions: Record<EnergyArchetypeId, string> = {
    "Exploration Introvert": tr(
      "jungReport.energy.archetypeDescriptions.explorationIntrovert",
      "Your introverted energy flow is mainly consumed by a drive toward discovery and exploration, so you recharge through depth, curiosity, and inner mapping."
    ),
    "Care Introvert": tr(
      "jungReport.energy.archetypeDescriptions.careIntrovert",
      "Your introverted energy flow is mainly consumed by a drive to protect and support, so you recharge through safety, loyalty, and careful stewardship."
    ),
    "Dominant Extrovert": tr(
      "jungReport.energy.archetypeDescriptions.dominantExtrovert",
      "Your extroverted energy flow is mainly driven by impact and leadership, so you recharge through action, decisiveness, and visible influence."
    ),
    "Pleasure Extrovert": tr(
      "jungReport.energy.archetypeDescriptions.pleasureExtrovert",
      "Your extroverted energy flow is mainly driven by enjoyment and stimulation, so you recharge through variety, experience, and positive activation."
    ),
    "Social Extrovert": tr(
      "jungReport.energy.archetypeDescriptions.socialExtrovert",
      "Your extroverted energy flow is mainly driven by affiliation, so you recharge through connection, community, and shared momentum."
    ),
    "Adaptive Navigator": tr(
      "jungReport.energy.archetypeDescriptions.adaptiveNavigator",
      "Your energy flow flexes between inward focus and outward engagement, so you recharge by matching the environment and the task at hand."
    ),
  };

  const surfaceA = archetypes[axis.surface.archetypeId];
  const innateA = archetypes[axis.innate.archetypeId];

  const surfaceAnn = energyAnnotation(axis.surface.archetypeId, axis.surface.pole);
  const innateAnn = energyAnnotation(axis.innate.archetypeId, axis.innate.pole);

  const poleOf = (pole: EnergyPole) => {
    if (pole === "Introvert") return "Introvert" as const;
    if (pole === "Extrovert") return "Extrovert" as const;
    return "Adaptive" as const;
  };

  type EnergyPoleSimple = ReturnType<typeof poleOf>;
  type EnergySubtype = "exploration" | "care" | "dominance" | "pleasure" | "affiliation" | null;

  const subtypeOf = (ann: string, pole: EnergyPoleSimple): EnergySubtype => {
    if (pole === "Introvert") {
      if (ann.includes("care")) return "care";
      if (ann.includes("exploration")) return "exploration";
      return null;
    }
    if (pole === "Extrovert") {
      if (ann.includes("dominance")) return "dominance";
      if (ann.includes("pleasure")) return "pleasure";
      if (ann.includes("affiliation")) return "affiliation";
      return null;
    }
    return null;
  };

  const surfacePole = poleOf(axis.surface.pole);
  const innatePole = poleOf(axis.innate.pole);

  const surfaceSubtype = subtypeOf(surfaceAnn, surfacePole);
  const innateSubtype = subtypeOf(innateAnn, innatePole);

  const surfaceLabel = energySubscriptLabel(surfaceAnn, tr);
  const innateLabel = energySubscriptLabel(innateAnn, tr);

  const surfaceDrivePhrase = energyDrivePhrase(surfaceAnn, axis.surface.pole, tr);
  const innateDrivePhrase = energyDrivePhrase(innateAnn, axis.innate.pole, tr);

  const surfaceLine = () =>
    tr(
      "jungReport.energy.surfaceLine",
      "Your surface energy orientation shows how you choose to spend energy in everyday life. {detail}",
      {
        detail:
          axis.surface.pole === "Ambivalent"
            ? tr(
                "jungReport.energy.surfaceLineAdaptive",
                "It shows as Introversion/Extroversion adaptive. You can shift between introverted and extroverted modes depending on the context. This usually means you balance inward recovery (Exploration/Care) with outward activation (Dominance/Pleasure/Affiliation), which helps you socialize flexibly."
              )
            : tr(
                "jungReport.energy.surfaceLineFixed",
                "It shows as {label}: you choose to spend more energy on {drivePhrase}.",
                { label: surfaceLabel, drivePhrase: surfaceDrivePhrase }
              ),
      }
    );

  const innateAnchor = () =>
    tr(
      "jungReport.energy.innateLine",
      "Your innate energy orientation determines which energy patterns recharge you or drain you. It shows as {label}, {detail}",
      {
        label: innateLabel,
        detail:
          axis.innate.pole === "Ambivalent"
            ? tr(
                "jungReport.energy.innateLineAdaptive",
                "indicating a complex, situational dependence. You can consult your innate drive profile to see whether extroverted drives (Dominance, Pleasure, Affiliation) recharge you more or introverted drives (Exploration, Care) recharge you more."
              )
            : tr(
                "jungReport.energy.innateLineFixed",
                "indicating {drivePhrase} tends to recharge you more.",
                { drivePhrase: innateDrivePhrase }
              ),
      }
    );

  const matched =
    (surfacePole === "Adaptive" && innatePole === "Adaptive") ||
    (surfacePole === "Introvert" && innatePole === "Introvert" && surfaceSubtype === innateSubtype) ||
    (surfacePole === "Extrovert" && innatePole === "Extrovert" && surfaceSubtype === innateSubtype);

  const matchedScript = () => {
    if (surfacePole === "Introvert") {
      return surfaceSubtype === "care"
        ? tr(
            "jungReport.energy.matched.introvertCare",
            "Both your Surface and Innate energy orientation are Introverted (care-focused). You consistently recharge through safety, loyalty, and protective stewardship."
          )
        : tr(
            "jungReport.energy.matched.introvertExploration",
            "Both your Surface and Innate energy orientation are Introverted (exploration-focused). You consistently recharge through depth, curiosity, and inner discovery."
          );
    }
    if (surfacePole === "Extrovert") {
      if (surfaceSubtype === "dominance") {
        return tr(
          "jungReport.energy.matched.extrovertDominance",
          "Both your Surface and Innate energy orientation are Extroverted (impact-focused). You consistently recharge through action, leadership, and visible influence."
        );
      }
      if (surfaceSubtype === "pleasure") {
        return tr(
          "jungReport.energy.matched.extrovertPleasure",
          "Both your Surface and Innate energy orientation are Extroverted (stimulation-focused). You consistently recharge through variety, experience, and positive activation."
        );
      }
      return tr(
        "jungReport.energy.matched.extrovertAffiliation",
        "Both your Surface and Innate energy orientation are Extroverted (connection-focused). You consistently recharge through community, belonging, and shared momentum."
      );
    }
    return tr(
      "jungReport.energy.matched.adaptive",
      "Both your Surface and Innate energy orientation are Adaptive. You can shift between introversion and extroversion depending on the context."
    );
  };

  const subtypeMismatchNote = () => {
    if (surfacePole !== innatePole) return null;
    if (surfacePole === "Adaptive") return null;
    if (surfaceSubtype === innateSubtype) return null;

    if (surfacePole === "Introvert") {
      return tr(
        "jungReport.energy.subtypeMismatch.introvertCareVsExploration",
        "Your Surface energy is Introverted but emphasizes a different introverted subtype than your Innate baseline. This can feel like: you outwardly lean into one inward strategy, while privately you recharge more through the other (care vs. exploration)."
      );
    }

    return tr(
      "jungReport.energy.subtypeMismatch.extrovertSubtype",
      "Your Surface energy is Extroverted but emphasizes a different extroverted subtype than your Innate baseline. This can feel like: you outwardly lean into one activation style, while privately a different style (impact vs. stimulation vs. connection) restores you more."
    );
  };

  const summary = matched
    ? matchedScript()
    : axis.surface.pole === "Introvert"
      ? tr(
          "jungReport.energy.summary.introvert",
          "Your Surface Persona operates with an Introverted strategy, expressed as {archetype}.",
          { archetype: surfaceA }
        )
      : axis.surface.pole === "Extrovert"
        ? tr(
            "jungReport.energy.summary.extrovert",
            "Your Surface Persona leads with an Extroverted strategy, expressed as {archetype}.",
            { archetype: surfaceA }
          )
        : tr(
            "jungReport.energy.summary.ambivalent",
            "Your Surface Persona is Ambivalent, expressed as {archetype}—you can flex between reflection and engagement.",
            { archetype: surfaceA }
          );

  const analysis = matched ? matchedScript() : `${surfaceLine()} ${innateAnchor()} ${subtypeMismatchNote() ?? ""}`.trim();

  const behaviorNote = tr(
    "jungReport.energy.behaviorNote",
    "Since common behavior-based tests treat introversion/extroversion as everyday behavior, we use your surface energy orientation as your overall label."
  );

  const label =
    axis.surface.pole === "Ambivalent" ? "Ambivalent" : axis.surface.pole === "Introvert" ? "Introvert" : "Extrovert";

  return {
    key: "energy",
    number: "1",
    title: tr("jungReport.energy.title", "Energy & Attention"),
    label,
    labelDetails: labelDefs[label as EnergyPole] ?? labelDefs.Ambivalent,
    archetype: surfaceA,
    surface: {
      pole: axis.surface.pole,
      letter: toEnergyLetter(axis.surface.pole),
      annotation: surfaceAnn,
      archetype: surfaceA,
      description: archetypeDescriptions[axis.surface.archetypeId],
    },
    innate: {
      pole: axis.innate.pole,
      letter: toEnergyLetter(axis.innate.pole),
      annotation: innateAnn,
      archetype: innateA,
      description: archetypeDescriptions[axis.innate.archetypeId],
    },
    summary,
    analysis: `${analysis} ${behaviorNote}`,
    matrix: [
      {
        c1: tr("jungReport.energy.matrix.surfaceTitle", "Surface Persona"),
        c2: surfaceA,
        n: tr("jungReport.energy.matrix.surfaceNote", "Your outward energy strategy and visible engagement style."),
      },
      {
        c1: tr("jungReport.energy.matrix.innateTitle", "Innate Persona"),
        c2: innateA,
        n: tr("jungReport.energy.matrix.innateNote", "Your baseline energy system when you don’t force adaptation."),
      },
      {
        c1: tr("jungReport.energy.matrix.syncTitle", "Sync"),
        c2: axis.aligned
          ? tr("jungReport.energy.matrix.syncAligned", "Aligned")
          : tr("jungReport.energy.matrix.syncAdaptive", "Adaptive"),
        n: axis.aligned
          ? tr("jungReport.energy.matrix.syncNoteAligned", "Outer strategy and baseline support each other.")
          : tr("jungReport.energy.matrix.syncNoteAdaptive", "You flex between modes across contexts."),
      },
    ],
    debug: { axis },
  };
}

function buildPerceptionPanel(
  axis: AxisResult<"perception", PerceptionPole, PerceptionArchetypeId>,
  tr: (key: string, fallback: string, values?: Record<string, any>) => string
): JungPanelModel {
  const labelDefs: Record<PerceptionPole, string> = {
    Intuitive:
      tr(
        "jungReport.perception.labelDefs.intuitive",
        "Intuition emphasizes patterns, meaning, and future possibility. You naturally search for the big picture and hidden connections."
      ),
    Sensing:
      tr(
        "jungReport.perception.labelDefs.sensing",
        "Sensing emphasizes concrete facts, present reality, and reliable methods. You naturally trust details, evidence, and practical execution."
      ),
    Ambivalent:
      tr(
        "jungReport.perception.labelDefs.ambivalent",
        "Ambivalence indicates cognitive flexibility: you can move between detail-focus and pattern-focus depending on the task."
      ),
  };

  const archetypes: Record<PerceptionArchetypeId, string> = {
    "Pragmatic Realist": tr("jungReport.perception.archetypes.pragmaticRealist", "Tangible Facts & Present Utility"),
    "Detail Specialist": tr("jungReport.perception.archetypes.detailSpecialist", "Precision, Quality & Concrete Data"),
    "Conceptual Visionary": tr(
      "jungReport.perception.archetypes.conceptualVisionary",
      "Abstract Patterns & Future Possibility"
    ),
    "Insight Explorer": tr("jungReport.perception.archetypes.insightExplorer", "Hidden Meanings & Global Connections"),
    "Perceptive Generalist": tr(
      "jungReport.perception.archetypes.perceptiveGeneralist",
      "Balanced Fact-Pattern Integration"
    ),
  };
  const archetypeDescriptions: Record<PerceptionArchetypeId, string> = {
    "Pragmatic Realist":
      tr(
        "jungReport.perception.archetypeDescriptions.pragmaticRealist",
        "Your perception gravitates toward what is concrete and useful right now, so you trust practical signals and present reality."
      ),
    "Detail Specialist":
      tr(
        "jungReport.perception.archetypeDescriptions.detailSpecialist",
        "Your perception is tuned to fine-grained details and accuracy, so you notice what others miss and prefer clear evidence."
      ),
    "Conceptual Visionary":
      tr(
        "jungReport.perception.archetypeDescriptions.conceptualVisionary",
        "Your perception is pulled toward future possibility and abstract patterns, so you see where ideas can go next."
      ),
    "Insight Explorer":
      tr(
        "jungReport.perception.archetypeDescriptions.insightExplorer",
        "Your perception searches for hidden connections and deeper meanings, so you connect dots across themes and contexts."
      ),
    "Perceptive Generalist":
      tr(
        "jungReport.perception.archetypeDescriptions.perceptiveGeneralist",
        "Your perception balances detail and pattern, so you can move between facts and possibilities without losing clarity."
      ),
  };

  const innateA = archetypes[axis.innate.archetypeId];
  const surfaceA = archetypes[axis.surface.archetypeId];
  const surfaceAnn = perceptionAnnotation(axis.surface.archetypeId, axis.surface.pole);
  const innateAnn = perceptionAnnotation(axis.innate.archetypeId, axis.innate.pole);

  const summary =
    axis.innate.pole === "Ambivalent"
      ? tr(
          "jungReport.perception.summary.ambivalent",
          "Your Innate Persona for perception is naturally balanced: you can absorb both concrete data and abstract patterns with low friction."
        )
      : tr(
          "jungReport.perception.summary.anchored",
          "Your Innate Persona for perception is anchored in {pole}, operating as {archetype}.",
          { pole: axis.innate.pole, archetype: innateA }
        );

  const surfaceLine = (s: "Sensing" | "Intuitive" | "Ambivalent") => {
    if (s === "Sensing") {
      return tr(
        "jungReport.perception.surfaceLine.sensing",
        "Your Surface information processing is Sensing: you focus on practical details and concrete reality."
      );
    }
    if (s === "Intuitive") {
      return tr(
        "jungReport.perception.surfaceLine.intuitive",
        "Your Surface information processing is Intuition: you focus on abstract patterns and future possibilities."
      );
    }
    return tr(
      "jungReport.perception.surfaceLine.adaptive",
      "Your Surface information processing is Adaptive: sometimes you focus on practical goals, and sometimes you focus on patterns and possibilities."
    );
  };

  const innateAnchor = (i: "Sensing" | "Intuitive" | "Ambivalent") => {
    if (i === "Sensing") {
      return tr(
        "jungReport.perception.innateAnchor.sensing",
        "Because your Innate style is Sensing, even when you use different surface strategies, your effort tends to stay grounded in practical outcomes and real-world constraints."
      );
    }
    if (i === "Intuitive") {
      return tr(
        "jungReport.perception.innateAnchor.intuitive",
        "Because your Innate style is Intuition, even when you use different surface strategies, you tend to push beyond practical limits and look for broader meaning or future potential."
      );
    }
    return tr(
      "jungReport.perception.innateAnchor.adaptive",
      "Because your Innate style is Adaptive, your baseline is flexible: you can ground some tasks in practical goals while allowing other tasks to expand beyond immediate practicality."
    );
  };

  const matched = axis.surface.pole === axis.innate.pole;
  let analysis = "";

  if (matched) {
    if (axis.surface.pole === "Sensing") {
      analysis =
        tr(
          "jungReport.perception.matched.sensing",
          "Both your Surface and Innate information processing are Sensing. You naturally focus on practical facts, concrete details, and what can be applied right now. You are thoroughly practical."
        );
    } else if (axis.surface.pole === "Intuitive") {
      analysis =
        tr(
          "jungReport.perception.matched.intuitive",
          "Both your Surface and Innate information processing are Intuition. You naturally focus on patterns, meaning, and future possibilities. You’re not limited by immediate practical constraints."
        );
    } else {
      analysis =
        tr(
          "jungReport.perception.matched.adaptive",
          "Both your Surface and Innate information processing are Adaptive. You can shift: sometimes you keep information work tied to practical goals, and other times you extend it into broader possibilities."
        );
    }
  } else {
    analysis = `${surfaceLine(axis.surface.pole)} ${innateAnchor(axis.innate.pole)}`;
  }
  const behaviorNote = tr(
    "jungReport.perception.behaviorNote",
    "For Information Processing (N/S), because it is your innate cognitive function, we take the label from your Innate Persona as the overall trait in this dimension."
  );

  return {
    key: "perception",
    number: "2",
    title: tr("jungReport.perception.title", "Information Processing"),
    label: axis.innate.pole,
    labelDetails: labelDefs[axis.innate.pole],
    archetype: innateA,
    surface: {
      pole: axis.surface.pole,
      letter: toPerceptionLetter(axis.surface.pole),
      annotation: surfaceAnn,
      archetype: surfaceA,
      description: archetypeDescriptions[axis.surface.archetypeId],
    },
    innate: {
      pole: axis.innate.pole,
      letter: toPerceptionLetter(axis.innate.pole),
      annotation: innateAnn,
      archetype: innateA,
      description: archetypeDescriptions[axis.innate.archetypeId],
    },
    summary,
    analysis: `${analysis} ${behaviorNote}`,
    matrix: [
      {
        c1: tr("jungReport.perception.matrix.innateTitle", "Innate Persona"),
        c2: innateA,
        n: tr("jungReport.perception.matrix.innateNote", "Your default way of absorbing information."),
      },
      {
        c1: tr("jungReport.perception.matrix.surfaceTitle", "Surface Persona"),
        c2: surfaceA,
        n: tr("jungReport.perception.matrix.surfaceNote", "Your day-to-day lens for prioritizing information."),
      },
      {
        c1: tr("jungReport.perception.matrix.syncTitle", "Sync"),
        c2: axis.aligned
          ? tr("jungReport.perception.matrix.syncAligned", "Aligned")
          : tr("jungReport.perception.matrix.syncFlexible", "Flexible"),
        n: axis.aligned
          ? tr("jungReport.perception.matrix.syncNoteAligned", "Baseline and surface lens match.")
          : tr("jungReport.perception.matrix.syncNoteFlexible", "You can switch lenses when needed."),
      },
    ],
    debug: { axis },
  };
}

function buildJudgmentPanel(
  axis: AxisResult<"judgment", JudgmentPole, JudgmentArchetypeId>,
  tr: (key: string, fallback: string, values?: Record<string, any>) => string
): JungPanelModel {
  const labelDefs: Record<JudgmentPole, string> = {
    Thinking:
      tr(
        "jungReport.judgment.labelDefs.thinking",
        "Thinking prioritizes objective logic and functional consistency—decisions lean toward truth, structure, and efficiency."
      ),
    Feeling:
      tr(
        "jungReport.judgment.labelDefs.feeling",
        "Feeling prioritizes values, harmony, and human impact—decisions lean toward meaning, ethics, and relational effects."
      ),
    Ambivalent:
      tr(
        "jungReport.judgment.labelDefs.ambivalent",
        "Ambivalence indicates you can shift between logic-first and value-first judgment depending on context and stakes."
      ),
  };

  const archetypes: Record<JudgmentArchetypeId, string> = {
    "Analytical Architect": tr("jungReport.judgment.archetypes.analyticalArchitect", "Systemic Logic & Discovery"),
    "Principled Strategist": tr("jungReport.judgment.archetypes.principledStrategist", "Value-Driven Rationality"),
    "Empathetic Guardian": tr("jungReport.judgment.archetypes.empatheticGuardian", "Compassionate Care & Harmony"),
    "Moral Convictionist": tr("jungReport.judgment.archetypes.moralConvictionist", "Idealistic Integrity & Value"),
    "Adaptive Mediator": tr("jungReport.judgment.archetypes.adaptiveMediator", "Contextual Logic-Value Bridge"),
  };
  const archetypeDescriptions: Record<JudgmentArchetypeId, string> = {
    "Analytical Architect":
      tr(
        "jungReport.judgment.archetypeDescriptions.analyticalArchitect",
        "Your judgment favors structural logic and consistency, so you decide by building clear systems and checking coherence."
      ),
    "Principled Strategist":
      tr(
        "jungReport.judgment.archetypeDescriptions.principledStrategist",
        "Your judgment favors rational strategy grounded in principles, so you decide by aligning choices with core standards."
      ),
    "Empathetic Guardian":
      tr(
        "jungReport.judgment.archetypeDescriptions.empatheticGuardian",
        "Your judgment favors care and relational impact, so you decide by protecting people and preserving harmony."
      ),
    "Moral Convictionist":
      tr(
        "jungReport.judgment.archetypeDescriptions.moralConvictionist",
        "Your judgment favors moral integrity and values, so you decide by what feels right and ethically consistent."
      ),
    "Adaptive Mediator":
      tr(
        "jungReport.judgment.archetypeDescriptions.adaptiveMediator",
        "Your judgment flexes between logic and values, so you decide by reading context and balancing tradeoffs."
      ),
  };

  const surfaceA = archetypes[axis.surface.archetypeId];
  const innateA = archetypes[axis.innate.archetypeId];
  const surfaceAnn = judgmentAnnotation(axis.surface.archetypeId, axis.surface.pole);
  const innateAnn = judgmentAnnotation(axis.innate.archetypeId, axis.innate.pole);

  const summary =
    axis.surface.pole === "Ambivalent"
      ? tr(
          "jungReport.judgment.summary.ambivalent",
          "You have a flexible real-world judgment style: you can use logic or empathy depending on what the situation calls for."
        )
      : tr(
          "jungReport.judgment.summary.surface",
          "In your Surface Persona, you lead with {pole}, operating as {archetype}.",
          { pole: axis.surface.pole, archetype: surfaceA }
        );

  const surfaceLine = (s: "Thinking" | "Feeling" | "Adaptive") => {
    if (s === "Thinking") {
      return tr(
        "jungReport.judgment.surfaceLine.thinking",
        "Your Surface judgment style is Thinking: you present decisions through logic, consistency, and objective reasoning."
      );
    }
    if (s === "Feeling") {
      return tr(
        "jungReport.judgment.surfaceLine.feeling",
        "Your Surface judgment style is Feeling: you present decisions through values, ethics, and sensitivity to human impact."
      );
    }
    return tr(
      "jungReport.judgment.surfaceLine.adaptive",
      "Your Surface judgment style is Adaptive: sometimes you lead with logic and consistency, and other times you lead with values and relational impact."
    );
  };

  const innateAnchor = (i: "Thinking" | "Feeling" | "Adaptive") => {
    if (i === "Thinking") {
      return tr(
        "jungReport.judgment.innateAnchor.thinking",
        "Because your Innate style is Thinking, even when you use different surface strategies, your internal decision engine tends to return to logic, structure, and functional truth."
      );
    }
    if (i === "Feeling") {
      return tr(
        "jungReport.judgment.innateAnchor.feeling",
        "Because your Innate style is Feeling, even when you use different surface strategies, your internal decision engine tends to return to values, ethics, and the human consequences of choices."
      );
    }
    return tr(
      "jungReport.judgment.innateAnchor.adaptive",
      "Because your Innate style is Adaptive, your baseline is flexible: you can genuinely operate in both logic-first and values-first modes, and which one dominates depends on safety, stakes, and context."
    );
  };

  const integrationNote = (surface: "Thinking" | "Feeling" | "Adaptive", innate: "Thinking" | "Feeling" | "Adaptive") => {
    if (surface === "Thinking" && innate === "Feeling") {
      return tr(
        "jungReport.judgment.integration.valuesInside",
        "Integration style: values inside, logic outside. You may use a rational presentation layer to navigate the world, while your deeper compass is value-based."
      );
    }
    if (surface === "Feeling" && innate === "Thinking") {
      return tr(
        "jungReport.judgment.integration.logicInside",
        "Integration style: logic inside, warmth outside. You may run an analytical engine internally while using a relational style to work effectively with people."
      );
    }
    if (surface === "Adaptive" && (innate === "Thinking" || innate === "Feeling")) {
      return tr(
        "jungReport.judgment.integration.flexPublic",
        "Integration style: a flexible public style built on a consistent inner baseline."
      );
    }
    if ((surface === "Thinking" || surface === "Feeling") && innate === "Adaptive") {
      return tr(
        "jungReport.judgment.integration.flexInner",
        "Integration style: a consistent public style built on a flexible inner engine."
      );
    }
    return tr(
      "jungReport.judgment.integration.generic",
      "Integration style: a translation skill between what feels natural internally and what works best externally in specific contexts."
    );
  };

  const matchedSummary = (s: "Thinking" | "Feeling" | "Adaptive") => {
    if (s === "Thinking") {
      return tr(
        "jungReport.judgment.matchedSummary.thinking",
        "Both your Surface and Innate judgment style are Thinking. You naturally prioritize logic, consistency, and objective evaluation."
      );
    }
    if (s === "Feeling") {
      return tr(
        "jungReport.judgment.matchedSummary.feeling",
        "Both your Surface and Innate judgment style are Feeling. You naturally prioritize values, human impact, and relational harmony."
      );
    }
    return tr(
      "jungReport.judgment.matchedSummary.adaptive",
      "Both your Surface and Innate judgment style are Adaptive. You can switch between logic-first and values-first decision-making depending on context."
    );
  };

  const matchedAnalysis = (s: "Thinking" | "Feeling" | "Adaptive") => {
    if (s === "Thinking") {
      return tr(
        "jungReport.judgment.matchedAnalysis.thinking",
        "This creates a stable, explainable decision style: you tend to prefer clear reasoning, consistent standards, and functional outcomes."
      );
    }
    if (s === "Feeling") {
      return tr(
        "jungReport.judgment.matchedAnalysis.feeling",
        "This creates a stable, meaning-centered decision style: you tend to prioritize ethical fit, trust, and the relational consequences of choices."
      );
    }
    return tr(
      "jungReport.judgment.matchedAnalysis.adaptive",
      "This creates high versatility: you can use structure when needed and empathy when needed, but you may benefit from explicitly choosing which mode the situation calls for."
    );
  };

  const surfaceStyle = axis.surface.pole === "Ambivalent" ? "Adaptive" : axis.surface.pole;
  const innateStyle = axis.innate.pole === "Ambivalent" ? "Adaptive" : axis.innate.pole;
  const matched = surfaceStyle === innateStyle;

  const analysis = matched
    ? `${matchedSummary(surfaceStyle)} ${matchedAnalysis(surfaceStyle)}`
    : `${surfaceLine(surfaceStyle)} ${innateAnchor(innateStyle)} ${integrationNote(surfaceStyle, innateStyle)}`;
  const behaviorNote = tr(
    "jungReport.judgment.behaviorNote",
    "Since Thinking and Feeling is an surface behavior, we pick this trait in your surface persona as your overall label."
  );

  return {
    key: "judgment",
    number: "3",
    title: tr("jungReport.judgment.title", "Decision Style"),
    label: axis.surface.pole,
    labelDetails: labelDefs[axis.surface.pole],
    archetype: surfaceA,
    surface: {
      pole: axis.surface.pole,
      letter: toJudgmentLetter(axis.surface.pole),
      annotation: surfaceAnn,
      archetype: surfaceA,
      description: archetypeDescriptions[axis.surface.archetypeId],
    },
    innate: {
      pole: axis.innate.pole,
      letter: toJudgmentLetter(axis.innate.pole),
      annotation: innateAnn,
      archetype: innateA,
      description: archetypeDescriptions[axis.innate.archetypeId],
    },
    summary,
    analysis: `${analysis} ${behaviorNote}`,
    matrix: [
      {
        c1: tr("jungReport.judgment.matrix.surfaceTitle", "Surface Persona"),
        c2: surfaceA,
        n: tr("jungReport.judgment.matrix.surfaceNote", "Your visible judgment style in real-world decisions."),
      },
      {
        c1: tr("jungReport.judgment.matrix.innateTitle", "Innate Persona"),
        c2: innateA,
        n: tr("jungReport.judgment.matrix.innateNote", "Your baseline judgment engine when stakes are internal/private."),
      },
      {
        c1: tr("jungReport.judgment.matrix.syncTitle", "Sync"),
        c2: axis.aligned
          ? tr("jungReport.judgment.matrix.syncAligned", "Aligned")
          : tr("jungReport.judgment.matrix.syncAdaptive", "Adaptive"),
        n: axis.aligned
          ? tr("jungReport.judgment.matrix.syncNoteAligned", "Outer style matches baseline.")
          : tr("jungReport.judgment.matrix.syncNoteAdaptive", "Outer style is a strategic translation of baseline."),
      },
    ],
    debug: { axis },
  };
}

function buildOrientationPanel(
  axis: AxisResult<"orientation", OrientationPole, OrientationArchetypeId>,
  tr: (key: string, fallback: string, values?: Record<string, any>) => string
): JungPanelModel {
  const labelDefs: Record<OrientationPole, string> = {
    Judging:
      tr(
        "jungReport.orientation.labelDefs.judging",
        "Judging prefers structure, closure, and clarity—planning and decisions reduce uncertainty and create stable progress."
      ),
    Perspective:
      tr(
        "jungReport.orientation.labelDefs.perspective",
        "Perceiving prefers openness, discovery, and flexibility—options stay open so you can adapt to new information."
      ),
    Ambivalent:
      tr(
        "jungReport.orientation.labelDefs.ambivalent",
        "Ambivalence indicates high agility: you can plan tightly when needed and stay open when exploration is more valuable."
      ),
  };

  const archetypes: Record<OrientationArchetypeId, string> = {
    "Goal Judging": tr("jungReport.orientation.archetypes.goalJudging", "Target Driven Closure"),
    "Process Judging": tr("jungReport.orientation.archetypes.processJudging", "Structured Systematic Order"),
    "Curious Perspective": tr("jungReport.orientation.archetypes.curiousPerspective", "Unrestrained Mental Explorer"),
    "Fun Perspective": tr("jungReport.orientation.archetypes.funPerspective", "Spontaneous Experience Seeker"),
    Ambivalent: tr("jungReport.orientation.archetypes.ambivalent", "Flexible Adaptive Navigator"),
  };
  const archetypeDescriptions: Record<OrientationArchetypeId, string> = {
    "Goal Judging":
      tr(
        "jungReport.orientation.archetypeDescriptions.goalJudging",
        "Your orientation prioritizes clear goals and closure, so you prefer plans, targets, and decisive progress."
      ),
    "Process Judging":
      tr(
        "jungReport.orientation.archetypeDescriptions.processJudging",
        "Your orientation prioritizes structured systems, so you prefer orderly steps and reliable routines."
      ),
    "Curious Perspective":
      tr(
        "jungReport.orientation.archetypeDescriptions.curiousPerspective",
        "Your orientation prioritizes exploration, so you keep options open to follow curiosity and new information."
      ),
    "Fun Perspective":
      tr(
        "jungReport.orientation.archetypeDescriptions.funPerspective",
        "Your orientation prioritizes spontaneity and experience, so you stay flexible and adapt as life unfolds."
      ),
    Ambivalent:
      tr(
        "jungReport.orientation.archetypeDescriptions.ambivalent",
        "Your orientation flexes between structure and openness, so you shift between planning and exploration as needed."
      ),
  };

  const innateA = archetypes[axis.innate.archetypeId];
  const surfaceA = archetypes[axis.surface.archetypeId];
  const surfaceAnn = orientationAnnotation(axis.surface.archetypeId, axis.surface.pole);
  const innateAnn = orientationAnnotation(axis.innate.archetypeId, axis.innate.pole);

  const poleOf = (pole: OrientationPole) => {
    if (pole === "Judging") return "Judging" as const;
    if (pole === "Perspective") return "Perspective" as const;
    return "Adaptive" as const;
  };

  const judgingSubtypeOf = (ann: string) => {
    if (ann === "J_goal") return "goal" as const;
    if (ann === "J_process") return "process" as const;
    return null;
  };

  const surfacePole = poleOf(axis.surface.pole);
  const innatePole = poleOf(axis.innate.pole);
  const surfaceSubtype = surfacePole === "Judging" ? judgingSubtypeOf(surfaceAnn) : null;
  const innateSubtype = innatePole === "Judging" ? judgingSubtypeOf(innateAnn) : null;

  const surfaceLine = () => {
    if (surfacePole === "Judging") {
      return surfaceSubtype === "goal"
        ? tr(
            "jungReport.orientation.surfaceLine.judgingGoal",
            "Your Surface orientation is Judging (goal-focused): you prefer closure through milestones, deliverables, and clear endpoints in everyday life."
          )
        : tr(
            "jungReport.orientation.surfaceLine.judgingProcess",
            "Your Surface orientation is Judging (process-focused): you prefer closure through systems, routines, and step-by-step order in everyday life."
          );
    }
    if (surfacePole === "Perspective") {
      return tr(
        "jungReport.orientation.surfaceLine.perspective",
        "Your Surface orientation is Perspective: you prefer flexibility, keeping options open, and adapting as new information arrives in everyday life."
      );
    }
    return tr(
      "jungReport.orientation.surfaceLine.adaptive",
      "Your Surface orientation is adaptive: sometimes you structure tightly, and other times you stay open—depending on what the situation demands in everyday life."
    );
  };

  const innateAnchor = () => {
    if (innatePole === "Judging") {
      return innateSubtype === "goal"
        ? tr(
            "jungReport.orientation.innateAnchor.judgingGoal",
            "Since your Innate orientation is goal-focused Judging, no matter what Surface strategy you use, you eventually want to hit targets on time and efficiently regardless of the process adopted."
          )
        : tr(
            "jungReport.orientation.innateAnchor.judgingProcess",
            "Since your Innate orientation is process-focused Judging, no matter what Surface strategy you use, you eventually want to reach goals through orderly processes that follow predefined procedures and schedules. If the order is broken, you may feel irritated. You feel the best when plans proceed orderly"
          );
    }
    if (innatePole === "Perspective") {
      return tr(
        "jungReport.orientation.innateAnchor.perspective",
        "Since your Innate orientation is Perspective, no matter what Surface strategy you use, you eventually want breathing room—too much effort on reaching goals or following procedures feels restrictive over time."
      );
    }
    return tr(
      "jungReport.orientation.innateAnchor.adaptive",
      "Since your Innate orientation is adaptive, no matter what Surface strategy you use, you naturally re-adjust—sometimes you make plans, and at other times you follow the natural flow of life without much planning."
    );
  };

  const matched =
    (surfacePole === "Adaptive" && innatePole === "Adaptive") ||
    (surfacePole === "Perspective" && innatePole === "Perspective") ||
    (surfacePole === "Judging" && innatePole === "Judging" && surfaceSubtype === innateSubtype);

  const matchedScript = () => {
    if (surfacePole === "Judging") {
      return surfaceSubtype === "goal"
        ? tr(
            "jungReport.orientation.matched.judgingGoal",
            "Both your Surface and Innate orientation are goal-closure Judging. You naturally push toward decisions and finish lines, and you also organize daily life to reach milestones efficiently."
          )
        : tr(
            "jungReport.orientation.matched.judgingProcess",
            "Both your Surface and Innate orientation are process-closure Judging. You naturally seek order through systems and routines, and you also execute that way day-to-day."
          );
    }
    if (surfacePole === "Perspective") {
      return tr(
        "jungReport.orientation.matched.perspective",
        "Both your Surface and Innate orientation are Perspective. You naturally keep options open, prefer flexibility, and stay responsive to new information rather than forcing early closure."
      );
    }
    return tr(
      "jungReport.orientation.matched.adaptive",
      "Both your Surface and Innate orientation are adaptive. You can plan tightly when it matters, and stay open when exploration matters—without getting stuck in one mode."
    );
  };

  const subtypeMismatchNote = () => {
    if (surfacePole !== "Judging" || innatePole !== "Judging") return null;
    if (surfaceSubtype === innateSubtype) return null;
    if (surfaceSubtype === "goal" && innateSubtype === "process") {
      return tr(
        "jungReport.orientation.subtypeMismatch.goalVsProcess",
        "Your Surface orientation pushes for finish lines and milestones, but your Innate baseline wants an orderly process in reaching goals. This can cause “deadline-driven execution with process friction inside”: you want results fast, but you feel best when the process is orderly. When the process feels random, it may irritate you in the background."
      );
    }
    if (surfaceSubtype === "process" && innateSubtype === "goal") {
      return tr(
        "jungReport.orientation.subtypeMismatch.processVsGoal",
        "Your Surface orientation prefers orderly processes for reaching goals, but your Innate baseline wants clear milestones. This can create “orderly process vs. goal-reaching friction”: you follow procedures and schedules on the surface, yet feel irritated when goals are not reached efficiently. You feel best when procedures serve the purpose of reaching endpoints efficiently."
      );
    }
    return null;
  };

  const summary = matched ? matchedScript() : surfaceLine();
  const analysis = matched ? matchedScript() : `${surfaceLine()} ${innateAnchor()} ${subtypeMismatchNote() ?? ""}`.trim();

  const behaviorNote = tr(
    "jungReport.orientation.behaviorNote",
    "Because Judging/Perspective is an innate choice on cognition and ways to achieve goals, we pick the Innate Persona as the basis for setting the label of this dimension."
  );

  return {
    key: "orientation",
    number: "4",
    title: tr("jungReport.orientation.title", "Lifestyle"),
    label:
      axis.innate.pole === "Perspective"
        ? tr("jungReport.orientation.label.perceiving", "Perceiving")
        : axis.innate.pole === "Judging"
        ? tr("jungReport.orientation.label.judging", "Judging")
        : tr("jungReport.orientation.label.adaptive", "Adaptive"),
    labelDetails: labelDefs[axis.innate.pole],
    archetype: innateA,
    surface: {
      pole: axis.surface.pole,
      letter: toOrientationLetter(axis.surface.pole),
      annotation: surfaceAnn,
      archetype: surfaceA,
      description: archetypeDescriptions[axis.surface.archetypeId],
    },
    innate: {
      pole: axis.innate.pole,
      letter: toOrientationLetter(axis.innate.pole),
      annotation: innateAnn,
      archetype: innateA,
      description: archetypeDescriptions[axis.innate.archetypeId],
    },
    summary,
    analysis: `${analysis} ${behaviorNote}`,
    matrix: [
      {
        c1: tr("jungReport.orientation.matrix.innateTitle", "Innate Persona"),
        c2: innateA,
        n: tr("jungReport.orientation.matrix.innateNote", "Your default organizational orientation."),
      },
      {
        c1: tr("jungReport.orientation.matrix.surfaceTitle", "Surface Persona"),
        c2: surfaceA,
        n: tr("jungReport.orientation.matrix.surfaceNote", "Your day-to-day execution orientation."),
      },
      {
        c1: tr("jungReport.orientation.matrix.syncTitle", "Sync"),
        c2: axis.aligned
          ? tr("jungReport.orientation.matrix.syncAligned", "Aligned")
          : tr("jungReport.orientation.matrix.syncFlexible", "Flexible"),
        n: axis.aligned
          ? tr("jungReport.orientation.matrix.syncNoteAligned", "Baseline and surface mode match.")
          : tr("jungReport.orientation.matrix.syncNoteFlexible", "You can switch modes across contexts."),
      },
    ],
    debug: { axis },
  };
}
