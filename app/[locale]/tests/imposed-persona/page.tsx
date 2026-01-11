"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthHeader } from "@/components/AuthHeader";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";

type AnswerValue = 0 | 1 | 2 | 3 | 4 | 5;

interface Question {
  id: number;
}

const QUESTIONS: Question[] = Array.from({ length: 21 }, (_, i) => ({ id: i + 1 }));

type Locale = "en" | "zh";

type LoadState = "idle" | "no-user" | "loaded" | "missing" | "error";

type ImposedPersonaRow = {
  id: number;
  created_at: string;
  updated_at: string;
  user_id: string;

  q1_answer: number;
  q2_answer: number;
  q3_answer: number;
  q4_answer: number;
  q5_answer: number;
  q6_answer: number;
  q7_answer: number;
  q8_answer: number;
  q9_answer: number;
  q10_answer: number;
  q11_answer: number;
  q12_answer: number;
  q13_answer: number;
  q14_answer: number;
  q15_answer: number;
  q16_answer: number;
  q17_answer: number;
  q18_answer: number;
  q19_answer: number;
  q20_answer: number;
  q21_answer: number;
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isWithin30Days(ts: string | null | undefined) {
  if (!ts) return false;
  const d = new Date(ts);
  const t = d.getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= THIRTY_DAYS_MS;
}

function clampAnswer(v: any): AnswerValue {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 5) return 5;
  return n as AnswerValue;
}

function buildEmptyAnswers() {
  return QUESTIONS.reduce((acc, q) => {
    acc[q.id] = 0 as AnswerValue;
    return acc;
  }, {} as Record<number, AnswerValue>);
}

function rowToAnswers(row: ImposedPersonaRow): Record<number, AnswerValue> {
  const out: Record<number, AnswerValue> = {};
  for (let i = 1; i <= 21; i++) {
    // @ts-expect-error dynamic key is safe here
    out[i] = clampAnswer(row[`q${i}_answer`]);
  }
  return out;
}

function answersToPayload(answers: Record<number, AnswerValue>) {
  const payload: Record<string, number> = {};
  for (let i = 1; i <= 21; i++) {
    payload[`q${i}_answer`] = Number(answers[i] ?? 0);
  }
  return payload;
}

