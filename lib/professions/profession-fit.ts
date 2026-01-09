// lib/reports/profession-fit.ts
// Profession-fit orchestration + UI scoring helpers.
// Uses core-utils for all shared math.

import { driveNames } from "@/lib/core-utils/fit-core";
import {
  type DriveName,
  type DriveVector,
  type ProfessionSubtype,
  type UserPersonaInputs,
  type InstrumentRouteBase,
  type FitResult,
  computeInnateAvg,
  computeSurfaceAvg,
  buildUserInstrumentationRoutes,
  extractUserEnvCompetenceSelfInterest,
  calculateUserDriveDissatisfaction,
  simulateImposedFromProfession,
  computeSurfaceDrain,
  computeSurfaceTransfer,
  computeSurfaceAdjusted,
  computeSurfaceAdjustedAspired,
  computeMismatchFromEffectiveSurface,
} from "@/lib/core-utils/fit-core";

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
function emptyDriveVector(fill = 0): DriveVector {
  return driveNames.reduce((acc, d) => {
    (acc as any)[d] = fill;
    return acc;
  }, {} as DriveVector);
}

const VALUE_DRIVE: DriveName = "Value" as DriveName;

/**
 * Evaluate a single profession subtype for a user, using user instrumentation routes.
 *
 * NOTE (updated):
 * - We do NOT simulate per-profession drained energy using imposedSim anymore.
 * - We trust fit-core route outputs (lr/pathDrain/pathTransfer) computed from the user's imposed persona.
 */
export function simulateProfessionFit(params: {
  user: UserPersonaInputs;
  subtype: ProfessionSubtype;
  userRoutes?: InstrumentRouteBase[]; // optional precomputed for performance
}): FitResult {
  const { user, subtype } = params;

  const innateAvg = computeInnateAvg(user.innateData);
  const surfaceAvg = computeSurfaceAvg(user.surfaceData);

  const { env, competence, selfInterest } = extractUserEnvCompetenceSelfInterest(user.imposedData);

  const profDemand: DriveVector = { ...subtype.drives } as DriveVector;

  // 1) user-level routes (demotion-based) — routes already include lr/pathDrain/pathTransfer
  const routes: InstrumentRouteBase[] =
    params.userRoutes ??
    buildUserInstrumentationRoutes({
      innateData: user.innateData,
      surfaceData: user.surfaceData,
      imposedData: user.imposedData,
    });

  // 2) user td dissatisfaction (kept for display/debug; lr already exists in routes)
  const tdDissatisfaction = calculateUserDriveDissatisfaction({
    env,
    competence,
    selfInterest,
  });

  // 3) imposedSim can still be computed for compatibility with FitResult,
  // but it is NOT used to simulate drained energy anymore.
  const imposedSim = simulateImposedFromProfession({ profDemand, competence });

  // 4) paths used in the result = the user routes directly (fit-core already computed pathDrain/pathTransfer)
  const paths: InstrumentRouteBase[] = routes;

  // ✅ total drained energy: sum route.pathDrain weighted by innateAvg(sd) (same idea as before, but no imposedSim usage)
  const totalDrainedEnergy = paths.reduce((acc, p) => {
    const wInnate = clamp01(n(innateAvg[p.sd]) / 5); // 0..1
    return acc + clamp(n(p.pathDrain), 0, 5) * wInnate;
  }, 0);

  // 5) compute drain/transfer + adjusted surface (UPDATED fit-core signatures)
  const surfaceDrain = computeSurfaceDrain({ innateAvg, paths });
  const surfaceTransfer = computeSurfaceTransfer({ innateAvg, paths }); // kept in result for UI parity if needed
  const surfaceAdjusted = computeSurfaceAdjusted({ surfaceAvg, surfaceDrain });

  // 6) mismatch RAW from surfaceAdjusted (pre-aspiration) — legacy weighting (job-demand only)
  const { mismatch: mismatchRaw, totalDeficit: totalMismatchRaw } = computeMismatchFromEffectiveSurface({
    effectiveSurface: surfaceAdjusted,
    profDemand,
    weightMode: "profDemand",
  });

  // 7) aspirational adjustment (Value demotion), then FINAL mismatch
  const surfaceAdjustedAspired = computeSurfaceAdjustedAspired({
    surfaceAdjusted,
    paths,
    valueDriveName: VALUE_DRIVE,
  });

  // ✅ FINAL mismatch uses mixed weights based on max(surfaceAdjustedAspired, profDemand)
  const { mismatch: mismatchAdjusted, totalDeficit: totalMismatchAdjusted } = computeMismatchFromEffectiveSurface({
    effectiveSurface: surfaceAdjustedAspired,
    profDemand,
    weightMode: "mixedMax",
  });

  return {
    profession: { major: subtype.major, name: subtype.name },

    innateAvg,
    surfaceAvg,

    profDemand,
    competence,
    selfInterest,

    imposedSim, // still returned for compatibility; just don't render the column

    tdDissatisfaction,
    totalDrainedEnergy,

    paths,
    usedRoutes: paths.map((p) => ({ sd: p.sd, td: p.td })),

    surfaceDrain,
    surfaceAdjusted,

    // included in FitResult type
    surfaceTransfer,
    surfaceAdjustedAspired,

    mismatchRaw,
    totalMismatchRaw,

    mismatchAdjusted,
    totalMismatchAdjusted,
  };
}

