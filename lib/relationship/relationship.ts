// lib/reports/relationship.ts
//
// Ideal Partner Profile (UI report model)
//
// ✅ Core behaviors
// 1) Build raw partner-demand by blocks, then MAX aggregate (not sum)
// 2) ✅ Post-aggregation caps:
//    - Partner Value is capped by your INNATE Value intensity (upper bound)
//    - Partner Dominance is capped by your SURFACE Dominance intensity (upper bound)
// 3) partnerIdeal is RAW (no rounding), clamped to 0..5
// 4) Bars include displayScore scaled so the largest bar is 5
// 5) ✅ Partner-drive explanations use FIXED scripts (not computed)
// 6) ✅ NEW: Export cap metadata so UI can show/annotate/export “this drive was capped”

import { driveNames } from "@/lib/core-utils/fit-core";
import {
  type DriveName,
  type DriveVector,
  computeSurfaceAvg,
  computeInnateAvg,
  emptyDriveVector,
} from "@/lib/core-utils/fit-core";

// ------------------------------------------------------------
// tiny helpers
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

function buildWeightFromAvg(avg: DriveVector): DriveVector {
  const w = emptyDriveVector(0);
  (driveNames as DriveName[]).forEach((d) => {
    (w as any)[d] = clamp01(n((avg as any)[d]) / 5);
  });
  return w;
}

function maxAggregateDriveVector(target: DriveVector, candidate: DriveVector) {
  (driveNames as DriveName[]).forEach((d) => {
    const cur = n((target as any)[d]);
    const next = n((candidate as any)[d]);
    (target as any)[d] = Math.max(cur, next);
  });
}

function maxAggregateValueMap(target: Record<string, number>, candidate: Record<string, number>) {
  Object.keys(candidate || {}).forEach((k) => {
    target[k] = Math.max(n(target[k]), n(candidate[k]));
  });
}

function cloneDriveVector(v: DriveVector): DriveVector {
  const out = emptyDriveVector(0);
  (driveNames as DriveName[]).forEach((d) => ((out as any)[d] = n((v as any)[d])));
  return out;
}

// ------------------------------------------------------------
// Fixed partner-drive scripts + support lists (no computation)
// ------------------------------------------------------------
export type PartnerDriveInsight = {
  partnerDrive: DriveName;
  scriptKey: string;
  innateSupport: DriveName[];
  surfaceSupport: DriveName[];
  noteKeys?: string[];
};

export const PARTNER_DRIVE_SCRIPT_KEYS: Record<
  DriveName,
  { scriptKey: string; innateSupport: DriveName[]; surfaceSupport: DriveName[]; noteKeys?: string[] }
> = {
  Exploration: {
    scriptKey: "relationship.scripts.Exploration",
    innateSupport: ["Care", "Value", "Exploration"],
    surfaceSupport: ["Dominance"],
  },

  Achievement: {
    scriptKey: "relationship.scripts.Achievement",
    innateSupport: ["Care", "Affiliation", "Exploration"],
    surfaceSupport: [],
  },

  Value: {
    scriptKey: "relationship.scripts.Value",
    innateSupport: ["Affiliation", "Value"],
    surfaceSupport: ["Dominance", "Achievement"],
  },

  Care: {
    scriptKey: "relationship.scripts.Care",
    innateSupport: ["Care"],
    surfaceSupport: ["Pleasure"],
  },

  Dominance: {
    scriptKey: "relationship.scripts.Dominance",
    innateSupport: ["Exploration"],
    surfaceSupport: ["Dominance"],
  },

  Affiliation: {
    scriptKey: "relationship.scripts.Affiliation",
    innateSupport: [],
    surfaceSupport: ["Dominance"],
  },

  Pleasure: {
    scriptKey: "relationship.scripts.Pleasure",
    innateSupport: [],
    surfaceSupport: ["Pleasure"],
  },
};

// ------------------------------------------------------------
// Types (UI-facing)
// ------------------------------------------------------------
export type PartnerValueRequirement = {
  label: string;
  amount: number;
  reason: string;
  supportingSelfDrives: {
    selfDrive: DriveName;
    selfSurfaceStrength: number;
    selfInnateStrength: number;
    requiredAmount: number;
    block: string;
  }[];
};

