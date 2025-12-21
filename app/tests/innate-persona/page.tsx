"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitTestData } from '@/app/actions';
import { AuthHeader } from '@/components/AuthHeader';
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";

type AnswerValue = 0 | 1 | 2 | 3 | 4 | 5;

const QUESTIONS = [
  { id: 1, text: "I would choose to explore new ideas, even if doing so does not guarantee strong accomplishments." },
  { id: 2, text: "I would choose to explore new ideas, even if it limits my ability to influence important decisions." },
  { id: 3, text: "I would choose to explore new ideas, even when it is not especially relaxing or comfortable." },
  { id: 4, text: "I would choose to explore new ideas, even if it does not allow me to stay connected with my peers." },
  { id: 5, text: "I would choose to explore new ideas, even if it reduces my sense of connection with people who matter to me." },
  { id: 6, text: "I would choose to explore new ideas, even if they do not fully align with the moral values I hold." },
  { id: 7, text: "I would support my peers, even if it means having less time for comfort or relaxation." },
  { id: 8, text: "I would seek roles where I influence important decisions, even if this reduces the time I can devote to people important to me." },
  { id: 9, text: "I would continue focusing on producing meaningful results, even when doing do prevent me from spending time with people I care." },
  { id: 10, text: "I would stay closely connected with peers, even if doing so limits the time I can dedicate to achieving clear accomplishments." },
  { id: 11, text: "I would choose to influence important decisions, even if that weakens some of my relationships." },
  { id: 12, text: "I would stay connected with people important to me, even when that reduces my time for relaxation or enjoyment." },
  { id: 13, text: "I would work toward valuable achievements, even when doing so limits my ability to fully act according to my moral beliefs." },
  { id: 14, text: "I would take on roles that allow me to influence important decisions, even if that prevent me from acting according to my moral values." },
  { id: 15, text: "I would stay committed to my moral values, even when this requires giving up comfort or enjoyment." },
  { id: 16, text: "I would focus on achiving goals, even when this requires giving up comfort or enjoyment." }

];

export default function InnatePersonaPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const themePurple = "#2e1065"; // Deep Purple Theme

  const [answers, setAnswers] = useState<Record<number, AnswerValue>>(
    () => QUESTIONS.reduce((acc, q) => ({ ...acc, [q.id]: 0 }), {})
  );

  // 1. Logic to populate answers within a month
  useEffect(() => {
    async function loadLastRecord() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('innate-persona')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        const lastDate = new Date(data.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Only populate if the record is newer than 30 days
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

  const getButtonStyles = (num: number, isActive: boolean) => {
    if (isActive) return `bg-[${themePurple}] border-[${themePurple}] text-white scale-110 shadow-[0_0_25px_rgba(76,29,149,0.5)]`;
    
    switch (num) {
      case 1: return 'border-[#1e1b4b] text-[#1e1b4b] hover:bg-indigo-50';
      case 2: return 'border-indigo-200 text-indigo-300 hover:bg-indigo-50';
      case 3: return 'border-slate-200 text-slate-400 hover:bg-slate-50';
      case 4: return 'border-purple-200 text-purple-300 hover:bg-purple-50';
      case 5: return 'border-[#4c1d95] text-[#4c1d95] hover:bg-purple-50';
      default: return 'border-slate-200 text-slate-300';
    }
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const dataToSend: Record<string, number> = {};
    Object.entries(answers).forEach(([id, val]) => {
      dataToSend[`q${id}_answer`] = val;
    });

    try {
      const result = await submitTestData('innate-persona', dataToSend);
      if (result?.success) {
        router.refresh();
        router.push('/reports/innate-persona');
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
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 pb-32">
      <AuthHeader />

      <main className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-20 border-l-8 pl-10 py-8 bg-white shadow-[20px_20px_60px_-15px_rgba(0,0,0,0.05)] rounded-r-[2rem]" style={{ borderColor: themePurple }}>
          <h1 className="text-3xl font-black uppercase tracking-[0.4em]" style={{ color: themePurple }}>Innate Persona</h1>
          <p className="text-slate-400 text-xs mt-3 font-bold uppercase tracking-[0.2em] opacity-70">
            The fundamental architecture of your core instinct.
          </p>
        </header>

        <div className="space-y-20">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="group relative p-12 rounded-[3.5rem] border border-slate-100 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_30px_70px_rgba(46,16,101,0.08)] transition-all duration-700">
              
              <div className="flex items-start gap-4 mb-12">
                <span className="text-sm font-black mt-1 tracking-tighter opacity-20" style={{ color: themePurple }}>0{q.id}—</span>
                <h2 className="text-xl font-extrabold text-[#020617] leading-tight tracking-tight max-w-2xl">
                  {q.text}
                </h2>
              </div>

              <div className="flex w-full h-1.5 mb-14 rounded-full overflow-hidden">
                <div className="flex-1 bg-gradient-to-r from-[#1e1b4b] via-indigo-100 to-[#f1f5f9]" />
                <div className="flex-1 bg-gradient-to-r from-[#f1f5f9] via-purple-200 to-[#4c1d95]" />
              </div>

              <div className="flex flex-col items-center">
                <div className="w-full flex justify-between items-center px-2">
                  
                  <div className="w-24 text-left">
                    <span className="text-[10px] font-black uppercase text-[#1e1b4b] tracking-[0.2em] leading-tight block opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                      Strongly<br />Disagree
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-5">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleAnswerSelect(q.id, num)}
                        className={`h-14 w-14 rounded-full border-2 font-black transition-all duration-300 flex items-center justify-center text-xl
                          ${answers[q.id] === num 
                            ? 'text-white scale-110 shadow-lg' 
                            : 'border-slate-200 text-slate-300 hover:border-slate-400'}
                        `}
                        style={answers[q.id] === num ? { backgroundColor: themePurple, borderColor: themePurple } : {}}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <div className="w-24 text-right">
                    <span className="text-[10px] font-black uppercase text-[#4c1d95] tracking-[0.2em] leading-tight block opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                      Strongly<br />Agree
                    </span>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- NAVIGATION FOOTER --- */}
        <div className="mt-28 flex flex-col items-center gap-6">
          
          {/* TOP ROW: Save Response (Directs to Innate Report) */}
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full max-w-md py-6 text-white rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-xl hover:brightness-110 transition-all active:scale-95 disabled:bg-slate-300"
            style={{ backgroundColor: themePurple }}
          >
            {isSubmitting ? 'SECURING RESPONSES...' : 'SAVE RESPONSE'}
          </button>

          {/* LOWER ROW: Return to Dashboard (Hollow/Bordered Style) */}
          <Link 
            href="/" 
            className="w-full max-w-md py-4 bg-transparent border-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all text-center hover:bg-slate-50 active:scale-95" 
            style={{ borderColor: themePurple, color: themePurple }}
          >
            Return to Dashboard
          </Link>
          
        </div>
      </main>
    </div>
  );
}