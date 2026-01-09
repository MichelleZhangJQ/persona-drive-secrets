// lib/core-utils/fit-core.ts
// Shared core utilities (non-UI) used by both:
// - Instrumentation report
// - Profession fit simulation
//
// Keeps interfaces compatible with the previous simulateFit exports by
// exporting the same core types + functions (except profession-fit orchestration,
// which now lives in /lib/professions/profession-fit.ts).

export const driveNames = [
  "Exploration",
  "Achievement",
  "Dominance",
  "Pleasure",
  "Care",
  "Affiliation",
  "Value",
] as const;

export const personaPairs = {
  innate: [
    "exploration-achievement",
    "exploration-dominance",
    "exploration-pleasure",
    "exploration-affiliation",
    "exploration-care",
    "exploration-value",
    "affiliation-pleasure",
    "dominance-care",
    "achievement-care",
    "affiliation-achievement",
    "dominance-affiliation",
    "care-pleasure",
    "achievement-value",
    "dominance-value",
    "value-pleasure",
    "achievement-pleasure",
    "care-affiliation",
  ],
  surface: [
    "exploration-achievement",
    "exploration-dominance",
    "exploration-pleasure",
    "exploration-care",
    "exploration-affiliation",
    "exploration-value",
    "care-achievement",
    "care-dominance",
    "care-pleasure",
    "affiliation-achievement",
    "affiliation-dominance",
    "affiliation-pleasure",
    "value-achievement",
    "value-dominance",
    "value-pleasure",
    "pleasure-achievement",
    "care-affiliation",
    "dominancePrivate-dominancePublic",
    "affiliationPrivate-affiliationPublic",
    "pleasurePrivate-pleasurePublic",
  ],
};

export const getInnateDriveDetails = (inquiryDrive: string, data: any) => {
  if (!data) return [];
  const driveKey = inquiryDrive.toLowerCase();
  return personaPairs.innate.reduce((acc: any[], pair, index) => {
    const [front, back] = pair.split("-");
    const qValue = Number(data[`q${index + 1}_answer`]) || 0;
    if (front === driveKey) acc.push([back, qValue]);
    else if (back === driveKey) acc.push([front, 6 - qValue]);
    return acc;
  }, []);
};

export const getSurfaceDriveDetails = (inquiryDrive: string, data: any) => {
  if (!data) return [];
  const driveKey = inquiryDrive.toLowerCase();
  return personaPairs.surface.reduce((acc: any[], pair, index) => {
    const [front, back] = pair.split("-");
    const qValue = Number(data[`q${index + 1}_answer`]) || 0;
    const cleanFront = front.replace(/private|public/i, "").toLowerCase();
    const cleanBack = back.replace(/private|public/i, "").toLowerCase();

    if (cleanFront === driveKey) acc.push([back, 6 - qValue]);
    else if (cleanBack === driveKey) acc.push([front, qValue]);
    return acc;
  }, []);
};

export const getControlMap = (type: "innate" | "surface", data: any) => {
  if (!data) return { nodes: [], edges: [] };

  const pairs = personaPairs[type];
  const edges: { source: string; target: string; weight: number }[] = [];

  pairs.forEach((pair, index) => {
    const [front, back] = pair.split("-");
    const score = Number(data[`q${index + 1}_answer`]);

    if (isNaN(score)) return;

    if (type === "innate") {
      if (score > 3) {
        edges.push({ source: front, target: back, weight: score - 3 });
      } else if (score < 3) {
        edges.push({ source: back, target: front, weight: 3 - score });
      }
    } else {
      if (score > 3) {
        edges.push({ source: back, target: front, weight: score - 3 });
      } else if (score < 3) {
        edges.push({ source: front, target: back, weight: 3 - score });
      }
    }
  });

  return {
    nodes: driveNames.map((name) => ({ id: name.toLowerCase(), label: name })),
    edges,
  };
};

export const calculateInnateScores = (data: any) => {
  if (!data) return null;
  const scores: any = {};
  driveNames.forEach((name) => {
    const details = getInnateDriveDetails(name, data);
    scores[name] = details.length > 0 ? details.reduce((s, d) => s + d[1], 0) / details.length : 0;
  });
  return scores;
};

export const calculateSurfaceScores = (data: any) => {
  if (!data) return null;
  const scores: any = {};
  driveNames.forEach((name) => {
    const details = getSurfaceDriveDetails(name, data);
    scores[name] = details.length > 0 ? details.reduce((s, d) => s + d[1], 0) / details.length : 0;
  });
  return scores;
};