export type PartnerSupportLink = {
  block: string;
  selfDrive: DriveName;
  selfSurfaceStrength: number;
  selfInnateStrength: number;

  partnerDrive: DriveName;
  requiredAmount: number;
  reason: string;
};

export type PartnerValueSupportLink = {
  block: string;
  selfDrive: DriveName;
  selfSurfaceStrength: number;
  selfInnateStrength: number;

  label: string;
  requiredAmount: number;
  reason: string;
};

export type PartnerDriveRow = {
  drive: DriveName;
  rank: number;
  rawDemand: number;
  idealScore: number; // 0..5 (clamped raw)
  displayScore: number; // scaled so max bar is 5
};

export type PartnerDriveBar = {
  drive: DriveName;
  pct: number; // displayScore / 5
  displayScore: number; // 0..5 (scaled)
  rawScore: number; // idealScore (clamped raw)
};

export type IdealPartnerProfileSummary = {
  totalRawDemand: number;
  topDrive: DriveName | null;
  topIdealScore: number;
  topDisplayScore: number;
};



export type IdealPartnerProfileUIModel = {
  selfSurface: DriveVector;
  selfInnate: DriveVector;

  surfaceWeight: DriveVector;
  innateWeight: DriveVector;

  // ✅ Uncapped demand (after MAX aggregation, before caps)
  partnerRawUncapped: DriveVector;

  // ✅ Capped demand (after caps)
  partnerRaw: DriveVector;

  partnerIdeal: DriveVector; // clamped to 0..5

  // Optional debug
  supportLinks: PartnerSupportLink[];
  valueSupportLinks: PartnerValueSupportLink[];
  valueRequirements: PartnerValueRequirement[];

  // simplified partner-drive explanation payload
  partnerDriveInsights: PartnerDriveInsight[];

  // Bars/rows for charting
  rows: PartnerDriveRow[];
  bars: PartnerDriveBar[];
  summary: IdealPartnerProfileSummary;

  // ✅ Cap outputs for UI/export
  partnerCaps: Partial<Record<DriveName, number>>;
  partnerCapMeta: Partial<Record<DriveName, PartnerCapInfo>>;

  bySource?: {
    blockNames: string[];
    partnerNeedByBlock: Record<string, DriveVector>;
    valueNeedByBlock: Record<string, Record<string, number>>;
  };
};

export type PartnerCapComponent = {
  basis: "innate" | "surface";
  selfDrive: DriveName;
  selfStrength: number; // 0..5
  cap: number; // 0..5
  reasonKey?: string;
  reasonParams?: Record<string, any>;

};

export type PartnerCapInfo = {
  partnerDrive: DriveName;

  cap: number;
  uncappedDemand: number;
  cappedDemand: number;
  isCapped: boolean;

  // keep these as your “primary” explanation shown in UI
  basis: "innate" | "surface";
  selfDrive: DriveName;
  selfStrength: number;

  rule: string;
  reasonKey?: string;
  reasonParams?: Record<string, any>;

  // ✅ NEW (optional): breakdown when cap is min(of multiple ceilings)
  capComponents?: PartnerCapComponent[];      // all candidates
  bindingComponents?: PartnerCapComponent[];  // which one(s) set the final cap
};