export default function PublicPersonaTestPage() {
  const router = useRouter();
  const params = useParams();
  const locale: Locale = (typeof params?.locale === "string" ? params.locale : "en") as Locale;

  const t = useTranslations("tests.imposed");
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const themeColor = "#93a97c";

  const [answers, setAnswers] = useState<Record<number, AnswerValue>>(() => buildEmptyAnswers());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [incompleteMessage, setIncompleteMessage] = useState<string | null>(null);

  // Load state
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [latestRow, setLatestRow] = useState<ImposedPersonaRow | null>(null);

  const withLocale = (href: string) => {
    if (!href) return `/${locale}`;
    if (href.startsWith("http") || href.startsWith("mailto:")) return href;
    if (href.startsWith(`/${locale}`)) return href;
    if (href.startsWith("/")) return `/${locale}${href}`;
    return `/${locale}/${href}`;
  };

  const handleAnswerSelect = (questionId: number, value: number) => {
    setIncompleteMessage(null);
    setSaveMessage(null);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: clampAnswer(value),
    }));
  };

  // 1) LOAD: fetch latest record for current user; populate answers if exists
  useEffect(() => {
    let cancelled = false;

    async function loadLatest() {
      setLoadState("idle");
      setLoadError(null);

      try {
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (userErr) {
          setLoadState("error");
          setLoadError(userErr.message);
          setLatestRow(null);
          return;
        }

        if (!user) {
          setLoadState("no-user");
          setLatestRow(null);
          // keep default answers
          return;
        }

        const { data, error } = await supabase
          .from("imposed-persona")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (cancelled) return;

        if (error) {
          setLoadState("error");
          setLoadError(error.message);
          setLatestRow(null);
          return;
        }

        const row = (data?.[0] as ImposedPersonaRow | undefined) ?? null;
        if (!row) {
          setLoadState("missing");
          setLatestRow(null);
          return;
        }

        setLatestRow(row);
        setAnswers(rowToAnswers(row));
        setLoadState("loaded");
      } catch (e: any) {
        if (cancelled) return;
        setLoadState("error");
        setLoadError(e?.message ?? "Failed to load previous responses.");
        setLatestRow(null);
      }
    }

    loadLatest();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const hasMissing = useMemo(() => QUESTIONS.some((q) => answers[q.id] === 0), [answers]);

  // 2) SAVE: if latest within 30 days => update it, else insert new row
  const handleSaveToServer = async () => {
    if (isSubmitting) return;

    setSaveMessage(null);
    setIncompleteMessage(null);

    if (hasMissing) {
      setIncompleteMessage(t("incomplete"));
      return;
    }

    setIsSubmitting(true);

    try {
      // ensure user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let activeUser = user;
      if (!activeUser) {
        const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously();
        if (anonErr) throw anonErr;
        activeUser = anonData?.user ?? null;
      }
      if (!activeUser) throw new Error("Unable to identify user session.");

      // re-fetch latest row to avoid stale state
      const { data: latestData, error: latestErr } = await supabase
        .from("imposed-persona")
        .select("*")
        .eq("user_id", activeUser.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (latestErr) throw latestErr;

      const latest = (latestData?.[0] as ImposedPersonaRow | undefined) ?? null;
      const payload = answersToPayload(answers);
      const nowIso = new Date().toISOString();

      if (latest && isWithin30Days(latest.created_at)) {
        // UPDATE latest row
        const { error: updErr } = await supabase
          .from("imposed-persona")
          .update({
            ...payload,
            updated_at: nowIso,
          })
          .eq("id", latest.id)
          .eq("user_id", activeUser.id);

        if (updErr) throw updErr;
      } else {
        // INSERT new row
        const { error: insErr } = await supabase.from("imposed-persona").insert({
          user_id: activeUser.id,
          ...payload,
          // created_at defaults to now(); updated_at defaults to now()
          // but it's fine to set updated_at explicitly too
          updated_at: nowIso,
        });

        if (insErr) throw insErr;
      }

      // refresh local latest state by fetching again
      const { data: newLatestData, error: newLatestErr } = await supabase
        .from("imposed-persona")
        .select("*")
        .eq("user_id", activeUser.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (newLatestErr) throw newLatestErr;

      const newLatest = (newLatestData?.[0] as ImposedPersonaRow | undefined) ?? null;
      if (newLatest) {
        setLatestRow(newLatest);
        setAnswers(rowToAnswers(newLatest));
        setLoadState("loaded");
      } else {
        // should not happen, but handle gracefully
        setLatestRow(null);
        setLoadState("missing");
      }

      router.refresh();
      setSaveMessage(t("saved"));
    } catch (error: any) {
      console.error("Save failed:", error);
      alert(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      <AuthHeader />

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* compact header */}
        <section className="mb-8 border-b-2 pb-5" style={{ borderColor: themeColor }}>
          <h1 className="text-xl font-black uppercase tracking-tight" style={{ color: themeColor }}>
            {t("title")}
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-medium italic">{t("subtitle")}</p>

          {/* optional tiny load status (useful while debugging) */}
          <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {loadState === "loaded" && latestRow ? (
              <span>
                Loaded last saved:{" "}
                <span className="text-slate-600">{new Date(latestRow.created_at).toLocaleString()}</span>
              </span>
            ) : loadState === "missing" ? (
              <span>No previous saved record found.</span>
            ) : loadState === "no-user" ? (
              <span>Not signed in yet (will create anonymous session on Save).</span>
            ) : loadState === "error" ? (
              <span className="text-rose-600">Load error: {loadError ?? "unknown"}</span>
            ) : null}
          </div>
        </section>

        {/* tighter list spacing */}
        <div className="space-y-6">
          {QUESTIONS.map((q) => {
            const isUnselected = answers[q.id] === 0;

            return (
              <div key={q.id} className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 overflow-hidden">
                <p className="mb-3 text-sm font-semibold text-slate-800 leading-snug">
                  Q{q.id}: {t(`q${q.id}`)}
                </p>

                <div className="flex items-center justify-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase w-14 text-right leading-tight shrink-0 tracking-wider">
                    {t("disagree")}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleAnswerSelect(q.id, num)}
                        className={`h-9 w-9 rounded-full border-2 font-black transition-all flex items-center justify-center text-sm
                          ${
                            answers[q.id] === num
                              ? "text-white scale-110 shadow-md"
                              : "bg-white border-slate-200 text-slate-300 hover:border-slate-400"
                          }`}
                        style={{
                          backgroundColor: answers[q.id] === num ? themeColor : "",
                          borderColor: answers[q.id] === num ? themeColor : "",
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <span className="text-[9px] font-black text-slate-400 uppercase w-14 text-left leading-tight shrink-0 tracking-wider">
                    {t("agree")}
                  </span>

                  <span
                    className={`hidden sm:inline text-[9px] italic w-24 text-right ${
                      isUnselected ? "text-slate-400" : "text-slate-400 opacity-0 pointer-events-none select-none"
                    }`}
                  >
                    {t("noSelection")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* footer: compact buttons */}
        <div className="mt-12 flex flex-col items-center gap-3">
          {saveMessage ? <p className="text-sm font-semibold text-emerald-600">{saveMessage}</p> : null}
          {incompleteMessage ? <p className="text-sm font-semibold text-rose-600">{incompleteMessage}</p> : null}

          <div className="grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-3">
            <Link
              href={withLocale("/")}
              className="rounded-xl py-3 text-center font-bold border-2 transition-all active:scale-95 uppercase tracking-widest text-xs"
              style={{ borderColor: themeColor, color: themeColor }}
            >
              {t("back")}
            </Link>

            <button
              type="button"
              onClick={handleSaveToServer}
              disabled={isSubmitting}
              className="rounded-xl py-3 text-center font-black text-white shadow-lg transition-all active:scale-95 disabled:bg-slate-300 uppercase tracking-widest text-xs"
              style={{ backgroundColor: themeColor }}
            >
              {isSubmitting ? t("saving") : t("save")}
            </button>

            <Link
              href={withLocale("/tests/surface-persona")}
              className="rounded-xl py-3 text-center font-bold border-2 transition-all active:scale-95 uppercase tracking-widest text-xs"
              style={{ borderColor: themeColor, color: themeColor }}
            >
              {t("next")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}