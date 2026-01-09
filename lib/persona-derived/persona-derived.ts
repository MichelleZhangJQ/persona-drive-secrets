import {
  buildUserInstrumentationRoutes,
  calculateUserDriveDissatisfaction,
  computeInnateAvg,
  computeSurfaceAvg,
  driveNames,
  extractUserEnvCompetenceSelfInterest,
} from "@/lib/core-utils/fit-core";
import { determineJungProfile } from "@/lib/core-utils/jung-core";

export const PERSONA_DERIVED_VERSION = "2026-01-05.v1";

type SupabaseLike = {
  from: (table: string) => any;
};

type TestRows = {
  imposed: any | null;
  surface: any | null;
  innate: any | null;
};

type CoreVersions = {
  fitCoreVersion?: string;
  jungCoreVersion?: string;
};

export type DerivedUpsertPayload = {
  user_id: string;
  assessment_id?: string | null;
  source_imposed_at?: string | null;
  source_surface_at?: string | null;
  source_innate_at?: string | null;
  fit_core_version?: string | null;
  jung_core_version?: string | null;
  persona_derived_version?: string | null;
  imposed_env: Record<string, number>;
  imposed_competence: Record<string, number>;
  imposed_self_interest: Record<string, number>;
  td_dissatisfaction: Record<string, number>;
  td_satisfaction: Record<string, number>;
  surface_avg: Record<string, number>;
  innate_avg: Record<string, number>;
  instrument_paths: ReturnType<typeof buildUserInstrumentationRoutes>;
  jung_axes: ReturnType<typeof determineJungProfile>;
  derived_version: string;
  derived_at: string;
};

type NeedsUpdateParams = {
  existingDerived: any | null;
  latestTests: TestRows;
  coreVersions?: CoreVersions;
  requiredFields?: string[];
  force?: boolean;
};

export function needsPersonaDerivedUpdate(params: NeedsUpdateParams): {
  shouldUpdate: boolean;
  reasons: string[];
} {
  const { existingDerived, latestTests, coreVersions, requiredFields, force } = params;
  const reasons: string[] = [];

  if (force) {
    reasons.push("forced");
  }

  if (!existingDerived) {
    reasons.push("missing_derived");
  } else {
    const imposedId = latestTests.imposed?.updated_at ?? latestTests.imposed?.created_at ?? null;
    const surfaceId = latestTests.surface?.updated_at ?? latestTests.surface?.created_at ?? null;
    const innateId = latestTests.innate?.updated_at ?? latestTests.innate?.created_at ?? null;

    if (existingDerived.source_imposed_at !== imposedId) reasons.push("test_changed_imposed");
    if (existingDerived.source_surface_at !== surfaceId) reasons.push("test_changed_surface");
    if (existingDerived.source_innate_at !== innateId) reasons.push("test_changed_innate");

    if (coreVersions?.fitCoreVersion && existingDerived.fit_core_version !== coreVersions.fitCoreVersion) {
      reasons.push("fit_core_version_changed");
    }
    if (coreVersions?.jungCoreVersion && existingDerived.jung_core_version !== coreVersions.jungCoreVersion) {
      reasons.push("jung_core_version_changed");
    }
    const storedVersion = existingDerived.persona_derived_version ?? existingDerived.derived_version;
    if (storedVersion !== PERSONA_DERIVED_VERSION) {
      reasons.push("persona_derived_version_changed");
    }

    const required = requiredFields ?? [
      "surface_avg",
      "innate_avg",
      "imposed_env",
      "imposed_competence",
      "imposed_self_interest",
      "td_satisfaction",
      "jung_axes",
    ];

    required.forEach((field) => {
      if (!existingDerived?.[field]) {
        reasons.push(`missing_${field}`);
      }
    });

    if (!isValidDriveVector(existingDerived?.surface_avg)) reasons.push("invalid_surface_avg");
    if (!isValidDriveVector(existingDerived?.innate_avg)) reasons.push("invalid_innate_avg");
    if (!isValidDriveVector(existingDerived?.td_satisfaction)) reasons.push("invalid_td_satisfaction");
    if (!existingDerived?.jung_axes) reasons.push("missing_jung_axes");
  }

  return { shouldUpdate: reasons.length > 0, reasons };
}

