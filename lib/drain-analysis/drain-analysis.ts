// lib/reports/drain-analysis.ts
//
// Drain Analysis (UI report model)
// - Uses uniform instrumentation detection (innate DEMOTION) via fit-core
// - Reporting semantics:
//    path: sd -> td  (innate unmet drive sd demotes into surface drive td)
//    dr(sd->td) from route detection (encounterPortion * tdWeight)
//    lr(sd->td) is PROVIDED by fit-core per-path (do NOT recompute in UI)
//
// REPORTING RULES (per user spec):
// 1) Drained Drives list: surfaceDrainTotal(td) > 0.25
//    - Under these drives, show instrument paths with lr > 0
// 2) Adapted Drives list: surfaceTransferTotal(td) > 0.25  (and NOT in Drained list)
//    - Under these drives, show instrument paths with lr == 0
// 3) Remaining drives: everything else
//
// Notes:
// - sdDelta is not reported anywhere (removed).
// - We trust fit-core per-path outputs: lr, pathDrain, pathTransfer,
//   and fit-core aggregates: computeSurfaceDrain / computeSurfaceTransfer.

import { driveNames } from "@/lib/core-utils/fit-core";

import {
  type DriveName,
  type DriveVector,
  type InstrumentRouteBase,
  buildUserInstrumentationRoutes,
  computeSurfaceAvg,
  computeInnateAvg,
  computeUserTdDissatisfactionFromImposed,
  computeSurfaceDrain,
  computeSurfaceTransfer,
} from "@/lib/core-utils/fit-core";

// ------------------------------------------------------------
// small helpers
// ------------------------------------------------------------
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
function isZero(x: number) {
  return Math.abs(x) < 1e-9;
}

// ------------------------------------------------------------
// Types returned to the UI
// ------------------------------------------------------------

export type DrainReportPathEval = {
  sd: DriveName;
  td: DriveName;
  tdWeight: number;
  encounterPortion: number;
  drBase: number;

  dr: number; // == drBase (0..1)
  lr: number; // fit-core provided per-path (do not recompute)

  drainedEnergyOnTd: number; // fit-core pathDrain
  transferredEnergyOnTd: number; // fit-core pathTransfer
};

export type DrainReportTarget = {
  name: DriveName; // sd
  dr: number; // diversion portion to compensate sd (0..1)
  lr: number; // fit-core provided per-path

  drainedEnergyPath: number; // fit-core pathDrain
  transferredEnergyPath: number; // fit-core pathTransfer

  // display flags
  showAsDrainPath: boolean; // (drive is drain-significant) AND lr > 0
  showAsTransferPath: boolean; // (drive is transfer-significant AND NOT drain-significant) AND lr == 0
};

export type DrainReportRow = {
  drive: DriveName; // td
  surfaceEnergy: number; // surfaceAvg(td)
  rank: number; // surface rank (1 = highest)

  surfaceDrainTotal: number; // computeSurfaceDrain()[td]
  surfaceTransferTotal: number; // computeSurfaceTransfer()[td]

  // computed from DISPLAYED drain paths only (lr > 0, and drive is drain-significant)
  energyDiversionRatio: number; // Σ dr over drain paths (capped 0..1)
  drainRatio: number; // avg lr over diverted portion (over drain paths only)
  drainedEnergy: number; // alias of surfaceDrainTotal for convenience

  targets: DrainReportTarget[];

  significantDrain: boolean; // surfaceDrainTotal > 0.25
  significantTransfer: boolean; // surfaceTransferTotal > 0.25

  // backward-compat: "significant" means drain-significant
  significant: boolean;
};

export type DrainBar = {
  drive: DriveName;
  drainedPctOfEnergy: number; // surfaceDrainTotal/surfaceEnergy (drain channel)
  significant: boolean; // drain significance
};

export type DrainSummary = {
  total: number; // sum surfaceDrainTotal across all drives
  significant: number; // count drain-significant drives
  top: DrainReportRow | null; // top drain-significant (or any nonzero if none)
};

export type DrainPairRow = {
  drive: DriveName; // td (surface)
  target: DriveName; // sd (innate unmet)
  drainingPct: number; // (dr*lr) as %
};