export const calculateImposedScores = (data: any) => {
  if (!data) return null;
  const scores: any = {};
  driveNames.forEach((name, i) => {
    const q1 = Number(data[`q${i * 3 + 1}_answer`]) || 0;
    const q2 = Number(data[`q${i * 3 + 2}_answer`]) || 0;
    scores[name] = (q1 * q2) / 5;
  });
  return scores;
};

export const calculateImposedEnvStructure = (data: any) => {
  if (!data) return null;
  const scores: any = {};
  driveNames.forEach((name, i) => {
    const q1 = Number(data[`q${i * 3 + 1}_answer`]) || 0;
    scores[name] = q1;
  });
  return scores;
};

export const calculateEnvironmentAcceptance = (data: any) => {
  if (!data) return null;
  const scores: any = {};
  driveNames.forEach((name, i) => {
    const q2 = Number(data[`q${i * 3 + 2}_answer`]) || 0;
    scores[name] = q2;
  });
  return scores;
};

export const calculateImposedSatisfaction = (data: any) => {
  if (!data) return null;
  const scores: any = {};
  driveNames.forEach((name, i) => {
    const q3 = Number(data[`q${i * 3 + 3}_answer`]) || 0;
    scores[name] = 6 - q3;
  });
  return scores;
};

export type DriveName = (typeof driveNames)[number];
export type DriveVector = Record<DriveName, number>;

export type ProfessionSubtype = {
  major: string;
  name: string;
  drives: DriveVector; // 1..5 requirement/intensity by drive
};

export type UserPersonaInputs = {
  innateData: any; // row from "innate-persona"
  surfaceData: any; // row from "surface-persona"
  imposedData: any; // row from "imposed-persona" (q1 env, q2 competence, q3 self-interest)
};

export type InstrumentRouteBase = {
  sd: DriveName;
  td: DriveName;
  tdWeight: number; // td_weight within sd's candidate set
  encounterPortion: number; // demotion magnitude portion (0..1)
  drBase: number; // encounterPortion * tdWeight
  lr: number ;// leak factor
  pathDrain:number; // the aount of energy drained
  pathTransfer:number; // the amount of energy transfered
};



export type FitResult = {
  profession: { major: string; name: string };

  // per-drive quantities
  innateAvg: DriveVector;
  surfaceAvg: DriveVector;

  profDemand: DriveVector; // profession "environment structure" (sq1)
  competence: DriveVector; // user q2
  selfInterest: DriveVector; // user q3

  imposedSim: DriveVector; // imposed = sq1*q2/5

  // --- instrumentation / drain ---
  tdDissatisfaction: DriveVector; // q3*(1 - q1*q2/25)  (USER q1/q2/q3)
  totalDrainedEnergy: number; // Σ_paths drainedEnergy * innateWeight(sd)
  paths: InstrumentRouteBase[];
  usedRoutes: { sd: DriveName; td: DriveName }[];

  // --- canonical drain + adjusted surface ---
  surfaceDrain: DriveVector; // surfaceAvg(sd) * Σ(dr*lr), Σ capped to 1
  surfaceTransfer?: DriveVector; // surfaceTransfer(td) derived from routes
  surfaceAdjusted: DriveVector; // clamp(surfaceAvg - surfaceDrain, 0..5)

  // --- aspirational adjusted surface ---
  surfaceAdjustedAspired: DriveVector;

  // mismatchRaw(d) is computed from surfaceAdjusted(d) - profDemand(d)
  mismatchRaw: DriveVector;
  totalMismatchRaw: number;

  // FINAL mismatch uses surfaceAdjustedAspired(d) - profDemand(d)
  mismatchAdjusted: DriveVector;
  totalMismatchAdjusted: number;
};

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}
function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}
function clamp01(x: number) {
  return clamp(x, 0, 1);
}
function cleanKey(s: string) {
  return s.replace(/private|public/i, "").toLowerCase();
}

export function emptyDriveVector(fill = 0): DriveVector {
  return driveNames.reduce((acc, d) => {
    (acc as any)[d] = fill;
    return acc;
  }, {} as DriveVector);
}

/** Sum helpers */
function sumDrives(v: DriveVector) {
  return (driveNames).reduce((acc, d) => acc + n(v[d]), 0);
}

