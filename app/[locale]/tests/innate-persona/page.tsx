"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthHeader } from "@/components/AuthHeader";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";

type AnswerValue = 0 | 1 | 2 | 3 | 4 | 5;

const QUESTIONS = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 },
  { id: 6 },
  { id: 7 },
  { id: 8 },
  { id: 9 },
  { id: 10 },
  { id: 11 },
  { id: 12 },
  { id: 13 },
  { id: 14 },
  { id: 15 },
  { id: 16 },
  { id: 17 },
] as const;

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

function isWithin30Days(createdAt: string | null | undefined) {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= DAYS_30_MS;
}

export default function InnatePersonaPage() {
  const router = useRouter();
  const params = useParams();
  const locale = typeof (params as any)?.locale === "string" ? (params as any).locale : "en";
  const t = useTranslations("tests.innate");
  const supabase = createBrowserSupabaseClient();

  const themePurple = "#5d5aa6";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [incompleteMessage, setIncompleteMessage] = useState<string | null>(null);

  // Flags for previous record load
  const [recordKnown, setRecordKnown] = useState(false);
  const [recordExists, setRecordExists] = useState(false);
  const [recordLoadError, setRecordLoadError] = useState<string | null>(null);

  // Store the latest row metadata for “update vs insert”
  const [latestRowId, setLatestRowId] = useState<number | null>(null);
  const [latestCreatedAt, setLatestCreatedAt] = useState<string | null>(null);

  const withLocale = (href: string) => {
    if (!href) return `/${locale}`;
    if (href.startsWith("http") || href.startsWith("mailto:")) return href;
    if (href.startsWith(`/${locale}`)) return href;
    if (href.startsWith("/")) return `/${locale}${href}`;
    return `/${locale}/${href}`;
  };

  const emptyAnswers = useMemo(() => {
    const base: Record<number, AnswerValue> = {};
    QUESTIONS.forEach((q) => (base[q.id] = 0));
    return base;
  }, []);

  const [answers, setAnswers] = useState<Record<number, AnswerValue>>(emptyAnswers);

  const handleAnswerSelect = (id: number, val: number) => {
    setIncompleteMessage(null);
    setAnswers((prev) => ({ ...prev, [id]: val as AnswerValue }));
  };

  // Fetch latest record (if any) and populate answers
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setRecordKnown(false);
      setRecordLoadError(null);
      setRecordExists(false);
      setLatestRowId(null);
      setLatestCreatedAt(null);

      try {
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (userErr) {
          if (!cancelled) {
            setRecordLoadError(userErr.message);
            setRecordKnown(true);
          }
          return;
        }

        if (!user) {
          // Not signed in yet; don’t create anon session on load.
          if (!cancelled) {
            setAnswers(emptyAnswers);
            setRecordExists(false);
            setRecordKnown(true);
          }
          return;
        }

        const { data, error } = await supabase
          .from("innate-persona")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          if (!cancelled) {
            setRecordLoadError(error.message);
            setRecordExists(false);
            setRecordKnown(true);
          }
          return;
        }

        if (!data) {
          if (!cancelled) {
            setAnswers(emptyAnswers);
            setRecordExists(false);
            setRecordKnown(true);
          }
          return;
        }

        // Populate answers from row
        const next: Record<number, AnswerValue> = { ...emptyAnswers };
        for (const q of QUESTIONS) {
          const key = `q${q.id}_answer`;
          const v = Number((data as any)[key]);
          next[q.id] = (Number.isFinite(v) ? v : 0) as AnswerValue;
        }

        if (!cancelled) {
          setAnswers(next);
          setRecordExists(true);
          setLatestRowId((data as any).id ?? null);
          setLatestCreatedAt((data as any).created_at ?? null);
          setRecordKnown(true);
        }
      } catch (e: any) {
        if (!cancelled) {
          setRecordLoadError(e?.message ?? "Unknown error");
          setRecordKnown(true);
          setRecordExists(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, emptyAnswers]);

  const handleSave = async () => {
    if (isSubmitting) return;

    const hasMissing = QUESTIONS.some((q) => answers[q.id] === 0);
    if (hasMissing) {
      setSaveMessage(null);
      setIncompleteMessage(t("incomplete"));
      return;
    }

    setIsSubmitting(true);
    setSaveMessage(null);
    setIncompleteMessage(null);

    try {
      // Ensure we have a user (anonymous sign-in happens ONLY on save)
      let {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;

      if (!user) {
        const { error: anonErr } = await supabase.auth.signInAnonymously();
        if (anonErr) throw anonErr;

        const again = await supabase.auth.getUser();
        user = again.data.user ?? null;
      }

      if (!user) throw new Error("No user session available.");

      // Authoritative fetch latest row again (avoid stale flags)
      const { data: latest, error: latestErr } = await supabase
        .from("innate-persona")
        .select("id,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestErr) throw latestErr;

      const nowIso = new Date().toISOString();

      // Build payload of answers
      const payload: Record<string, any> = {
        user_id: user.id,
        updated_at: nowIso,
      };
      for (const q of QUESTIONS) {
        payload[`q${q.id}_answer`] = answers[q.id];
      }

      // Update within 30 days; otherwise insert a new row
      if (latest?.id && isWithin30Days(latest.created_at)) {
        const { error: updErr } = await supabase
          .from("innate-persona")
          .update(payload)
          .eq("id", latest.id);

        if (updErr) throw updErr;

        setRecordExists(true);
        setLatestRowId(latest.id);
        setLatestCreatedAt(latest.created_at ?? null);
      } else {
        payload.created_at = nowIso;
        const { data: ins, error: insErr } = await supabase
          .from("innate-persona")
          .insert(payload)
          .select("id,created_at")
          .single();

        if (insErr) throw insErr;

        setRecordExists(true);
        setLatestRowId((ins as any)?.id ?? null);
        setLatestCreatedAt((ins as any)?.created_at ?? nowIso);
      }

      router.refresh();
      setSaveMessage(t("saved"));
    } catch (e: any) {
      console.error("Submission error:", e);
      alert(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24 font-sans">
      <AuthHeader />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-8 border-b-2 pb-5" style={{ borderColor: themePurple }}>
          <h1 className="text-xl font-black uppercase tracking-tight" style={{ color: themePurple }}>
            {t("title")}
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-medium italic">{t("subtitle")}</p>

          {/* No hardcoded English text to keep zh clean; flags kept for logic/diagnostics */}
          {/* If you want a UI indicator later, we can add i18n keys. */}
        </header>

        <div className="space-y-6">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <h2 className="text-sm font-semibold text-slate-800 mb-3 text-left leading-snug">
                Q{q.id}: {t(`q${q.id}`)}
              </h2>

              <div className="flex items-center justify-between gap-6 mb-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{t("disagree")}</span>
                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: themePurple }}>
                  {t("agree")}
                </span>
              </div>

              <div className="flex w-full h-1 mb-4 rounded-full overflow-hidden opacity-60">
                <div className="flex-1 bg-gradient-to-r from-slate-500 to-slate-200" />
                <div className="flex-1 bg-gradient-to-r from-slate-200" style={{ backgroundColor: themePurple }} />
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{t("disagree")}</span>

                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleAnswerSelect(q.id, num)}
                        className={`h-9 w-9 rounded-full border-2 font-black transition-all flex items-center justify-center text-sm ${
                          answers[q.id] === num
                            ? "text-white scale-110 shadow-md"
                            : "border-slate-200 text-slate-300 hover:border-slate-400"
                        }`}
                        style={answers[q.id] === num ? { backgroundColor: themePurple, borderColor: themePurple } : {}}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: themePurple }}>
                    {t("agree")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3">
          {saveMessage ? <p className="text-sm font-semibold text-emerald-600">{saveMessage}</p> : null}
          {incompleteMessage ? <p className="text-sm font-semibold text-rose-600">{incompleteMessage}</p> : null}

          <div className="grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-3">
            <Link
              href={withLocale("/tests/surface-persona")}
              className="rounded-xl py-3 text-center font-bold border-2 transition-all active:scale-95 uppercase tracking-widest text-xs"
              style={{ borderColor: themePurple, color: themePurple }}
            >
              {t("prev")}
            </Link>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="rounded-xl py-3 text-center font-black text-white shadow-lg transition-all active:scale-95 disabled:bg-slate-300 uppercase tracking-widest text-xs"
              style={{ backgroundColor: themePurple }}
            >
              {isSubmitting ? t("saving") : t("save")}
            </button>

            <Link
              href={withLocale("/reports/overall")}
              className="rounded-xl py-3 text-center font-bold border-2 transition-all active:scale-95 uppercase tracking-widest text-xs"
              style={{ borderColor: themePurple, color: themePurple }}
            >
              {t("next")}
            </Link>
          </div>
        </div>

        {/* Internal flags retained (not displayed); helpful for debugging */}
        {/* recordKnown={String(recordKnown)} recordExists={String(recordExists)} recordLoadError={recordLoadError} */}
      </main>
    </div>
  );
}