/**
 * Evaluate many subtypes and rank by FINAL mismatch (ascending).
 * Tie-breakers: lower drained energy, then name.
 */
export function rankProfessionSubtypes(params: { user: UserPersonaInputs; subtypes: ProfessionSubtype[] }): {
  results: FitResult[];
  top: FitResult[];
  bottom: FitResult[];
} {
  const { user, subtypes } = params;

  // precompute user routes once
  const userRoutes = buildUserInstrumentationRoutes({
    innateData: user.innateData,
    surfaceData: user.surfaceData,
    imposedData: user.imposedData,
  });

  const results = subtypes.map((s) =>
    simulateProfessionFit({
      user,
      subtype: s,
      userRoutes,
    })
  );

  results.sort((a, b) => {
    if (a.totalMismatchAdjusted !== b.totalMismatchAdjusted) return a.totalMismatchAdjusted - b.totalMismatchAdjusted;
    if (a.totalDrainedEnergy !== b.totalDrainedEnergy) return a.totalDrainedEnergy - b.totalDrainedEnergy;
    return a.profession.name.localeCompare(b.profession.name);
  });

  const top = results.slice(0, 3);
  const bottom = results.slice(-3).reverse();

  return { results, top, bottom };
}

/**
 * Helper for ad-hoc job inquiry (user defines job demand sliders 0..5).
 */
export function simulateCustomJobFit(params: {
  user: UserPersonaInputs;
  jobName: string;
  jobDemand: Partial<Record<DriveName, number>>; // 0..5 sliders; missing => 0
  major?: string;
}): FitResult {
  const { user, jobName, jobDemand, major = "Custom" } = params;

  const drives = emptyDriveVector(0);
  (driveNames).forEach((d) => {
    (drives as any)[d] = clamp(n(jobDemand[d] ?? 0), 0, 5);
  });

  return simulateProfessionFit({
    user,
    subtype: { major, name: jobName, drives },
  });
}

// ---------------------------------------------------------------------
// ✅ UI-only scoring helpers (kept compatible with older simulateFit usage)
// ---------------------------------------------------------------------

export type SortMode = "mismatch" | "drain" | "overall";

export function getFinalMismatchScore(r: FitResult): number {
  return clamp(n(r.totalMismatchAdjusted), 0, 5);
}

export function getFinalMatchingScore(r: FitResult): number {
  return clamp(5 - getFinalMismatchScore(r), 0, 5);
}

export function getOverallScore(r: FitResult): number {
  return getFinalMismatchScore(r) + n(r.totalDrainedEnergy);
}

export function sortFitResults(list: FitResult[], mode: SortMode): FitResult[] {
  const arr = [...list];

  arr.sort((a, b) => {
    const am = getFinalMismatchScore(a);
    const bm = getFinalMismatchScore(b);

    if (mode === "mismatch") {
      if (am !== bm) return am - bm;
      if (a.totalDrainedEnergy !== b.totalDrainedEnergy) return a.totalDrainedEnergy - b.totalDrainedEnergy;
      return a.profession.name.localeCompare(b.profession.name);
    }

    if (mode === "drain") {
      if (a.totalDrainedEnergy !== b.totalDrainedEnergy) return a.totalDrainedEnergy - b.totalDrainedEnergy;
      if (am !== bm) return am - bm;
      return a.profession.name.localeCompare(b.profession.name);
    }

    const ao = getOverallScore(a);
    const bo = getOverallScore(b);
    if (ao !== bo) return ao - bo;

    if (am !== bm) return am - bm;
    if (a.totalDrainedEnergy !== b.totalDrainedEnergy) return a.totalDrainedEnergy - b.totalDrainedEnergy;

    return a.profession.name.localeCompare(b.profession.name);
  });

  return arr;
}