// -----------------------
// ✅ persona vector derivations
// -----------------------
export function computeInnateAvg(innateData: any): DriveVector {
  const v = (calculateInnateScores(innateData) || {}) as DriveVector;
  const out = emptyDriveVector(0);
  (driveNames).forEach((d) => ((out as any)[d] = clamp(n((v as any)[d]), 0, 5)));
  return out;
}

export function computeSurfaceAvg(surfaceData: any): DriveVector {
  const v = (calculateSurfaceScores(surfaceData) || {}) as DriveVector;
  const out = emptyDriveVector(0);
  (driveNames).forEach((d) => ((out as any)[d] = clamp(n((v as any)[d]), 0, 5)));
  return out;
}

/**
 * Find the raw question index for (a,b) in personaPairs[type], regardless of orientation.
 * Returns orientation info so we can compute directional score (sd over td).
 */
function findPair(type: "innate" | "surface", a: DriveName, b: DriveName) {
  const A = a.toLowerCase();
  const B = b.toLowerCase();
  const pairs = personaPairs[type];

  for (let i = 0; i < pairs.length; i++) {
    const [front, back] = pairs[i].split("-");
    const f = cleanKey(front);
    const k = cleanKey(back);

    if (f === A && k === B) return { index: i, orientation: "A-B" as const, front, back };
    if (f === B && k === A) return { index: i, orientation: "B-A" as const, front, back };
  }
  return null;
}

/**
 * Directional score: sdOverTd in 1..5 space.
 * Convention: >3 means sd prioritized over td; <=3 means td prioritized or equal.
 *
 * IMPORTANT:
 * - Innate: if stored as sd-td => sdOverTd = raw; else sdOverTd = 6-raw
 * - Surface: your system flips FRONT in getSurfaceDriveDetails, so:
 *   if stored as sd-td => sdOverTd = 6-raw; else sdOverTd = raw
 */
export function getDirectionalSdOverTdScore(
  type: "innate" | "surface",
  data: any,
  sd: DriveName,
  td: DriveName
): number | null {
  const pair = findPair(type, sd, td);
  if (!pair) return null;

  const raw = n(data?.[`q${pair.index + 1}_answer`]);
  if (!raw) return null;

  const sdIsFront = pair.orientation === "A-B"; // stored as sd-td

  if (type === "innate") {
    return sdIsFront ? raw : 6 - raw;
  }
  // surface (front-flipped)
  return sdIsFront ? 6 - raw : raw;
}

/**
 * ✅ Instrumentation detection (DEMOTION logic):
 * A route sd_innate -> td_surface exists when:
 *   Innate says:  sd_innate > td_surface   (sdOverTd_innate > 3)
 *   Surface says: sd_innate <= td_surface  (sdOverTd_surface <= 3)
 *
 * tdWeight:
 * - primary: proportional to surfaceAvg(td) among candidates
 * - fallback: equal weights if candidate surface sum is 0
 */
