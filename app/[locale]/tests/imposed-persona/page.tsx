"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { submitTestDataClient } from "@/lib/core-utils/client-actions";
import { AuthHeader } from "@/components/AuthHeader";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";

type AnswerValue = 0 | 1 | 2 | 3 | 4 | 5;

interface Question {
  id: number;
}

const QUESTIONS: Question[] = [
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
  { id: 18 },
  { id: 19 },
  { id: 20 },
  { id: 21 },
];

export default function PublicPersonaTestPage() {
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";
  const t = useTranslations("tests.imposed");
  const supabase = createBrowserSupabaseClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const themeColor = "#93a97c";

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [incompleteMessage, setIncompleteMessage] = useState<string | null>(null);

  const withLocale = (href: string) => {
    if (!href) return `/${locale}`;
    if (href.startsWith("http") || href.startsWith("mailto:")) return href;
    if (href.startsWith(`/${locale}`)) return href;
    if (href.startsWith("/")) return `/${locale}${href}`;
    return `/${locale}/${href}`;
  };

  const [answers, setAnswers] = useState<Record<number, AnswerValue>>(() =>
    QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: 0 }), {})
  );

  // Populate selections based on the last record if it's < 30 days old
  useEffect(() => {
    async function loadLastRecord() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("imposed-persona")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        const lastDate = new Date(data.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (lastDate > thirtyDaysAgo) {
          const loadedAnswers: Record<number, AnswerValue> = {};
          QUESTIONS.forEach((q) => {
            loadedAnswers[q.id] = (data[`q${q.id}_answer`] || 0) as AnswerValue;
          });
          setAnswers(loadedAnswers);
        }
      }
    }
    loadLastRecord();
  }, [supabase]);

  const handleAnswerSelect = (questionId: number, value: number) => {
    setIncompleteMessage(null);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value as AnswerValue,
    }));
  };

  const handleSaveToServer = async () => {
    if (isSubmitting) return;

    const hasMissing = QUESTIONS.some((q) => answers[q.id] === 0);
    if (hasMissing) {
      setSaveMessage(null);
      setIncompleteMessage(t("incomplete"));
      return;
    }

    setIsSubmitting(true);

    const dataToSend: Record<string, number> = {};
    for (const id in answers) {
      dataToSend[`q${id}_answer`] = answers[Number(id)];
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        await supabase.auth.signInAnonymously();
      }

      const result = await submitTestDataClient("imposed-persona", dataToSend);

      if (result?.success) {
        router.refresh();
        setSaveMessage(t("saved"));
        setIncompleteMessage(null);
        setIsSubmitting(false);
      } else {
        console.error("Submission rejected:", result?.message);
        setIsSubmitting(false);
        alert(t("error"));
      }
    } catch (error: any) {
      console.error("Submission failed:", error);
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
        </section>

        {/* tighter list spacing */}
        <div className="space-y-6">
          {QUESTIONS.map((q) => {
            const isUnselected = answers[q.id] === 0;

            return (
              <div
                key={q.id}
                className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 overflow-hidden"
              >
                <p className="mb-3 text-sm font-semibold text-slate-800 leading-snug">
                  Q{q.id}: {t(`q${q.id}`)}
                </p>

                {/* IMPORTANT: keep layout stable by centering and reserving space for the hint */}
                <div className="flex items-center justify-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {/* fixed-width left label */}
                  <span className="text-[9px] font-black text-slate-400 uppercase w-14 text-right leading-tight shrink-0 tracking-wider">
                    {t("disagree")}
                  </span>

                  {/* buttons */}
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

                  {/* fixed-width right label */}
                  <span className="text-[9px] font-black text-slate-400 uppercase w-14 text-left leading-tight shrink-0 tracking-wider">
                    {t("agree")}
                  </span>

                  {/* reserved space so nothing jumps when selection changes */}
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