export type DrainAnalysisUIModel = {
  rows: DrainReportRow[];
  bars: DrainBar[];
  drainingRows: DrainPairRow[];
  summary: DrainSummary;

  // debugging / future UI:
  paths: DrainReportPathEval[];
  tdDissatisfaction: DriveVector;

  surfaceDrain: DriveVector;
  surfaceTransfer: DriveVector;
};

export const DRAIN_SIGNIFICANCE = {
  driveDrainMin: 0.25, // surfaceDrainTotal(td) > 0.25
  driveTransferMin: 0.25, // surfaceTransferTotal(td) > 0.25
  pathDrainMin: 0.1,
  pathTransferMin: 0.1
};

// ------------------------------------------------------------
// Main entrypoint
// ------------------------------------------------------------
export function computeDrainAnalysisUIModel(params: {
  innateData: any;
  surfaceData: any;
  imposedData: any;
  significance?: Partial<typeof DRAIN_SIGNIFICANCE>;
}): DrainAnalysisUIModel {
  const { innateData, surfaceData, imposedData } = params;
  const sig = { ...DRAIN_SIGNIFICANCE, ...(params.significance ?? {}) };

  // core vectors (surface energy used for ranking + bars)
  const surfaceAvg = computeSurfaceAvg(surfaceData); // 0..5
  const tdDissatisfaction = computeUserTdDissatisfactionFromImposed(imposedData); // 0..5 (debug/useful elsewhere)

  // 1) instrumentation routes (fit-core provides lr/pathDrain/pathTransfer per-path)
  const routes: InstrumentRouteBase[] = buildUserInstrumentationRoutes({
    innateData,
    surfaceData,
    imposedData,
  });

  // 2) per-route path evals for debugging/UI
  const paths: DrainReportPathEval[] = (routes || []).map((r) => {
    const dr = clamp01(n(r.drBase));
    const lr = clamp01(n(r.lr)); // ✅ do NOT recompute in report

    return {
      sd: r.sd,
      td: r.td,
      tdWeight: n(r.tdWeight),
      encounterPortion: n(r.encounterPortion),
      drBase: n(r.drBase),
      dr,
      lr,
      drainedEnergyOnTd: clamp(n(r.pathDrain), 0, 5),
      transferredEnergyOnTd: clamp(n(r.pathTransfer), 0, 5),
    };
  });

  // 3) fit-core aggregate drain/transfer per td
  const innateAvg = computeInnateAvg(innateData);

  const surfaceDrain = computeSurfaceDrain({ innateAvg, paths: routes });
  const surfaceTransfer = computeSurfaceTransfer({ innateAvg, paths: routes });
  // 4) rank drives by surface energy
  const ranked = [...(driveNames as DriveName[])]
    .map((d) => ({ d, s: clamp(n(surfaceAvg[d]), 0, 5) }))
    .sort((a, b) => b.s - a.s);

  const rankMap = new Map<DriveName, number>();
  ranked.forEach((x, idx) => rankMap.set(x.d, idx + 1));

  // 5) group paths by td
  const pathsByTd: Record<string, DrainReportPathEval[]> = {};
  (driveNames as DriveName[]).forEach((d) => (pathsByTd[d] = []));
  paths.forEach((p) => pathsByTd[p.td].push(p));

  // 6) build rows (one per td)
  const rows: DrainReportRow[] = (driveNames as DriveName[]).map((td) => {
    const tdSurf = clamp(n(surfaceAvg[td]), 0, 5);

    const tdDrainTotal = clamp(n(surfaceDrain[td]), 0, 5);
    const tdTransferTotal = clamp(n(surfaceTransfer[td]), 0, 5);

    const significantDrain = tdDrainTotal > sig.driveDrainMin;


    // ✅ Add back the check: adapted/transfer-significant drives must NOT be drain-significant
    //const significantTransferRaw = tdTransferTotal > sig.driveTransferMin;
    //const significantTransfer = significantTransferRaw && !significantDrain;
    const significantTransfer = tdTransferTotal > sig.driveTransferMin;

    const tdPaths = pathsByTd[td] || [];

    const targets: DrainReportTarget[] = tdPaths
      .map((p) => {
        const dr = clamp01(n(p.dr));
        const lr = clamp01(n(p.lr));

        const drainedEnergyPath = clamp(n(p.drainedEnergyOnTd), 0, 5);
        const transferredEnergyPath = clamp(n(p.transferredEnergyOnTd), 0, 5);

        const showAsDrainPath = drainedEnergyPath>sig.pathDrainMin; //&& lr > 0;
        const showAsTransferPath = transferredEnergyPath> sig.pathTransferMin;// && isZero(lr);

        return {
          name: p.sd,
          dr,
          lr,
          drainedEnergyPath,
          transferredEnergyPath,
          showAsDrainPath,
          showAsTransferPath,
        };
      })
      .sort((a, b) => {
        const aScore = a.showAsDrainPath
          ? a.drainedEnergyPath
          : a.showAsTransferPath
            ? a.transferredEnergyPath
            : 0;
        const bScore = b.showAsDrainPath
          ? b.drainedEnergyPath
          : b.showAsTransferPath
            ? b.transferredEnergyPath
            : 0;
        return bScore - aScore;
      });

    // Legacy-ish summaries: computed only from DRAIN paths you will show (drive drain-significant + lr>0)
    const drainTargets = targets.filter((t) => t.showAsDrainPath);

    const diversionSum = drainTargets.reduce((acc, t) => acc + clamp01(t.dr), 0);
    const drainedPortionSum = drainTargets.reduce((acc, t) => acc + clamp01(t.dr * t.lr), 0);

    const energyDiversionRatio = clamp01(diversionSum);
    const drainedPortion = clamp01(drainedPortionSum);
    const drainRatio = energyDiversionRatio > 0 ? clamp01(drainedPortion / energyDiversionRatio) : 0;

    return {
      drive: td,
      surfaceEnergy: tdSurf,
      rank: rankMap.get(td) || 0,

      surfaceDrainTotal: tdDrainTotal,
      surfaceTransferTotal: tdTransferTotal,

      energyDiversionRatio,
      drainRatio,
      drainedEnergy: tdDrainTotal,

      targets,

      significantDrain,
      significantTransfer,

      significant: significantDrain,
    };
  });

  // stable ordering by surface rank
  rows.sort((a, b) => (a.rank || 999) - (b.rank || 999));

  // 7) bars (drain channel): significant drain first
  const bars: DrainBar[] = rows
    .map((r) => {
      const drainedPctOfEnergy = r.surfaceEnergy > 0 ? clamp01(r.surfaceDrainTotal / r.surfaceEnergy) : 0;
      return { drive: r.drive, drainedPctOfEnergy, significant: r.significantDrain };
    })
    .sort((a, b) => {
      if (a.significant !== b.significant) return a.significant ? -1 : 1;
      return b.drainedPctOfEnergy - a.drainedPctOfEnergy;
    });

  // 8) integration summary table: one row per DRAIN PATH shown (drain-significant drives only, lr>0)
  const drainingRows: DrainPairRow[] = [];
  rows
    .filter((r) => r.significantDrain)
    .forEach((r) => {
      r.targets
        .filter((t) => t.showAsDrainPath) // already implies lr>0
        .forEach((t) => {
          drainingRows.push({
            drive: r.drive,
            target: t.name,
            drainingPct: clamp01(t.dr * t.lr) * 100,
          });
        });
    });
  drainingRows.sort((a, b) => b.drainingPct - a.drainingPct);

  // 9) summary (DRAIN channel)
  const total = rows.reduce((acc, r) => acc + r.surfaceDrainTotal, 0);
  const significantCount = rows.filter((r) => r.significantDrain).length;

  const top =
    rows
      .filter((r) => r.significantDrain)
      .slice()
      .sort((a, b) => b.surfaceDrainTotal - a.surfaceDrainTotal)[0] ??
    rows
      .filter((r) => r.surfaceDrainTotal > 0)
      .slice()
      .sort((a, b) => b.surfaceDrainTotal - a.surfaceDrainTotal)[0] ??
    null;

  return {
    rows,
    bars,
    drainingRows,
    summary: { total, significant: significantCount, top },
    paths,
    tdDissatisfaction,
    surfaceDrain,
    surfaceTransfer,
  };
}