export function buildUserInstrumentationRoutes(params: {
  innateData: any;
  surfaceData: any;
  imposedData: any;
}): InstrumentRouteBase[] {
  const { innateData, surfaceData, imposedData } = params;

  const surfaceAvg = computeSurfaceAvg(surfaceData);

  // ✅ important for your new normalization target (surfaceAvg - innateAvg)
  const innateAvg = computeInnateAvg(innateData);

  const { env, competence, selfInterest } = extractUserEnvCompetenceSelfInterest(imposedData);
  const paramsImposed = { env, competence, selfInterest };
  const dissatisfaction = calculateUserDriveDissatisfaction(paramsImposed);

  const routes: InstrumentRouteBase[] = [];
  const sumInnateTotal = (driveNames).reduce((acc, d) => acc + n(innateAvg[d]), 0);

  for (const sd of driveNames) {
    const candidates: DriveName[] = [];

    for (const td of driveNames) {
      if (td === sd) continue;

      const innateSdOverTd = getDirectionalSdOverTdScore("innate", innateData, sd, td);
      const surfSdOverTd = getDirectionalSdOverTdScore("surface", surfaceData, sd, td);
      if (innateSdOverTd == null || surfSdOverTd == null) continue;

      const innateSaysSdStronger = innateSdOverTd > 3;
      const surfaceSaysSdNotStronger = surfSdOverTd <= 3;

      //if(surfSdOverTd < innateSdOverTd){
      if (innateSaysSdStronger && surfaceSaysSdNotStronger) {
        candidates.push(td);
      }
    }

    if (candidates.length === 0) continue;

    const sumInnate = candidates.reduce((acc, td) => acc + n(innateAvg[td]), 0);

    for (const td of candidates) {
      const tdWeight = sumInnate > 0 ? clamp01(n(innateAvg[td]) / sumInnate) : 1 / candidates.length;

      const innateSdOverTd = getDirectionalSdOverTdScore("innate", innateData, sd, td) ?? 3;
      const encounterPortion = clamp01(innateSdOverTd / 5);

      const drBase = clamp01(encounterPortion * tdWeight);

      const lr = dissatisfaction[td]/5;

      // keep your existing weighting scheme (we’ll normalize after)
      const innateW = sumInnateTotal > 0 ? clamp01(n(innateAvg[td]) / sumInnateTotal) : 1 / candidates.length;

      const pathDrain = clamp01(drBase * lr) * clamp(innateAvg[sd], 0, 5) * innateW;
      const pathTransfer = clamp01(drBase * (1 - lr)) * clamp(innateAvg[sd], 0, 5) * innateW;

      routes.push({ sd, td, tdWeight, encounterPortion, drBase, lr, pathDrain, pathTransfer });
    }
  }

  // ------------------------------------------------------------
  // ✅ NEW: normalize per targetDrive (td)
  // Make Σ_td (pathDrain+pathTransfer) == clamp(surfaceAvg(td)-innateAvg(td), 0..5)
  // ------------------------------------------------------------
  const totalByTd: Record<string, number> = {};
  (driveNames).forEach((d) => (totalByTd[d] = 0));


  routes.forEach((p) => {
    totalByTd[p.td] = n(totalByTd[p.td]) + n(p.pathDrain) + n(p.pathTransfer);
  });


  const weightByTd: Record<string, number> = {};
  (driveNames).forEach((td) => {
    const desired = clamp(n(surfaceAvg[td]) - n(innateAvg[td]), 0, 5);
    const denom = n(totalByTd[td]);
    weightByTd[td] = denom > 0 ? desired / denom : 0;
  });


  routes.forEach((p) => {
    const w = n(weightByTd[p.td]);
    p.pathDrain = n(p.pathDrain) * w;
    p.pathTransfer = n(p.pathTransfer) * w;
  });

  return routes;
}

/**
 * Extract user environment structure (q1), competence (q2),
 * and self-interest (q3) from imposed-persona data.
 * Assumes order matches driveNames (each drive has 3 questions: q1,q2,q3).
 */
export function extractUserEnvCompetenceSelfInterest(imposedData: any): {
  env: DriveVector; // q1
  competence: DriveVector; // q2
  selfInterest: DriveVector; // q3
} {
  const env = emptyDriveVector(0);
  const competence = emptyDriveVector(0);
  const selfInterest = emptyDriveVector(0);

  (driveNames).forEach((d, i) => {
    const q1 = n(imposedData?.[`q${i * 3 + 1}_answer`]);
    const q2 = n(imposedData?.[`q${i * 3 + 2}_answer`]);
    const q3 = n(imposedData?.[`q${i * 3 + 3}_answer`]);

    (env as any)[d] = clamp(q1, 0, 5);
    (competence as any)[d] = clamp(q2, 0, 5);
    (selfInterest as any)[d] = clamp(q3, 0, 5);
  });

  return { env, competence, selfInterest };
}

/**
 * ✅ User dissatisfaction from imposed-persona ONLY:
 * diss(d) = q3(d) * (1 - q1(d)*q2(d)/25)
 */
export function calculateUserDriveDissatisfaction(params: {
  env: DriveVector;
  competence: DriveVector;
  selfInterest: DriveVector;
}): DriveVector {
  const { env, competence, selfInterest } = params;
  const out = emptyDriveVector(0);

  (driveNames).forEach((d) => {
    const q1 = clamp(n(env[d]), 0, 5);
    const q2 = clamp(n(competence[d]), 0, 5);
    const q3 = clamp(n(selfInterest[d]), 0, 5);

    const diss = (q3-1)*1.25 * (1 - (q1 * q2) / 25);
    (out as any)[d] = clamp(diss, 0, 5);
  });

  return out;
}

/**
 * ✅ NEW: User satisfaction counterpart (used by instrumentation report):
 * sat(d) = q3(d) * (q1(d)*q2(d)/25)
 *
 * This pairs cleanly with dissatisfaction:
 * sat(d) + diss(d) = q3(d)
 */