export function computePersonaDerivedPayload(params: {
  userId: string;
  latestTests: TestRows;
  assessmentId?: string | null;
  coreVersions?: CoreVersions;
}): DerivedUpsertPayload {
  const { latestTests, userId, assessmentId, coreVersions } = params;
  const { imposed, surface, innate } = latestTests;

  const surface_avg = computeSurfaceAvg(surface);
  const innate_avg = computeInnateAvg(innate);

  const { env, competence, selfInterest } = extractUserEnvCompetenceSelfInterest(imposed);

  const td_dissatisfaction = calculateUserDriveDissatisfaction({
    env,
    competence,
    selfInterest,
  });
  const td_satisfaction = invertDissatisfaction(td_dissatisfaction);

  const instrument_paths = buildUserInstrumentationRoutes({
    innateData: innate,
    surfaceData: surface,
    imposedData: imposed,
  });

  const jung_axes = determineJungProfile({ innateData: innate, surfaceData: surface });

  return {
    user_id: userId,
    assessment_id: assessmentId ?? null,
    source_imposed_at: imposed?.updated_at ?? imposed?.created_at ?? null,
    source_surface_at: surface?.updated_at ?? surface?.created_at ?? null,
    source_innate_at: innate?.updated_at ?? innate?.created_at ?? null,
    fit_core_version: coreVersions?.fitCoreVersion ?? null,
    jung_core_version: coreVersions?.jungCoreVersion ?? null,
    persona_derived_version: PERSONA_DERIVED_VERSION,
    imposed_env: env,
    imposed_competence: competence,
    imposed_self_interest: selfInterest,
    td_dissatisfaction,
    td_satisfaction,
    surface_avg,
    innate_avg,
    instrument_paths,
    jung_axes,
    derived_version: PERSONA_DERIVED_VERSION,
    derived_at: new Date().toISOString(),
  };
}

export async function ensurePersonaDerived(params: {
  supabase: SupabaseLike;
  userId: string;
  force?: boolean;
  assessmentId?: string | null;
  coreVersions?: CoreVersions;
}): Promise<{
  status: "ok" | "missing_tests";
  derived?: any;
  latestTests?: TestRows;
  reasons?: string[];
  error?: string;
  missingTests?: Array<keyof TestRows>;
}> {
  const { supabase, userId, force, assessmentId, coreVersions } = params;

  const { data: existingDerived } = await supabase
    .from("persona_derived")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const [imposedRes, surfaceRes, innateRes] = await Promise.all([
    supabase
      .from("imposed-persona")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("surface-persona")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("innate-persona")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const imposed = imposedRes?.data ?? null;
  const surface = surfaceRes?.data ?? null;
  const innate = innateRes?.data ?? null;

  if (!imposed || !surface || !innate) {
    const missing: Array<keyof TestRows> = [];
    if (!imposed) missing.push("imposed");
    if (!surface) missing.push("surface");
    if (!innate) missing.push("innate");
    return { status: "missing_tests", latestTests: { imposed, surface, innate }, missingTests: missing };
  }

  const latestTests: TestRows = { imposed, surface, innate };

  const { shouldUpdate, reasons } = needsPersonaDerivedUpdate({
    existingDerived,
    latestTests,
    coreVersions,
    force,
  });

  if (!shouldUpdate && existingDerived) {
    return { status: "ok", derived: existingDerived, latestTests, reasons: [] };
  }

  const payload = computePersonaDerivedPayload({
    userId,
    latestTests,
    assessmentId,
    coreVersions,
  });

  const { data: upserted, error } = await supabase
    .from("persona_derived")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("persona_derived upsert failed:", error);
    return {
      status: "ok",
      derived: payload,
      latestTests,
      reasons: [...(reasons ?? []), "upsert_failed"],
      error: error?.message ?? "upsert_failed",
    };
  }

  return { status: "ok", derived: upserted ?? payload, latestTests, reasons };
}

function isValidDriveVector(value: any) {
  if (!value || typeof value !== "object") return false;
  return driveNames.every((name) => {
    const entry = value[name];
    return typeof entry === "number" && !Number.isNaN(entry);
  });
}

function invertDissatisfaction(dissatisfaction: Record<string, number>) {
  const out: Record<string, number> = {};
  driveNames.forEach((name) => {
    const value = Number(dissatisfaction?.[name] ?? 0);
    out[name] = 5 - value;
  });
  return out;
}
