"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ensurePersonaDerived } from "@/lib/persona-derived/persona-derived";

type LatestTests = {
  imposed: any;
  surface: any;
  innate: any;
};

type UsePersonaDerivedResult = {
  loading: boolean;
  error: string | null;
  derived: any | null;
  latestTests: LatestTests | null;
  missingTests: Array<keyof LatestTests> | null;
  refresh: () => Promise<void>;
};

export function usePersonaDerived(): UsePersonaDerivedResult {
  const supabase = createBrowserSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [derived, setDerived] = useState<any | null>(null);
  const [latestTests, setLatestTests] = useState<LatestTests | null>(null);
  const [missingTests, setMissingTests] = useState<Array<keyof LatestTests> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

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
      setError("no_user");
      setDerived(null);
      setLatestTests(null);
      setMissingTests(null);
      setLoading(false);
      return;
    }

    try {
      const result = await ensurePersonaDerived({
        supabase,
        userId: activeUser.id,
      });

      if (result.status === "missing_tests") {
        setError("missing_tests");
        setDerived(null);
        setLatestTests(result.latestTests ?? null);
        setMissingTests((result.missingTests as Array<keyof LatestTests>) ?? null);
      } else {
        setDerived(result.derived ?? null);
        setLatestTests(result.latestTests ?? null);
        setMissingTests(null);
      }
    } catch (err) {
      console.error("Failed to load persona-derived:", err);
      setError("load_failed");
      setDerived(null);
      setLatestTests(null);
      setMissingTests(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    loading,
    error,
    derived,
    latestTests,
    missingTests,
    refresh: load,
  };
}