export function calculateUserDriveSatisfaction(params: {
  env: DriveVector;
  competence: DriveVector;
  selfInterest: DriveVector;
}): DriveVector {
  const { env, competence, selfInterest } = params;
  const out = emptyDriveVector(0);

  (driveNames).forEach((d) => {
    const q1 = clamp(n(env[d]), 0, 5);
    const q2 = clamp(n(competence[d]), 0, 5);
    const q3 = clamp(n(selfInterest[d]), 0, 5);

    const sat = q3 * ((q1 * q2) / 25);
    (out as any)[d] = clamp(sat, 0, 5);
  });

  return out;
}


/**
 * Simulated imposed persona under profession demand:
 * imposed(d) = sq1(d) * competence(d) / 5
 */
export function simulateImposedFromProfession(params: { profDemand: DriveVector; competence: DriveVector }): DriveVector {
  const { profDemand, competence } = params;
  const out = emptyDriveVector(0);

  (driveNames).forEach((d) => {
    const q1 = clamp(n(profDemand[d]), 0, 5);
    const q2 = clamp(n(competence[d]), 0, 5);
    (out as any)[d] = clamp((q1 * q2) / 5, 0, 5);
  });

  return out;
}

/**
 * ✅ surfaceDrain(td_surface) = Σ_clamp((innateAvg(sd_innate)-surfaceAvg(sd_innate), 0,5) * {paths sd_inate-td_surface} (dr * lr), Σ capped to 1
 */
export function computeSurfaceDrain(params: {
  innateAvg: DriveVector;
  paths: InstrumentRouteBase[];
}): DriveVector {
  const { innateAvg, paths } = params;

  const out = emptyDriveVector(0);
  const surfDrained: Record<string, number> = {};
  (driveNames).forEach((d) => (surfDrained[d] = 0));

  (paths || []).forEach((p) => {
    surfDrained[p.td] = n(surfDrained[p.td]) + n(p.pathDrain); 

  });

  (driveNames).forEach((d) => {
    (out as any)[d] = clamp(surfDrained[d], 0, 5);
  });

  return out;
}

export function computeSurfaceTransfer(params: {
  innateAvg: DriveVector;
  paths: InstrumentRouteBase[];
}): DriveVector {
  const { innateAvg, paths } = params;

  const out = emptyDriveVector(0);
  const surfTransfer: Record<string, number> = {};
  (driveNames).forEach((d) => (surfTransfer[d] = 0));


  (paths || []).forEach((p) => {
    surfTransfer[p.td] = n(surfTransfer[p.td]) + n(p.pathTransfer);//* w;
  });

  (driveNames).forEach((d) => {
    (out as any)[d] = clamp(surfTransfer[d], 0, 5);
  });

  return out;
}


export function computeSurfaceValueTransfer(params: { 
    valueDriveName?: DriveName; 
    paths: InstrumentRouteBase[] }): DriveVector {
  const paths=params.paths;
  const valueName = (params.valueDriveName ?? VALUE_DRIVE) as DriveName;

  const out = emptyDriveVector(0);
  const valuePaths = (paths || []).filter((p) => p.sd === valueName);
  const surfValueTransfer: Record<string, number> = {};
  (driveNames).forEach((d) => (surfValueTransfer[d] = 0));

  (valuePaths || []).forEach((p) => {
    surfValueTransfer[p.td] = n(surfValueTransfer[p.td]) + p.pathTransfer +p.pathDrain;
  });

  (driveNames).forEach((d) => {
    (out as any)[d] = clamp(surfValueTransfer[d], 0, 5);
  });

  return out;
}

/**
 * ✅ surfaceAdjusted(d) = clamp(surfaceAvg(d) - surfaceDrain(d), 0, 5)
 */
export function computeSurfaceAdjusted(params: { surfaceAvg: DriveVector; surfaceDrain: DriveVector }): DriveVector {
  const { surfaceAvg, surfaceDrain } = params;
  const out = emptyDriveVector(0);

  (driveNames).forEach((d) => {
    const surf = clamp(n(surfaceAvg[d]), 0, 5);
    const drain = clamp(n(surfaceDrain[d]), 0, 5);
    (out as any)[d] = clamp(surf - drain, 0, 5);
  });

  return out;
}


export type MismatchWeightMode = "profDemand" | "mixedMax";

