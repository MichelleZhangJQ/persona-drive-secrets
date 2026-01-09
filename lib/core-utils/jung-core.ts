// lib/core-utils/jung-core.ts
// Core Jung-axis determination logic extracted from the 4 legacy panels.
// ✅ Uses fit-core for DriveName/DriveVector + computeInnateAvg/computeSurfaceAvg.

import type { DriveName, DriveVector } from "@/lib/core-utils/fit-core";
import { computeInnateAvg, computeSurfaceAvg } from "@/lib/core-utils/fit-core";

export type JungAxisKey = "energy" | "perception" | "judgment" | "orientation";

export type EnergyPole = "Introvert" | "Extrovert" | "Ambivalent";
export type PerceptionPole = "Sensing" | "Intuitive" | "Ambivalent";
export type JudgmentPole = "Thinking" | "Feeling" | "Ambivalent";
export type OrientationPole = "Judging" | "Perspective" | "Ambivalent";

export type EnergyArchetypeId =
  | "Exploration Introvert"
  | "Care Introvert"
  | "Dominant Extrovert"
  | "Pleasure Extrovert"
  | "Social Extrovert"
  | "Adaptive Navigator";

export type PerceptionArchetypeId =
  | "Pragmatic Realist"
  | "Detail Specialist"
  | "Conceptual Visionary"
  | "Insight Explorer"
  | "Perceptive Generalist";

export type JudgmentArchetypeId =
  | "Analytical Architect"
  | "Principled Strategist"
  | "Empathetic Guardian"
  | "Moral Convictionist"
  | "Adaptive Mediator";

export type OrientationArchetypeId =
  | "Goal Judging"
  | "Process Judging"
  | "Curious Perspective"
  | "Fun Perspective"
  | "Ambivalent";

export type RawAnswerSet = Record<string, any>;

export type SideResult<Pole extends string, ArchetypeId extends string> = {
  pole: Pole;
  archetypeId: ArchetypeId;
  evidence?: {
    markers: number[];
    avg?: number;
    flags?: Record<string, boolean>;
  };
};

export type AxisResult<Axis extends JungAxisKey, Pole extends string, ArchetypeId extends string> = {
  axis: Axis;
  innate: SideResult<Pole, ArchetypeId>;
  surface: SideResult<Pole, ArchetypeId>;
  aligned: boolean;
};

