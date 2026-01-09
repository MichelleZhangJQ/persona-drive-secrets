"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { submitTestDataClient } from '@/lib/core-utils/client-actions';
import { AuthHeader } from '@/components/AuthHeader';
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
  { id: 18 },
  { id: 19 },
  { id: 20 },
];
  

export default function SurfacePersonaPage() {
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";
  const t = useTranslations("tests.surface");
  const supabase = createBrowserSupabaseClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [incompleteMessage, setIncompleteMessage] = useState<string | null>(null);
  
  const themeBlue = "#5d7fc9";
  const withLocale = (href: string) => {
    if (!href) return `/${locale}`;
    if (href.startsWith("http") || href.startsWith("mailto:")) return href;
    if (href.startsWith(`/${locale}`)) return href;
    if (href.startsWith("/")) return `/${locale}${href}`;
    return `/${locale}/${href}`;
  };

  const [answers, setAnswers] = useState<Record<number, AnswerValue>>(
    () => QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: 0 }), {})
  );

  // Repopulation logic: Load records if < 30 days old
  useEffect(() => {
    async function loadLastRecord() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('surface-persona')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
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

  const handleAnswerSelect = (id: number, val: number) => {
    setIncompleteMessage(null);
    setAnswers(prev => ({ ...prev, [id]: val as AnswerValue }));
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    const hasMissing = QUESTIONS.some((q) => answers[q.id] === 0);
    if (hasMissing) {
      setSaveMessage(null);
      setIncompleteMessage(t("incomplete"));
      return;
    }
    setIsSubmitting(true);
    
    const dataToSend: Record<string, number> = {};
    Object.entries(answers).forEach(([id, val]) => {
      dataToSend[`q${id}_answer`] = val;
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        await supabase.auth.signInAnonymously();
      }

      const result = await submitTestDataClient('surface-persona', dataToSend);
      if (result?.success) {
        router.refresh();
        setSaveMessage(t("saved"));
        setIncompleteMessage(null);
      } else {
        setIsSubmitting(false);
        alert(t("error"));
      }
    } catch (e) {
      console.error("Submission error:", e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-24 font-sans">
      <AuthHeader />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-8 border-b-2 pb-5" style={{ borderColor: themeBlue }}>
          <h1 className="text-xl font-black uppercase tracking-tight" style={{ color: themeBlue }}>
            {t("title")}
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-medium italic">{t("subtitle")}</p>
        </header>

        <div className="space-y-6">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <h2 className="text-sm font-semibold text-slate-800 mb-3 text-left leading-snug">
                Q{q.id}: {t(`q${q.id}.prompt`)}
              </h2>

              <div className="flex justify-between items-start gap-8 mb-2">
                <div className="flex-1 text-left">
                  <p className="text-xs font-medium text-slate-700">
                    <span className="font-bold text-slate-400 uppercase text-[9px] block mb-1">{t("optionA")}</span>
                    {t(`q${q.id}.a`)}
                  </p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs font-medium text-slate-700">
                    <span className="font-bold uppercase text-[9px] block mb-1" style={{ color: themeBlue }}>
                      {t("optionB")}
                    </span>
                    {t(`q${q.id}.b`)}
                  </p>
                </div>
              </div>

              <div className="flex w-full h-1 mb-4 rounded-full overflow-hidden opacity-60">
                <div className="flex-1 bg-gradient-to-r from-slate-500 to-slate-200" />
                <div className="flex-1 bg-gradient-to-r from-slate-200" style={{ backgroundColor: themeBlue }} />
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{t("strongA")}</span>

                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleAnswerSelect(q.id, num)}
                        className={`h-9 w-9 rounded-full border-2 font-black transition-all flex items-center justify-center text-sm
                        ${
                          answers[q.id] === num
                            ? "text-white scale-110 shadow-md"
                            : "border-slate-200 text-slate-300 hover:border-slate-400"
                        }`}
                        style={answers[q.id] === num ? { backgroundColor: themeBlue, borderColor: themeBlue } : {}}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: themeBlue }}>
                    {t("strongB")}
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
              href={withLocale("/tests/imposed-persona")}
              className="rounded-xl py-3 text-center font-bold border-2 transition-all active:scale-95 uppercase tracking-widest text-xs"
              style={{ borderColor: themeBlue, color: themeBlue }}
            >
              {t("prev")}
            </Link>

            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="rounded-xl py-3 text-center font-black text-white shadow-lg transition-all active:scale-95 disabled:bg-slate-300 uppercase tracking-widest text-xs"
              style={{ backgroundColor: themeBlue }}
            >
              {isSubmitting ? t("saving") : t("save")}
            </button>

            <Link
              href={withLocale("/tests/innate-persona")}
              className="rounded-xl py-3 text-center font-bold border-2 transition-all active:scale-95 uppercase tracking-widest text-xs"
              style={{ borderColor: themeBlue, color: themeBlue }}
            >
              {t("next")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