/**
 * ✅ mismatchFromSurface(d) = effectiveSurface(d) - profDemand(d)
 *
 * total mismatch weighting modes:
 * - "profDemand": weights ∝ profDemand(d)
 * - "mixedMax":  weights ∝ max(effectiveSurface(d), profDemand(d))
 */
export function computeMismatchFromEffectiveSurface(params: {
  effectiveSurface: DriveVector;
  profDemand: DriveVector;
  weightMode?: MismatchWeightMode;
}): { mismatch: DriveVector; totalDeficit: number } {
  const { effectiveSurface, profDemand, weightMode = "profDemand" } = params;

  const mismatch = emptyDriveVector(0);
  const equalW = 1 / (driveNames).length;

  const rawWeights = emptyDriveVector(0);

  (driveNames).forEach((d) => {
    const eff = clamp(n(effectiveSurface[d]), 0, 5);
    const demand = clamp(n(profDemand[d]), 0, 5);

    (rawWeights as any)[d] = weightMode === "mixedMax" ? Math.max(eff, demand) : demand;
    (mismatch as any)[d] = eff - demand;
  });

  const denom = sumDrives(rawWeights) || 0;

  let totalDeficit = 0;
  (driveNames).forEach((d) => {
    const w = denom > 0 ? n(rawWeights[d]) / denom : equalW;
    totalDeficit += Math.abs(n(mismatch[d])) * w;
  });

  return { mismatch, totalDeficit };
}

/**
 * ✅ Legacy helper kept:
 * mismatch computed from surfaceAdjusted(surfaceAvg - drain), weighted by job demand.
 */
export function computeMismatch(
  surfaceAvg: DriveVector,
  surfaceDrain: DriveVector,
  profDemand: DriveVector
): { mismatch: DriveVector; totalDeficit: number } {
  const effectiveSurface = computeSurfaceAdjusted({ surfaceAvg, surfaceDrain });
  return computeMismatchFromEffectiveSurface({ effectiveSurface, profDemand, weightMode: "profDemand" });
}

// -----------------------------------------------------------------------------
// ✅ Aspirational surface adjustment via instrumentation paths from Value
// -----------------------------------------------------------------------------

const VALUE_DRIVE: DriveName = "Value" as DriveName;

/**
 * ✅ Aspirational adjustment from Value DEMOTION (one-way only):
 *
 * Key energy rule:
 * - effEnergy(td) += innateAvg(Value) * dr * (1-lr)
 */
export function computeSurfaceAdjustedAspired(params: {
  surfaceAdjusted: DriveVector; // already clamped 0..5
  paths: InstrumentRouteBase[];
  valueDriveName?: DriveName; // default "Value"
  debug?: boolean;
}): DriveVector {
  const { surfaceAdjusted, paths, debug = false } = params;
  const valueName = (params.valueDriveName ?? VALUE_DRIVE) as DriveName;


  //const totalAspiration = (driveNames).reduce((acc, d) => acc + n(effEnergyByTd[d]), 0);
  const parmtoPass ={valueName, paths}
  const totalAspiration =computeSurfaceValueTransfer(parmtoPass);
   
  if (debug) {
    console.log( "totalAspiration:", totalAspiration);
  }

  if (!totalAspiration) {
    const out = emptyDriveVector(0);
    (driveNames).forEach((d) => ((out as any)[d] = clamp(n(surfaceAdjusted[d]), 0, 5)));
    return out;
  }

  const out = emptyDriveVector(0);
  (driveNames).forEach((d) => {
    const base = clamp(n(surfaceAdjusted[d]), 0, 5);
    (out as any)[d] = clamp(base+totalAspiration[d],0,5);

    if (debug) {
      console.log("[aspire] APPLY to td:", d,  base, totalAspiration[d]);
    }
  });

  return out;
}

// Convenience: compute tdDissatisfaction directly from imposedData
export function computeUserTdDissatisfactionFromImposed(imposedData: any): DriveVector {
  const { env, competence, selfInterest } = extractUserEnvCompetenceSelfInterest(imposedData);
  return calculateUserDriveDissatisfaction({ env, competence, selfInterest });
}

// Convenience: compute tdSatisfaction directly from imposedData
export function computeUserTdSatisfactionFromImposed(imposedData: any): DriveVector {
  const { env, competence, selfInterest } = extractUserEnvCompetenceSelfInterest(imposedData);
  return calculateUserDriveSatisfaction({ env, competence, selfInterest });
}