const THRESH_AVG = 3.2;
const THRESH_STRONG = 3.8;

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}
function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}
function clamp01to5(x: any) {
  return clamp(n(x), 0, 5);
}
function avg(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function checkAvgAbove(xs: number[], threshold: number) {
  return avg(xs) > threshold;
}
function q(raw: RawAnswerSet, idx: number) {
  return clamp01to5(raw?.[`q${idx}_answer`]);
}

/**
 * 1) Energy Direction (Introversion / Extroversion / Ambivalent)
 * Derived from EnergyDirectionPanel.
 *
 * ✅ Uses computeInnateAvg/computeSurfaceAvg to access drive vectors consistently.
 * NOTE: archetype subtype selection is based on INNATE drive vector.
 */
export function determineEnergyDirection(input: {
  innateData: any; // row from innate-persona (also has qX_answer)
  surfaceData: any; // row from surface-persona (also has qX_answer)
}): AxisResult<"energy", EnergyPole, EnergyArchetypeId> {
  const { innateData, surfaceData } = input;

  const innDrives: DriveVector = computeInnateAvg(innateData);
  // surface vector is not required for the legacy axis decision, but we compute it for consistency/debugging
  computeSurfaceAvg(surfaceData);

  // ----- INNATE (legacy matchups) -----
  const innExpM = [q(innateData, 2), q(innateData, 3), q(innateData, 4)];
  const innCarM = [q(innateData, 12), 6 - q(innateData, 8)];
  const innDomM = [q(innateData, 8), 6 - q(innateData, 2)];
  const innPleM = [6 - q(innateData, 3), 6 - q(innateData, 12)];
  const innAffM = [6 - q(innateData, 4)];

  const isInnIntro = checkAvgAbove(innExpM, THRESH_AVG) || checkAvgAbove(innCarM, THRESH_AVG);
  const isInnExtro =
    checkAvgAbove(innDomM, THRESH_AVG) || checkAvgAbove(innPleM, THRESH_AVG) || checkAvgAbove(innAffM, THRESH_AVG);

  let innatePole: EnergyPole = "Ambivalent";
  let innateId: EnergyArchetypeId = "Adaptive Navigator";

  if (isInnIntro && !isInnExtro) {
    innatePole = "Introvert";
    const exp = clamp01to5(innDrives.Exploration);
    const car = clamp01to5(innDrives.Care);
    innateId = exp >= car ? "Exploration Introvert" : "Care Introvert";
  } else if (isInnExtro && !isInnIntro) {
    innatePole = "Extrovert";
    const dom = clamp01to5(innDrives.Dominance);
    const ple = clamp01to5(innDrives.Pleasure);
    innateId = dom >= ple ? "Dominant Extrovert" : "Pleasure Extrovert";
  }

  // ----- SURFACE (legacy matchups) -----
  const surfDomM = [q(surfaceData, 2), q(surfaceData, 8), q(surfaceData, 18)];
  const surfPleM = [q(surfaceData, 3), q(surfaceData, 9), q(surfaceData, 20)];
  const surfAffM = [q(surfaceData, 5), q(surfaceData, 17), q(surfaceData, 19)];

  const lowDom = [6 - q(surfaceData, 2), 6 - q(surfaceData, 8), 6 - q(surfaceData, 18)];
  const lowPle = [6 - q(surfaceData, 3), 6 - q(surfaceData, 9), 6 - q(surfaceData, 20)];
  const lowAff = [6 - q(surfaceData, 5), 6 - q(surfaceData, 17), 6 - q(surfaceData, 19)];

  const isSurfExtro =
    checkAvgAbove(surfDomM, THRESH_AVG) || checkAvgAbove(surfPleM, THRESH_AVG) || checkAvgAbove(surfAffM, THRESH_AVG);

  // legacy: intro can be true even if extro is true, based on "low" markers
  const isSurfIntro =
    !isSurfExtro || checkAvgAbove(lowDom, THRESH_AVG) || checkAvgAbove(lowPle, THRESH_AVG) || checkAvgAbove(lowAff, THRESH_AVG);

  let surfacePole: EnergyPole = "Ambivalent";
  let surfaceId: EnergyArchetypeId = "Adaptive Navigator";

  if (isSurfIntro && !isSurfExtro) {
    surfacePole = "Introvert";
    const expScore = ((6 - q(surfaceData, 2)) + (6 - q(surfaceData, 3)) + (6 - q(surfaceData, 5))) / 3;
    const carScore = ((6 - q(surfaceData, 8)) + (6 - q(surfaceData, 9)) + (6 - q(surfaceData, 17))) / 3;
    surfaceId = expScore >= carScore ? "Exploration Introvert" : "Care Introvert";
  } else if (isSurfExtro && !isSurfIntro) {
    surfacePole = "Extrovert";
    const domA = avg(surfDomM);
    const pleA = avg(surfPleM);
    const affA = avg(surfAffM);
    const max = Math.max(domA, pleA, affA);

    if (max === domA) surfaceId = "Dominant Extrovert";
    else if (max === pleA) surfaceId = "Pleasure Extrovert";
    else surfaceId = "Social Extrovert";
  }

  return {
    axis: "energy",
    innate: {
      pole: innatePole,
      archetypeId: innateId,
      evidence: { markers: [...innExpM, ...innCarM, ...innDomM, ...innPleM, ...innAffM], flags: { isInnIntro, isInnExtro } },
    },
    surface: {
      pole: surfacePole,
      archetypeId: surfaceId,
      evidence: { markers: [...surfDomM, ...surfPleM, ...surfAffM], flags: { isSurfIntro, isSurfExtro } },
    },
    aligned: innatePole === surfacePole,
  };
}

/**
 * 2) Sensing / Intuition
 * Derived from InformationProcessingPanel.
 */
export function determinePerception(input: {
  innateData: any;
  surfaceData: any;
}): AxisResult<"perception", PerceptionPole, PerceptionArchetypeId> {
  const { innateData, surfaceData } = input;

  const determine = (sens: number[], intu: number[]) => {
    const isS = checkAvgAbove(sens, THRESH_AVG);
    const isN = checkAvgAbove(intu, THRESH_AVG);

    if (isS && !isN) {
      const sAvg = avg(sens);
      return {
        pole: "Sensing" as const,
        archetypeId: (sAvg > THRESH_STRONG ? "Detail Specialist" : "Pragmatic Realist") as PerceptionArchetypeId,
        evidence: { markers: sens, avg: sAvg, flags: { isS, isN } },
      };
    }
    if (isN) {
      const nAvg = avg(intu);
      return {
        pole: "Intuitive" as const,
        archetypeId: (nAvg > THRESH_STRONG ? "Conceptual Visionary" : "Insight Explorer") as PerceptionArchetypeId,
        evidence: { markers: intu, avg: nAvg, flags: { isS, isN } },
      };
    }
    return {
      pole: "Ambivalent" as const,
      archetypeId: "Perceptive Generalist" as PerceptionArchetypeId,
      evidence: { markers: [...sens, ...intu], flags: { isS, isN } },
    };
  };

  // legacy: only q1, with opposite flips between innate/surface
  const innate = determine([6 - q(innateData, 1)], [q(innateData, 1)]);
  const surface = determine([q(surfaceData, 1)], [6 - q(surfaceData, 1)]);

  return { axis: "perception", innate, surface, aligned: innate.pole === surface.pole };
}

/**
 * 3) Thinking / Feeling
 * Derived from InterpersonalJudgmentPanel.
 */
export function determineJudgment(input: {
  innateData: any;
  surfaceData: any;
}): AxisResult<"judgment", JudgmentPole, JudgmentArchetypeId> {
  const { innateData, surfaceData } = input;

  const determine = (think: number[], feel: number[]) => {
    const isT = checkAvgAbove(think, THRESH_AVG);
    const isF = checkAvgAbove(feel, THRESH_AVG);

    if (isT && !isF) {
      const tAvg = avg(think);
      return {
        pole: "Thinking" as const,
        archetypeId: (tAvg > THRESH_STRONG ? "Analytical Architect" : "Principled Strategist") as JudgmentArchetypeId,
        evidence: { markers: think, avg: tAvg, flags: { isT, isF } },
      };
    }
    if (isF) {
      const fAvg = avg(feel);
      return {
        pole: "Feeling" as const,
        archetypeId: (fAvg > THRESH_STRONG ? "Moral Convictionist" : "Empathetic Guardian") as JudgmentArchetypeId,
        evidence: { markers: feel, avg: fAvg, flags: { isT, isF } },
      };
    }
    return {
      pole: "Ambivalent" as const,
      archetypeId: "Adaptive Mediator" as JudgmentArchetypeId,
      evidence: { markers: [...think, ...feel], flags: { isT, isF } },
    };
  };

  const surfaceThinkM = [6 - q(surfaceData, 4), 6 - q(surfaceData, 5), 6 - q(surfaceData, 6)];
  const surfaceFeelM = [q(surfaceData, 4), q(surfaceData, 5), q(surfaceData, 6)];

  const innateThinkM = [q(innateData, 4), q(innateData, 5), q(innateData, 6)];
  const innateFeelM = [6 - q(innateData, 4), 6 - q(innateData, 5), 6 - q(innateData, 6)];

  const surface = determine(surfaceThinkM, surfaceFeelM);
  const innate = determine(innateThinkM, innateFeelM);

  return { axis: "judgment", innate, surface, aligned: innate.pole === surface.pole };
}

/**
 * 4) Judging / Perspective
 * Derived from LifeOrientationPanel.
 *
 * Legacy "check" here is strict: EVERY marker must be > 3.
 */
export function determineOrientation(input: {
  innateData: any;
  surfaceData: any;
}): AxisResult<"orientation", OrientationPole, OrientationArchetypeId> {
  const { innateData, surfaceData } = input;

  const checkAllAbove3 = (xs: number[]) => xs.length > 0 && xs.every((v) => v > 3);

  const determine = (ach: number[], val: number[], exp: number[], ple: number[]) => {
    const isJ = checkAllAbove3(ach) || checkAllAbove3(val);
    const isP = checkAllAbove3(exp) || checkAllAbove3(ple);

    if (isJ) {
      const aAvg = avg(ach);
      const vAvg = avg(val);
      return {
        pole: "Judging" as const,
        archetypeId: (aAvg >= vAvg ? "Goal Judging" : "Process Judging") as OrientationArchetypeId,
        evidence: { markers: [...ach, ...val], flags: { isJ, isP } },
      };
    }
    if (isP) {
      const eAvg = avg(exp);
      const lAvg = avg(ple);
      return {
        pole: "Perspective" as const,
        archetypeId: (eAvg >= lAvg ? "Curious Perspective" : "Fun Perspective") as OrientationArchetypeId,
        evidence: { markers: [...exp, ...ple], flags: { isJ, isP } },
      };
    }
    return {
      pole: "Ambivalent" as const,
      archetypeId: "Ambivalent" as OrientationArchetypeId,
      evidence: { markers: [...ach, ...val, ...exp, ...ple], flags: { isJ, isP } },
    };
  };

  const achS = [q(surfaceData, 1), q(surfaceData, 13), q(surfaceData, 16)];
  const valS = [q(surfaceData, 6), 6 - q(surfaceData, 13), 6 - q(surfaceData, 15)];
  const expS = [6 - q(surfaceData, 1), 6 - q(surfaceData, 3), 6 - q(surfaceData, 6)];
  const pleS = [q(surfaceData, 3), q(surfaceData, 15), 6 - q(surfaceData, 16)];

  const achI = [6 - q(innateData, 1), q(innateData, 13), q(innateData, 16)];
  const valI = [6 - q(innateData, 6), 6 - q(innateData, 13), q(innateData, 15)];
  const expI = [q(innateData, 1), q(innateData, 3), q(innateData, 6)];
  const pleI = [6 - q(innateData, 3), 6 - q(innateData, 15), 6 - q(innateData, 16)];

  const surface = determine(achS, valS, expS, pleS);
  const innate = determine(achI, valI, expI, pleI);

  return { axis: "orientation", innate, surface, aligned: innate.pole === surface.pole };
}

/**
 * Convenience: compute all 4 axes at once.
 * (UI/report layer can map archetypeId -> labels/definitions/narratives.)
 */
export function determineJungProfile(input: { innateData: any; surfaceData: any }) {
  return {
    energy: determineEnergyDirection(input),
    perception: determinePerception(input),
    judgment: determineJudgment(input),
    orientation: determineOrientation(input),
  };
}

/** Optional helper if you want typed access to your 7-drive vectors inside the Jung report layer. */
export function getPersonaDriveVectors(input: { innateData: any; surfaceData: any }): {
  innateAvg: DriveVector;
  surfaceAvg: DriveVector;
} {
  return {
    innateAvg: computeInnateAvg(input.innateData),
    surfaceAvg: computeSurfaceAvg(input.surfaceData),
  };
}