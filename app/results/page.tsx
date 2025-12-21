import { createServerClientComponent } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthHeader } from "@/components/AuthHeader";

interface ResultsPageProps {
  searchParams: Promise<{ test?: string }>;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const currentTest = params.test || "public-persona";
  const supabase = createServerClientComponent();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. Logic: Verify existence in all three tables for the Progress Bar
  const [publicRes, privateRes, innateRes] = await Promise.all([
    supabase.from('public-persona').select('id').eq('user_id', user.id).limit(1),
    supabase.from('private-persona').select('id').eq('user_id', user.id).limit(1),
    supabase.from('innate-persona').select('id').eq('user_id', user.id).limit(1),
  ]);

  const completion = {
    'public-persona': (publicRes.data?.length ?? 0) > 0,
    'private-persona': (privateRes.data?.length ?? 0) > 0,
    'innate-persona': (innateRes.data?.length ?? 0) > 0,
  };

  // Determine if all tests are finished
  const allTestsComplete = completion['public-persona'] && completion['private-persona'] && completion['innate-persona'];

  // 2. Fetch data for the current test
  const { data: record } = await supabase
    .from(currentTest)
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // 3. Define Navigation Steps
  const steps = [
    { id: 'public-persona', label: 'Public Persona', path: '/tests/public-persona' },
    { id: 'private-persona', label: 'Private Persona', path: '/tests/private-persona' },
    { id: 'innate-persona', label: 'Innate Persona', path: '/tests/innate-persona' },
    { id: 'report', label: 'Final Report', path: '/report' },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentTest);
  const prevStep = currentIndex > 0 ? steps[currentIndex - 1] : null;
  const nextStep = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <AuthHeader />

      <main className="mx-auto max-w-5xl px-4 py-12">
        {/* --- PROGRESS BAR --- */}
        <div className="mb-10 flex items-center justify-between px-4">
          {steps.map((step, idx) => {
            const isCompleted = completion[step.id as keyof typeof completion] || (step.id === 'report' && allTestsComplete);
            const isCurrent = step.id === currentTest;

            return (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-2 relative flex-1">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all 
                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                      isCurrent ? 'border-[#FE994F] text-[#FE994F] bg-white ring-4 ring-orange-50' : 'bg-white border-slate-200 text-slate-400'}`}>
                    {isCompleted ? (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <span className="font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-tight ${isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-[2px] w-full -mt-6 ${isCompleted ? 'bg-green-500' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Step Complete</h1>
            <p className="text-slate-500 mt-2">Data saved for <span className="font-bold text-[#FE994F]">{steps[currentIndex].label}</span></p>
          </div>

          {/* --- STATUS BAR --- */}
          <section className="mb-12 bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 text-center">Current Submission Verification</h2>
            {record ? (
              <div className="overflow-x-auto">
                <div className="flex gap-2 min-w-max justify-center">
                  {Array.from({ length: 21 }).map((_, i) => {
                    const val = record[`q${i + 1}_answer`];
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <span className="text-[8px] font-bold text-slate-400">Q{i+1}</span>
                        <div className={`h-8 w-8 flex items-center justify-center rounded-md font-bold text-xs border ${val === 0 ? 'bg-white border-slate-200 text-slate-300' : 'bg-slate-800 border-slate-800 text-white'}`}>{val}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-400 italic">No record found.</p>
            )}
          </section>

          {/* --- NAVIGATION ACTIONS --- */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Previous Button */}
            <div>
              {prevStep ? (
                <Link href={prevStep.path} className="flex flex-col items-center justify-center w-full px-6 py-4 border-2 border-slate-200 text-slate-500 rounded-xl font-bold hover:bg-slate-50 transition-all text-center">
                  <span className="text-[10px] uppercase opacity-60">Go Back to</span>
                  {prevStep.label}
                </Link>
              ) : (
                <Link href="/" className="flex items-center justify-center w-full px-6 py-4 border-2 border-slate-200 text-slate-500 rounded-xl font-bold hover:bg-slate-50 transition-all">
                  Main Page
                </Link>
              )}
            </div>

            {/* Retake Current */}
            <Link href={`/tests/${currentTest}`} className="flex items-center justify-center px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">
              Retake Current Test
            </Link>

            {/* Next Button / Final Report Button */}
            {nextStep?.id === 'report' ? (
              <Link 
                href={allTestsComplete ? '/report' : '#'}
                className={`flex flex-col items-center justify-center px-6 py-4 rounded-xl font-bold transition-all shadow-lg 
                  ${allTestsComplete 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
              >
                <span className="text-[10px] uppercase opacity-80">View My</span>
                Final Report
              </Link>
            ) : (
              <Link 
                href={nextStep ? nextStep.path : '/report'}
                className="flex flex-col items-center justify-center px-6 py-4 bg-[#FE994F] text-white rounded-xl font-bold hover:bg-[#e47f32] transition-all shadow-lg active:scale-95"
              >
                <span className="text-[10px] uppercase opacity-80">Continue to</span>
                {nextStep ? nextStep.label : 'Final Report'}
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}