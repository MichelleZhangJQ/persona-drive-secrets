"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitTestData } from '@/app/actions';
import { AuthHeader } from '@/components/AuthHeader'; 
import { createBrowserSupabaseClient } from "@/lib/supabase/client"; 
import Link from "next/link";

type AnswerValue = 0 | 1 | 2 | 3 | 4 | 5;

interface Question {
  id: number;
  text: string;
}

const QUESTIONS: Question[] = [
  { id: 1, text: "My environment pushes me to explore new ideas." },
  { id: 2, text: "I can meet the expectation of exploring new ideas well." },
  { id: 3, text: "I wish I could put more effort into exploring new ideas." },
  { id: 4, text: "My environment pushes me to work toward clear goals and valuable outcomes." },
  { id: 5, text: "I can meet the expectation of pursuing clear and valuable outcomes well." },
  { id: 6, text: "I wish I could invest more effort into achieving concrete and valuable outcomes." },
  { id: 7, text: "My environment pushes me to be a decision maker." },
  { id: 8, text: "I can meet the expectation of taking responsibility for decisions well." },
  { id: 9, text: "I wish I could spend more effort on taking the lead or shaping decisions." },
  { id: 10, text: "My environment shares a culture that admires the pleasurable life style." },
  { id: 11, text: "I am in tune with this culture that admires a pleasurable life style." },
  { id: 12, text: "I would like to spend more time on enjoyable or pleasurable activities." },
  { id: 13, text: "My environment pushes me to care for or support people close to me." },
  { id: 14, text: "I can meet the expectation of caring and supporting people close to me well." },
  { id: 15, text: "I wish I could devote more time or effort to caring and supporting people who matter to me." },
  { id: 16, text: "My environment pushes me to maintain good relationships with peers." },
  { id: 17, text: "I can meet the expectation of maintaining good peer relationships well." },
  { id: 18, text: "I would like to put more effort into strengthening my relationships with peers." },
  { id: 19, text: "My environment pushes me to act in ways that reflect my beliefs." },
  { id: 20, text: "I can meet the expectation of acting in line with my beliefs well." },
  { id: 21, text: "I wish I could devote more time or energy to activities that align with my beliefs." },
];

export default function PublicPersonaTestPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient(); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const themeColor = "#93a97c"; 
  
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>(
    () => QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: 0 }), {})
  );

  // 1. Populate selections based on the last record if it's < 30 days old
  useEffect(() => {
    async function loadLastRecord() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('public-persona')
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

  const handleAnswerSelect = (questionId: number, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value as AnswerValue,
    }));
  };

  const handleSaveToServer = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const dataToSend: Record<string, number> = {};
    for (const id in answers) {
      dataToSend[`q${id}_answer`] = answers[Number(id)];
    }

    try {
        const result = await submitTestData('public-persona', dataToSend);
        
        // Check for success from the modified action.ts
        if (result?.success) {
            // Refresh ensure the Report page fetches the most recent data
            router.refresh();
            router.push('/reports/public-persona');
        } else {
            console.error("Submission rejected:", result?.message);
            setIsSubmitting(false);
            alert("Could not save responses. Please try again.");
        }
    } catch (error: any) {
        console.error("Submission failed:", error);
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <AuthHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="mb-8 rounded-2xl border-t-4 bg-white p-8 shadow-sm" style={{ borderColor: themeColor }}>
          <h1 className="mb-2 text-2xl font-bold" style={{ color: themeColor }}>
            Public Persona – Environmental Induced Drive Structure
          </h1>
          <p className="text-slate-600 text-sm italic">
            Your responses help visualize how your environment shapes your public-facing personality.
          </p>
        </section>

        <div className="space-y-4">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
              <p className="mb-4 text-base font-semibold text-slate-800">
                {q.id}. {q.text}
              </p>

              <div className="flex items-center justify-start gap-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase w-20 text-right leading-tight shrink-0">
                  Strongly <br/> Disagree
                </span>

                <div className="flex items-center gap-3 shrink-0">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleAnswerSelect(q.id, num)}
                      className={`h-11 w-11 rounded-full border-2 font-bold transition-all flex items-center justify-center ${
                        answers[q.id] === num
                          ? 'text-white scale-110 shadow-md'
                          : 'bg-white border-slate-300 text-slate-400 hover:border-slate-500 hover:text-slate-700'
                      }`}
                      style={{ 
                        backgroundColor: answers[q.id] === num ? themeColor : '',
                        borderColor: answers[q.id] === num ? themeColor : ''
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <span className="text-[10px] font-bold text-slate-400 uppercase w-20 text-left leading-tight shrink-0">
                  Strongly <br/> Agree
                </span>

                {answers[q.id] === 0 && (
                  <span className="text-[10px] text-slate-400 italic ml-auto">
                    (No selection)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleSaveToServer}
            disabled={isSubmitting}
            className="w-full max-w-md rounded-xl py-5 text-xl font-black text-white shadow-xl transition-all active:scale-95 disabled:bg-slate-300 uppercase tracking-widest"
            style={{ backgroundColor: themeColor }}
          >
            {isSubmitting ? 'SAVING...' : 'Save Responses'}
          </button>

          <Link 
            href="/" 
            className="w-full max-w-md rounded-xl py-4 text-center font-bold border-2 transition-all active:scale-95 uppercase tracking-widest text-sm"
            style={{ borderColor: themeColor, color: themeColor }}
          >
            Return to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}