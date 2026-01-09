"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type TestType = "imposed-persona" | "surface-persona" | "innate-persona";
type TestData = Record<string, number | string>;

function getTargetTable(testType: TestType): string {
  switch (testType) {
    case "imposed-persona":
      return "imposed-persona";
    case "surface-persona":
      return "surface-persona";
    case "innate-persona":
      return "innate-persona";
    default:
      throw new Error(`Invalid test type: ${testType}`);
  }
}

export async function submitTestDataClient(testType: TestType, data: TestData) {
  const supabase = createBrowserSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  let activeUser = user;
  if (userError || !activeUser?.id) {
    const { data: anonData } = await supabase.auth.signInAnonymously();
    activeUser = anonData?.user ?? null;
  }

  if (!activeUser?.id) {
    return { success: false, message: "no_user" };
  }

  const targetTable = getTargetTable(testType);

  const { data: existingRecords } = await supabase
    .from(targetTable)
    .select("id, created_at")
    .eq("user_id", activeUser.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const latestRecord = existingRecords?.[0];
  const nowIso = new Date().toISOString();
  const dataToSave = { user_id: activeUser.id, updated_at: nowIso, ...data };

  const ONE_MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;
  const nowUtc = new Date().getTime();

  let shouldOverwrite = false;

  if (latestRecord) {
    const lastSubmissionUtc = new Date(latestRecord.created_at).getTime();
    const timeDiff = nowUtc - lastSubmissionUtc;
    if (timeDiff < ONE_MONTH_IN_MS && timeDiff >= 0) {
      shouldOverwrite = true;
    }
  }

  let opError;

  if (shouldOverwrite && latestRecord) {
    const { error } = await supabase.from(targetTable).update(dataToSave).eq("id", latestRecord.id);
    opError = error;
  } else {
    const { error } = await supabase.from(targetTable).insert([dataToSave]);
    opError = error;
  }

  if (opError) {
    console.error("Database Error:", opError);
    return { success: false, message: opError.message };
  }

  return { success: true };
}
