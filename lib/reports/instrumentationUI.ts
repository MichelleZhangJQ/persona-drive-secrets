// lib/reports/instrumentUI.ts
// Instrumentation report view-model builder.
// Keeps the page UI code minimal by returning the same "reportFlow" shape
// the existing page already renders.

import { driveNames } from "@/lib/core-utils/fit-core";
import {
  type DriveName,
  computeInnateAvg,
  buildUserInstrumentationRoutes,
  extractUserEnvCompetenceSelfInterest,
  calculateUserDriveSatisfaction,
} from "@/lib/core-utils/fit-core";

export type InstrumentationReversal = {
  reason: "suppression" | "prioritization";
  sourceDrive: string;
  targetDrive: string;
  template: "suppression_compensation" | "prioritization_redirect";
};

export type InstrumentationReportItem = {
  name: DriveName;
  rank: number;
  score: number; // innate score
  satisfaction: number;
  contextualNote: string;
  genuinePassionNote: string;
  reversals: InstrumentationReversal[];
};

export function buildInstrumentationReportFlow(params: {
  innateData: any;
  surfaceData: any;
  imposedData: any;
}): {
  reportFlow: InstrumentationReportItem[];
  summaryCounts: { suppression: number; priority: number };
} {
  const { innateData, surfaceData, imposedData } = params;

  const innateAvg = computeInnateAvg(innateData);

  // Same “private context” note logic (uses surface q18/q19/q20 directly)
  const q18 = Number(surfaceData?.q18_answer) || 0;
  const q19 = Number(surfaceData?.q19_answer) || 0;
  const q20 = Number(surfaceData?.q20_answer) || 0;

  // Satisfaction derived from imposed persona (core-utils)
  const { env, competence, selfInterest } = extractUserEnvCompetenceSelfInterest(imposedData);
  const satisfactionVec = calculateUserDriveSatisfaction({ env, competence, selfInterest });

  // Core instrumentation routes (DEMOTION logic)
  const routes = buildUserInstrumentationRoutes({ innateData, surfaceData, imposedData });

  // Rank drives by innate preference
  const sortedDrives = [...driveNames].sort((a, b) => (innateAvg[b] ?? 0) - (innateAvg[a] ?? 0));

  let totalSuppression = 0;
  let totalPriority = 0;

  const reportFlow: InstrumentationReportItem[] = sortedDrives.map((driveName, index) => {
    const satisfaction = Number(satisfactionVec[driveName] ?? 0);

    const sdRoutes = routes.filter((r) => r.sd === driveName);

    const reversals: InstrumentationReversal[] = sdRoutes.map((r) => {
      const isSuppression = satisfaction < 3;

      if (isSuppression) totalSuppression += 1;
      else totalPriority += 1;

      return {
        reason: isSuppression ? "suppression" : "prioritization",
        sourceDrive: driveName.toLowerCase(),
        targetDrive: String(r.td).toLowerCase(),
        template: isSuppression ? "suppression_compensation" : "prioritization_redirect",
      };
    });

    // Keep your contextual note behavior unchanged
    let contextualNote = "";
    const targetDrives = ["Dominance", "Affiliation", "Pleasure"];
    if (targetDrives.includes(String(driveName)) && (q18 < 3 || q19 < 3 || q20 < 3)) {
      contextualNote = `Because of your preference for private contexts, you likely only manifest the ${String(
        driveName
      ).toLowerCase()} drive in smaller groups or more private settings.`;
    }

    const hasNoInstrumentation = reversals.length === 0;
    const isLowSatisfaction = satisfaction < 3;

    const genuinePassionNote =
      isLowSatisfaction && hasNoInstrumentation
        ? `Even though your environment currently undersatisfies your ${String(
            driveName
          ).toLowerCase()} drive, it is not being instrumentalized into other drives. This usually indicates a genuine, self-directed passion to fulfill it on its own terms.`
        : "";

    return {
      name: driveName,
      rank: index + 1,
      score: Number(innateAvg[driveName] ?? 0),
      satisfaction,
      contextualNote,
      genuinePassionNote,
      reversals,
    };
  });

  return {
    reportFlow,
    summaryCounts: { suppression: totalSuppression, priority: totalPriority },
  };
}
