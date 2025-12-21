"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitTestData } from '@/app/actions';
import { AuthHeader } from '@/components/AuthHeader';
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";

type AnswerValue = 0 | 1 | 2 | 3 | 4 | 5;

const QUESTIONS = [
  { id: 1, prompt: "Between the following two jobs, I would choose:", a: "a job that lets me explore new ideas", b: "a job that leads to clear and valuable rewards" },
  { id: 2, prompt: "Between the following two roles, I would choose:", a: "a role that allows me to explore unfamiliar ideas", b: "a role where I can shape decisions and influence outcomes" },
  { id: 3, prompt: "Between the following two lifestyles, I would choose:", a: "a lifestyle that gives me time to explore new ideas", b: "a lifestyle centered on enjoyable or relaxing activities" },
  { id: 4, prompt: "Between the following two paths, I would choose:", a: "a path that lets me explore new ideas", b: "a path focused on caring for people who matter to me" },
  { id: 5, prompt: "Between the following two lifestyles, I would choose:", a: "a lifestyle that allows me to explore new ideas freely", b: "a lifestyle that helps me maintain relationships with peers" },
  { id: 6, prompt: "Between the following two commitments, I would choose:", a: "pursuing new questions that interest me", b: "engaging in activities that align with my core beliefs" },
  { id: 7, prompt: "Between the following two paths, I would choose:", a: "a path where I am focused on caring for people important to me", b: "a path that focus on concrete, valuable achievements" },
  { id: 8, prompt: "Between the following two jobs, I would choose:", a: "a job that allow me time to care for people important to me", b: "a job where I make decisions" },
  { id: 9, prompt: "Between the following two lifestyles, I would choose:", a: "a lifestyle centered around caring for people important to me", b: "a lifestyle centered on enjoyable or relaxing activities" },
  { id: 10, prompt: "Between the following two commitments, I would choose:", a: "maintaining strong connections to friends and peers", b: "working toward clear rewards or achievements" },
  { id: 11, prompt: "Between the following two roles, I would choose:", a: "staying closely connected with peers", b: "taking charge and influencing outcomes" },
  { id: 12, prompt: "Between the following two lifestyles, I would choose:", a: "feeling close and connected with friends and peers", b: "enjoying a comfortable and relaxing lifestyle" },
  { id: 13, prompt: "Between the following two choices, I would choose:", a: "spending time on activities that promote my core beliefs", b: "working toward goals that bring clear rewards" },
  { id: 14, prompt: "Between the following two approaches, I would choose:", a: "staying loyal to my core beliefs", b: "taking charge and make decisions" },
  { id: 15, prompt: "Between the following two lifestyles, I would choose:", a: "expressing and acting on my values", b: "engaging in enjoyable or pleasurable activities" },
  { id: 16, prompt: "Between the following two lifestyles, I would choose:", a: "having an enjoyable life", b: "achiving goals and have a productive life" }
];

export default function PrivatePersonaPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const themeBlue = "#7c94be"; // Muted Blue Theme

  const [answers, setAnswers] = useState<Record<number, AnswerValue>>(
    () => QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: 0 }), {})
  );

  // Repopulation logic: Load records if < 30 days old
  useEffect(() => {
    async function loadLastRecord() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('private-persona')
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
    setAnswers(prev => ({ ...prev, [id]: val as AnswerValue }));
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const dataToSend: Record<string, number> = {};
    Object.entries(answers).forEach(([id, val]) => {
      dataToSend[`q${id}_answer`] = val;
    });

    try {
      const result = await submitTestData('private-persona', dataToSend);
      if (result?.success) {
        router.refresh();
        router.push('/reports/private-persona');
      } else {
        setIsSubmitting(false);
        alert("Failed to save. Please try again.");
      }
    } catch (e) {
      console.error("Submission error:", e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-32 font-sans">
      <AuthHeader />

      <main className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-12 border-b-2 pb-8" style={{ borderColor: themeBlue }}>
          <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: themeBlue }}>Private Persona Test</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">Reflecting on your internal world and private motivations.</p>
        </header>

        <div className="space-y-10">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="p-8 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <h2 className="text-base font-bold text-black mb-6 text-left leading-snug">
                Q{q.id}: {q.prompt}
              </h2>

              <div className="flex justify-between items-start gap-12 mb-3">
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-slate-700">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Option A</span>
                    {q.a}
                  </p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium text-slate-700">
                    <span className="font-bold uppercase text-[10px] block mb-1" style={{ color: themeBlue }}>Option B</span>
                    {q.b}
                  </p>
                </div>
              </div>

              <div className="flex w-full h-1.5 mb-8 rounded-full overflow-hidden opacity-60">
                <div className="flex-1 bg-gradient-to-r from-slate-400 to-slate-200" />
                <div className="flex-1 bg-gradient-to-r from-slate-200" style={{ backgroundColor: themeBlue }} />
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Strongly A</span>
                  
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleAnswerSelect(q.id, num)}
                        className={`h-11 w-11 rounded-full border-2 font-black transition-all flex items-center justify-center text-base
                          ${answers[q.id] === num 
                            ? 'text-white scale-110 shadow-lg' 
                            : 'border-slate-200 text-slate-300 hover:border-slate-400'}
                        `}
                        style={answers[q.id] === num ? { backgroundColor: themeBlue, borderColor: themeBlue } : {}}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: themeBlue }}>Strongly B</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- NAVIGATION FOOTER --- */}
        <div className="mt-20 flex flex-col items-center gap-6">
          
          {/* TOP ROW: Save Response (Primary Action) */}
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full max-w-md py-6 text-white rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-xl hover:brightness-110 transition-all active:scale-95 disabled:bg-slate-300"
            style={{ backgroundColor: themeBlue }}
          >
            {isSubmitting ? 'SECURING RESPONSES...' : 'SAVE RESPONSE'}
          </button>

          {/* LOWER ROW: Return to Dashboard (Hollow/Bordered) */}
          <Link 
            href="/" 
            className="w-full max-w-md py-4 bg-transparent border-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-center hover:bg-slate-50 active:scale-95" 
            style={{ borderColor: themeBlue, color: themeBlue }}
          >
            Return to Dashboard
          </Link>
          
        </div>
      </main>
    </div>
  );
}