// ------------------------------------------------------------
// main
// ------------------------------------------------------------
export function computeIdealPartnerProfileUIModel(params: {
  innateData: any;
  surfaceData: any;
  debug?: boolean;
}): IdealPartnerProfileUIModel {
  const { innateData, surfaceData } = params;
  const debug = !!params.debug;

  // 1) self vectors
  const selfSurface = computeSurfaceAvg(surfaceData); // 0..5
  const selfInnate = computeInnateAvg(innateData); // 0..5

  // 2) weights
  const surfaceWeight = buildWeightFromAvg(selfSurface);
  const innateWeight = buildWeightFromAvg(selfInnate);

  // 3) per-block outputs (for MAX aggregation + optional debug)
  const blockNames: string[] = [];
  const partnerNeedByBlock: Record<string, DriveVector> = {};
  const valueNeedByBlock: Record<string, Record<string, number>> = {};

  const supportLinks: PartnerSupportLink[] = [];
  const valueSupportLinks: PartnerValueSupportLink[] = [];

  function addBlock(blockName: string, partnerNeedVector: DriveVector, valueNeedMap: Record<string, number>) {
    blockNames.push(blockName);
    partnerNeedByBlock[blockName] = partnerNeedVector;
    valueNeedByBlock[blockName] = valueNeedMap;
  }

  function link(params: Omit<PartnerSupportLink, "selfSurfaceStrength" | "selfInnateStrength">) {
    supportLinks.push({
      ...params,
      selfSurfaceStrength: clamp(n((selfSurface as any)[params.selfDrive]), 0, 5),
      selfInnateStrength: clamp(n((selfInnate as any)[params.selfDrive]), 0, 5),
      requiredAmount: Math.max(0, n(params.requiredAmount)),
    });
  }

  function valueLink(params: Omit<PartnerValueSupportLink, "selfSurfaceStrength" | "selfInnateStrength">) {
    valueSupportLinks.push({
      ...params,
      selfSurfaceStrength: clamp(n((selfSurface as any)[params.selfDrive]), 0, 5),
      selfInnateStrength: clamp(n((selfInnate as any)[params.selfDrive]), 0, 5),
      requiredAmount: Math.max(0, n(params.requiredAmount)),
    });
  }

  // ============================================================
  // BLOCK: CARE
  // ============================================================
  {
    const blockName = "Care";
    const partnerNeedVector = emptyDriveVector(0);
    const valueNeedMap: Record<string, number> = {};

    const careInnateWeight = n((innateWeight as any).Care);

    const selfAchievement_surface = n((selfSurface as any).Achievement);
    const selfCare_innate = n((selfInnate as any).Care);
    const selfExploration_innate = n((selfInnate as any).Exploration);

    const reqPartnerAchievement = careInnateWeight * selfCare_innate;
    const reqPartnerCare = careInnateWeight * selfCare_innate;
    const reqPartnerExploration = careInnateWeight * selfCare_innate;

    (partnerNeedVector as any).Achievement = reqPartnerAchievement;
    (partnerNeedVector as any).Care = reqPartnerCare;
    (partnerNeedVector as any).Exploration = reqPartnerExploration;

    link({
      block: blockName,
      selfDrive: "Care",
      partnerDrive: "Achievement",
      requiredAmount: reqPartnerAchievement,
      reason:
        "Care needs practical reliability (resources/time); higher partner Achievement offsets your time and resources spent on care. This is mitigated by your own achievement.",
    });
    link({
      block: blockName,
      selfDrive: "Care",
      partnerDrive: "Care",
      requiredAmount: reqPartnerCare,
      reason:
        "Your innate Care needs genuine care from your partner: consistent responsiveness and willingness to provide the type of care you need.",
    });
    link({
      block: blockName,
      selfDrive: "Care",
      partnerDrive: "Exploration",
      requiredAmount: reqPartnerExploration,
      reason:
        "Care can require nuanced understanding; partner Exploration supports sophisticated understanding of your actual needs. This is mitigated by your own understanding of yourself.",
    });

    addBlock(blockName, partnerNeedVector, valueNeedMap);
  }

  // ============================================================
  // BLOCK: DOMINANCE
  // ============================================================
  {
    const blockName = "Dominance";
    const partnerNeedVector = emptyDriveVector(0);
    const valueNeedMap: Record<string, number> = {};

    const dominanceSurfaceWeight = n((surfaceWeight as any).Dominance);
    const selfDominance_surface = n((selfSurface as any).Dominance);

    const reqPartnerValue = dominanceSurfaceWeight * selfDominance_surface;
    const reqPartnerAffiliation = dominanceSurfaceWeight * selfDominance_surface;
    const reqPartnerDominance = dominanceSurfaceWeight * (6 - selfDominance_surface);
    const reqPartnerExploration = dominanceSurfaceWeight * selfDominance_surface;

    (partnerNeedVector as any).Value = reqPartnerValue;
    (partnerNeedVector as any).Affiliation = reqPartnerAffiliation;
    (partnerNeedVector as any).Dominance = reqPartnerDominance;
    (partnerNeedVector as any).Exploration = reqPartnerExploration;

    const reqValueToDominance = dominanceSurfaceWeight * (6 - selfDominance_surface);
    valueNeedMap["Value→Dominance"] = reqValueToDominance;

    link({
      block: blockName,
      selfDrive: "Dominance",
      partnerDrive: "Value",
      requiredAmount: reqPartnerValue,
      reason: "High Dominance benefits from a partner who respects boundaries and can anchor power with principles.",
    });
    link({
      block: blockName,
      selfDrive: "Dominance",
      partnerDrive: "Affiliation",
      requiredAmount: reqPartnerAffiliation,
      reason: "High Dominance needs repair capacity (softening, reconnecting) after conflict—Affiliation supports that.",
    });
    link({
      block: blockName,
      selfDrive: "Dominance",
      partnerDrive: "Dominance",
      requiredAmount: reqPartnerDominance,
      reason: "Decision-making is smoother when the partner’s Dominance is not competing at the same intensity.",
    });
    link({
      block: blockName,
      selfDrive: "Dominance",
      partnerDrive: "Exploration",
      requiredAmount: reqPartnerExploration,
      reason: "Exploration can buffer Dominance by adding perspective, alternatives, and de-escalation options.",
    });

    valueLink({
      block: blockName,
      selfDrive: "Dominance",
      label: "Value→Dominance",
      requiredAmount: reqValueToDominance,
      reason:
        "Since your Dominance drive is active, you need your partner to *value* your agency and boundaries: respecting leadership/decision roles when appropriate, and committing to healthy limit-setting rather than power struggles.",
    });

    addBlock(blockName, partnerNeedVector, valueNeedMap);
  }

  // ============================================================
  // BLOCK: ACHIEVEMENT
  // ============================================================
  {
    const blockName = "Achievement";
    const partnerNeedVector = emptyDriveVector(0);
    const valueNeedMap: Record<string, number> = {};

    const achievementSurfaceWeight = n((surfaceWeight as any).Achievement);
    const selfAchievement_surface = n((selfSurface as any).Achievement);

    const reqPartnerAchievement = achievementSurfaceWeight * (6-selfAchievement_surface);
    const reqPartnerValue = achievementSurfaceWeight * selfAchievement_surface;

    const reqValueToAchievement = achievementSurfaceWeight * selfAchievement_surface;
    valueNeedMap["Value→Achievement"] = reqValueToAchievement;

    (partnerNeedVector as any).Achievement = reqPartnerAchievement;
    (partnerNeedVector as any).Value = reqPartnerValue;

    link({
      block: blockName,
      selfDrive: "Achievement",
      partnerDrive: "Achievement",
      requiredAmount: reqPartnerAchievement,
      reason:
        "When your Achievement is high, you need less compensatory Achievement from a partner; when it’s lower, partner Achievement fills the gap.",
    });
    link({
      block: blockName,
      selfDrive: "Achievement",
      partnerDrive: "Value",
      requiredAmount: reqPartnerValue,
      reason: "Achievement goals are stabilized when the partner values and respects your long-term goals and effort.",
    });

    valueLink({
      block: blockName,
      selfDrive: "Achievement",
      label: "Value→Achievement",
      requiredAmount: reqValueToAchievement,
      reason:
        "Since your Achievement drive is important, you need your partner to *value* your goals and standards: affirming effort, honoring commitments, and not undermining your long-horizon projects as “too much.”",
    });

    addBlock(blockName, partnerNeedVector, valueNeedMap);
  }

  // ============================================================
  // BLOCK: PLEASURE
  // ============================================================
  {
    const blockName = "Pleasure";
    const partnerNeedVector = emptyDriveVector(0);
    const valueNeedMap: Record<string, number> = {};

    const pleasureSurfaceWeight = n((surfaceWeight as any).Pleasure);
    const selfPleasure_surface = n((selfSurface as any).Pleasure);
    const selfCare_surface = n((selfSurface as any).Care);

    const reqPartnerPleasure = pleasureSurfaceWeight * selfPleasure_surface;
    const reqPartnerCare = pleasureSurfaceWeight * selfCare_surface;

    (partnerNeedVector as any).Pleasure = reqPartnerPleasure;
    (partnerNeedVector as any).Care = reqPartnerCare;

    link({
      block: blockName,
      selfDrive: "Pleasure",
      partnerDrive: "Pleasure",
      requiredAmount: reqPartnerPleasure,
      reason: "Pleasure needs shared enjoyment and play—partner Pleasure helps co-create positive affect.",
    });
    link({
      block: blockName,
      selfDrive: "Pleasure",
      partnerDrive: "Care",
      requiredAmount: reqPartnerCare,
      reason: "Pleasure is sustained by comfort and attunement—partner Care helps regulate stress and keep enjoyment accessible.",
    });

    addBlock(blockName, partnerNeedVector, valueNeedMap);
  }

  // ============================================================
  // BLOCK: AFFILIATION
  // ============================================================
  {
    const blockName = "Affiliation";
    const partnerNeedVector = emptyDriveVector(0);
    const valueNeedMap: Record<string, number> = {};

    const affiliationInnateWeight = n((innateWeight as any).Affiliation);
    const selfAffiliation_innate = n((selfInnate as any).Affiliation);

    const reqPartnerValue = affiliationInnateWeight * selfAffiliation_innate;
    const reqValueToAffiliation = affiliationInnateWeight * selfAffiliation_innate;

    (partnerNeedVector as any).Value = reqPartnerValue;
    valueNeedMap["Value→Affiliation"] = reqValueToAffiliation;

    const reqPartnerAchievement = affiliationInnateWeight * selfAffiliation_innate;
    (partnerNeedVector as any).Achievement = reqPartnerAchievement;


    link({
      block: blockName,
      selfDrive: "Affiliation",
      partnerDrive: "Value",
      requiredAmount: reqPartnerValue,
      reason:
        "Innate Affiliation reflects a non-instrumental need for belonging and repair. Partner Value supports stable commitment in time and resource required to maintain social connection.",
    });
     link({
      block: blockName,
      selfDrive: "Affiliation",
      partnerDrive: "Achievement",
      requiredAmount: reqPartnerAchievement,
      reason:
        "Maintaining broader social connections requires time/resources. When your surface Achievement is lower, partner Achievement can compensate by supplying structure/resources. This demand is driven by *innate* Affiliation (non-instrumental), because instrumental Affiliation would be serving other drives and wouldn’t require partner support.",
    });

    valueLink({
      block: blockName,
      selfDrive: "Affiliation",
      label: "Value→Affiliation",
      requiredAmount: reqValueToAffiliation,
      reason:
        "Since your *innate* Affiliation drive seeks belonging and repair (beyond instrumental networking), you need your partner to *value* connection: prioritizing reciprocity, responsiveness, and reconnection after ruptures.",
    });

    addBlock(blockName, partnerNeedVector, valueNeedMap);
  }

  // ============================================================
  // BLOCK: VALUE  (use INNATE Value as the main basis)
  // ============================================================
  {
    const blockName = "Value";
    const partnerNeedVector = emptyDriveVector(0);
    const valueNeedMap: Record<string, number> = {};

    const valueInnateWeight = n((innateWeight as any).Value);
    const selfValue_innate = n((selfInnate as any).Value);

    const reqPartnerExploration = valueInnateWeight * selfValue_innate;
    (partnerNeedVector as any).Exploration = reqPartnerExploration;

    const reqPartnerValue = valueInnateWeight * (6 - selfValue_innate);
    (partnerNeedVector as any).Value = reqPartnerValue;

    const reqValueToExploration = valueInnateWeight * selfValue_innate;
    valueNeedMap["Self Value→Exploration"] = reqValueToExploration;

    link({
      block: blockName,
      selfDrive: "Value",
      partnerDrive: "Exploration",
      requiredAmount: reqPartnerExploration,
      reason:
        "Innate Value needs meaning-making and nuance; partner Exploration supports interpretation, moral reasoning, and alignment negotiation.",
    });

    link({
      block: blockName,
      selfDrive: "Value",
      partnerDrive: "Value",
      requiredAmount: reqPartnerValue,
      reason:
        "Innate Value is responsible for setting orders; ideally, your partner Value needs complement your Value needs to reach harmony.",
    });

    valueLink({
      block: blockName,
      selfDrive: "Value",
      label: "Self Value→Exploration",
      requiredAmount: reqValueToExploration,
      reason:
        "If your Value drive is strong (innate), you benefit when your partner *values* thoughtful inquiry: taking principles seriously while staying curious and willing to explore nuance rather than becoming rigid or dismissive.",
    });

    addBlock(blockName, partnerNeedVector, valueNeedMap);
  }

  // ============================================================
  // BLOCK: EXPLORATION
  // ============================================================
  {
    const blockName = "Exploration";
    const partnerNeedVector = emptyDriveVector(0);
    const valueNeedMap: Record<string, number> = {};

    const explorationInnateWeight = n((innateWeight as any).Exploration);

    const selfExploration_surface = n((selfSurface as any).Exploration);
    const selfAchievement_surface = n((selfSurface as any).Achievement);
    const selfExploration_innate = n((selfInnate as any).Exploration);

    const reqPartnerAchievement = explorationInnateWeight * (selfExploration_surface-selfAchievement_surface);
    const reqPartnerDominance = explorationInnateWeight * (6 - selfExploration_surface);
    const reqPartnerExploration = explorationInnateWeight * selfExploration_innate;

    (partnerNeedVector as any).Achievement = reqPartnerAchievement;
    (partnerNeedVector as any).Dominance = reqPartnerDominance;
    (partnerNeedVector as any).Exploration = reqPartnerExploration;

    const reqValueToCore = explorationInnateWeight * selfExploration_innate;
    valueNeedMap["Partner Value→Exploration"] = reqValueToCore;

    link({
      block: blockName,
      selfDrive: "Exploration",
      partnerDrive: "Achievement",
      requiredAmount: reqPartnerAchievement,
      reason:
        "Exploration benefits from partner Achievement which provides cushions on the time and resources needed for exploration. This need is mitigated by your own surface Achievement.",
    });
    link({
      block: blockName,
      selfDrive: "Exploration",
      partnerDrive: "Dominance",
      requiredAmount: reqPartnerDominance,
      reason:
        "When your surface Exploration is higher, strong partner Dominance can reduce freedom; when it’s lower, partner Dominance can add helpful structure. Thus partner dominance needs to be capped",
    });
    link({
      block: blockName,
      selfDrive: "Exploration",
      partnerDrive: "Exploration",
      requiredAmount: reqPartnerExploration,
      reason:
        "Intellectual intimacy needs mutual stimulation; innate Exploration sets the depth/complexity you benefit from in a partner.",
    });

    valueLink({
      block: blockName,
      selfDrive: "Exploration",
      label: "Partner Value→Exploration",
      requiredAmount: reqValueToCore,
      reason:
        "Since your Exploration drive is strong (innate), you need your partner to *value* your orientation toward growth and truth-seeking—supporting learning, curiosity, and development instead of punishing change or complexity.",
    });

    addBlock(blockName, partnerNeedVector, valueNeedMap);
  }

  // ============================================================
  // 4) MAX aggregate partner drives across blocks
  // ============================================================
  const partnerRaw = emptyDriveVector(0);
  blockNames.forEach((b) => maxAggregateDriveVector(partnerRaw, partnerNeedByBlock[b]));
  (driveNames as DriveName[]).forEach((d) => ((partnerRaw as any)[d] = Math.max(0, n((partnerRaw as any)[d]))));

  // ✅ save a copy BEFORE caps for export / UI annotation
  const partnerRawUncapped = cloneDriveVector(partnerRaw);

  // ============================================================
  // ✅ 4.5) Post-aggregation caps + exportable meta
  // ============================================================
  const partnerCaps: Partial<Record<DriveName, number>> = {};

  const partnerCapMeta: Partial<Record<DriveName, PartnerCapInfo>> = {};

  // --- cap rule: Partner Value capped by your INNATE Value intensity AND your INNATE Exploration intensity
  {
    const selfValue = clamp(n((selfInnate as any).Value), 0, 5);
    const selfExplInn = clamp(n((selfInnate as any).Exploration), 0, 5);


    const capByValue = clamp(6 - selfValue, 0, 5);
    const capByExploration = clamp(6 - selfExplInn, 0, 5);


    const cap = Math.min(capByValue, capByExploration);

    const uncappedDemand = n((partnerRawUncapped as any).Value);
    const cappedDemand = Math.min(uncappedDemand, cap);
    const isCapped = uncappedDemand > cap + 1e-9;

    partnerCaps.Value = cap;
    (partnerRaw as any).Value = cappedDemand;

    const capComponents: PartnerCapComponent[] = [
      {
        basis: "innate",
        selfDrive: "Value",
        selfStrength: selfValue,
        cap: capByValue,
        reasonKey: "relationship.capReasons.value.byValue",
      },
      {
        basis: "innate",
        selfDrive: "Exploration",
        selfStrength: selfExplInn,
        cap: capByExploration,
        reasonKey: "relationship.capReasons.value.byExploration",
      },   
    ];    
  

    // binding = any component achieving the minimum (ties allowed)
    const eps = 1e-9;
    const bindingComponents = capComponents.filter((c) => c.cap <= cap + eps);

    // primary (for legacy UI): prefer Value when tied
    const primary =
      bindingComponents.find((c) => c.selfDrive === "Value" && c.basis === "innate") ?? bindingComponents[0];

    partnerCapMeta.Value = {
      partnerDrive: "Value",
      cap,
      uncappedDemand,
      cappedDemand,
      isCapped,

      basis: primary?.basis ?? "innate",
      selfDrive: primary?.selfDrive ?? "Value",
      selfStrength: primary?.selfStrength ?? selfValue,

      rule: "cap = min(clamp(6 - selfInnate.Value, 0..5), clamp(6 - selfInnate.Exploration, 0..5))",

      // legacy combined reason (optional to keep)
      reasonKey: "relationship.capReasons.summary.value",

      capComponents,
      bindingComponents,
    };
  }

  // --- cap rule: Partner Dominance capped by your SURFACE Dominance intensity AND your INNATE Exploration intensity
  {
    const selfDomSurf = clamp(n((selfSurface as any).Dominance), 0, 5);
    const selfExplInn = clamp(n((selfInnate as any).Exploration), 0, 5);

    const capByDom = clamp(6 - selfDomSurf, 0, 5);
    const capByExpl = clamp(6 - selfExplInn, 0, 5);

    const cap = Math.min(capByDom, capByExpl);

    const uncappedDemand = n((partnerRawUncapped as any).Dominance);
    const cappedDemand = Math.min(uncappedDemand, cap);
    const isCapped = uncappedDemand > cap + 1e-9;

    partnerCaps.Dominance = cap;
    (partnerRaw as any).Dominance = cappedDemand;

    const capComponents: PartnerCapComponent[] = [
      {
        basis: "surface",
        selfDrive: "Dominance",
        selfStrength: selfDomSurf,
        cap: capByDom,
        reasonKey: "relationship.capReasons.dominance.bySurfaceDominance",
      },
      {
        basis: "innate",
        selfDrive: "Exploration",
        selfStrength: selfExplInn,
        cap: capByExpl,
        reasonKey: "relationship.capReasons.dominance.byExploration",
      },
    ];

    const eps = 1e-9;
    const bindingComponents = capComponents.filter((c) => c.cap <= cap + eps);

    // primary (for legacy UI): prefer Dominance(surface) when tied
    const primary =
      bindingComponents.find((c) => c.selfDrive === "Dominance" && c.basis === "surface") ?? bindingComponents[0];

    partnerCapMeta.Dominance = {
      partnerDrive: "Dominance",
      cap,
      uncappedDemand,
      cappedDemand,
      isCapped,

      basis: primary?.basis ?? "surface",
      selfDrive: primary?.selfDrive ?? "Dominance",
      selfStrength: primary?.selfStrength ?? selfDomSurf,

      rule: "cap = min(clamp(6 - selfSurface.Dominance, 0..5), clamp(6 - selfInnate.Exploration, 0..5))",

      // legacy combined reason (optional to keep)
      reasonKey: "relationship.capReasons.summary.dominance",

      capComponents,
      bindingComponents,
    };
  }


  // ============================================================
  // 5) MAX aggregate value requirements per label (kept for debug)
  // ============================================================
  const valueNeedMax: Record<string, number> = {};
  blockNames.forEach((b) => maxAggregateValueMap(valueNeedMax, valueNeedByBlock[b]));

  const valueRequirements: PartnerValueRequirement[] = Object.keys(valueNeedMax)
    .map((label) => {
      const amount = Math.max(0, n(valueNeedMax[label]));

      const supporting = valueSupportLinks
        .filter((l) => l.label === label && l.requiredAmount > 0)
        .slice()
        .sort((a, b) => b.requiredAmount - a.requiredAmount)
        .map((l) => ({
          selfDrive: l.selfDrive,
          selfSurfaceStrength: l.selfSurfaceStrength,
          selfInnateStrength: l.selfInnateStrength,
          requiredAmount: l.requiredAmount,
          block: l.block,
        }));

      const bestReason = valueSupportLinks
        .filter((l) => l.label === label && l.requiredAmount > 0)
        .slice()
        .sort((a, b) => b.requiredAmount - a.requiredAmount)[0]?.reason;

      const reason =
        bestReason ??
        `This indicates you benefit when your partner *values* ${label.replace("Value→", "")} as a shared commitment (not just behaviorally).`;

      return { label, amount, reason, supportingSelfDrives: supporting };
    })
    .sort((a, b) => b.amount - a.amount);

  // ============================================================
  // 6) partnerIdeal: RAW clamped to 0..5 (after caps)
  // ============================================================
  const partnerIdeal = emptyDriveVector(0);
  (driveNames as DriveName[]).forEach((d) => {
    const v = n((partnerRaw as any)[d]);
    (partnerIdeal as any)[d] = clamp(v, 0, 5);
  });

  // ============================================================
  // 7) Rows + Bars (displayScore scaled so max bar is 5)
  // ============================================================
  const rowsUnranked: PartnerDriveRow[] = (driveNames as DriveName[]).map((d) => ({
    drive: d,
    rank: 0,
    rawDemand: n((partnerRaw as any)[d]),
    idealScore: clamp(n((partnerIdeal as any)[d]), 0, 5),
    displayScore: 0,
  }));

  const maxIdeal = Math.max(...rowsUnranked.map((r) => n(r.idealScore)), 0);
  rowsUnranked.forEach((r) => {
    const ds = maxIdeal > 1e-9 ? (n(r.idealScore) / maxIdeal) * 5 : 0;
    r.displayScore = clamp(ds, 0, 5);
  });

  const rows = rowsUnranked.slice().sort((a, b) => {
    if (b.displayScore !== a.displayScore) return b.displayScore - a.displayScore;
    return b.rawDemand - a.rawDemand;
  });
  rows.forEach((r, idx) => (r.rank = idx + 1));

  const bars: PartnerDriveBar[] = rows.map((r) => ({
    drive: r.drive,
    displayScore: r.displayScore,
    rawScore: r.idealScore,
    pct: clamp01(r.displayScore / 5),
  }));

  // ============================================================
  // 8) Summary
  // ============================================================
  const totalRawDemand = rows.reduce((acc, r) => acc + r.rawDemand, 0);
  const topRow = rows[0] ?? null;

  // ============================================================
  // 9) Partner-drive insights (fixed scripts)
  // ============================================================
  const partnerDriveInsights: PartnerDriveInsight[] = rows.map((r) => {
    const entry = PARTNER_DRIVE_SCRIPT_KEYS[r.drive];
    return {
      partnerDrive: r.drive,
      scriptKey: entry.scriptKey,
      innateSupport: entry.innateSupport,
      surfaceSupport: entry.surfaceSupport,
      noteKeys: entry.noteKeys,
    };
  });

  const model: IdealPartnerProfileUIModel = {
    selfSurface,
    selfInnate,
    surfaceWeight,
    innateWeight,

    partnerRawUncapped,
    partnerRaw,
    partnerIdeal,

    supportLinks,
    valueSupportLinks,
    valueRequirements,

    partnerDriveInsights,

    rows,
    bars,

    summary: {
      totalRawDemand,
      topDrive: topRow?.drive ?? null,
      topIdealScore: topRow?.idealScore ?? 0,
      topDisplayScore: topRow?.displayScore ?? 0,
    },

    partnerCaps,
    partnerCapMeta,
  };

  if (debug) {
    model.bySource = { blockNames, partnerNeedByBlock, valueNeedByBlock };
  }

  return model;
}
