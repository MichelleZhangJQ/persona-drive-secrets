"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { AuthHeader } from "@/components/AuthHeader";
import PromoCodeInput from "@/components/PromoCodeInput";
import { MessageKey, configDescriptions } from "@/lib/dashboard/dashboard-constants";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function HomePage() {
  const supabase = createBrowserSupabaseClient();

  const [messageKey, setMessageKey] = useState<MessageKey>("welcome");
  const [windowHeight, setWindowHeight] = useState<number>(800);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);

  const [profile, setProfile] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser?.email) {
        const profileRes = await supabase
          .from("profiles")
          .select("*")
          .ilike("email", authUser.email.trim().toLowerCase())
          .maybeSingle();

        if (profileRes.data) setProfile(profileRes.data);
      }
    } catch (err) {
      console.error("Initialization Error:", err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fetchData]);

  // ✅ FIX: ensure `active` is never undefined (avoid crashes when messageKey is not found)
  const active = useMemo(() => {
    const keys = Object.keys(configDescriptions || {}) as MessageKey[];
    const fallbackKey = keys[0] || ("welcome" as MessageKey);
    const fallback = (configDescriptions as any)?.[fallbackKey] ?? {
      title: "",
      description: "",
      color: "text-slate-900",
    };
    return (configDescriptions as any)?.[messageKey] ?? fallback;
  }, [messageKey]);

  const fraction = isPortrait ? 0.25 : 0.28;
  const panelHeightPx = Math.round(Math.max(200, Math.min(windowHeight * fraction, 380)));
  const personaSteps = [
    {
      key: "imposed",
      label: "Imposed Persona",
      tag: "Environment",
      logo: "/SurfacePersonaLogo.png?v=1",
      href: "/tests/imposed-persona",
    },
    {
      key: "surface",
      label: "Surface Persona",
      tag: "Daily Strategy",
      logo: "/ImposedPersonaLogo.png?v=1",
      href: "/tests/surface-persona",
    },
    {
      key: "innate",
      label: "Innate Persona",
      tag: "Baseline",
      logo: "/InnatePersonaLogo.png?v=1",
      href: "/tests/innate-persona",
    },
    {
      key: "report",
      label: "Overall Report",
      tag: "Summary",
      logo: "/ReportLogo.jpg?v=2",
      href: "/reports/overall",
    },
  ] as const;

  const premiumReports = [
    {
      key: "jung-analysis",
      label: "Jung Personality Trait Analysis",
      tag: "Free Report",
      description: "Are your Surface and Innate persona identical? Open the report for detailed analysis.",
      isFree: true,
      accessField: null,
    },
    {
      key: "relationship",
      label: "Ideal Relationship Analysis",
      tag: "Premium Report 01",
      description: "What is the drive profile of your ideal partner? Open the report to find out more.",
      isFree: false,
      accessField: "has_access_report_1",
    },
    {
      key: "drain-analysis",
      label: "Energy Drain and Adaptation Analysis",
      tag: "Premium Report 02",
      description: "Do you feel that your efforts are wasted sometimes? Open the report to learn about your energy draining points.",
      isFree: false,
      accessField: "has_access_report_2",
    },
    {
      key: "profession-fit",
      label: "Occupation Analysis",
      tag: "Premium Report 03",
      description: "Identify occupations that fit your drive profiles.",
      isFree: false,
      accessField: "has_access_report_3",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-600 font-sans flex flex-col">
      <AuthHeader />

      <main className="mx-auto max-w-6xl px-4 py-8 flex-grow">
        {/* DYNAMIC TOP PANEL */}
        <section
          className={`mb-10 rounded-2xl bg-white/70 backdrop-blur-md p-8 shadow-sm border border-slate-200/60 transition-all duration-500 flex flex-col justify-center`}
          style={{ height: `${panelHeightPx}px` }}
        >
          <div className="flex h-full flex-col justify-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
              Information Dashboard
            </span>
            <h2
              className={`text-3xl font-bold mb-3 transition-colors duration-500 ${
                active?.color ?? "text-slate-900"
              }`}
            >
              {active.title}
            </h2>
            <p className="text-slate-500 leading-relaxed max-w-2xl text-sm md:text-base font-medium">
              {active.description}
            </p>
          </div>
        </section>

        {/* CORE PERSONA PROGRESS */}
        <section className="mb-14">
          <div className="flex items-center mb-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 mr-4">
              Take Tests & Get Summary
            </h3>
            <div className="h-[1px] bg-slate-200 flex-1"></div>
          </div>
          <div
            className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm relative"
            onMouseLeave={() => setMessageKey("welcome")}
          >
            <div className="hidden md:block absolute left-10 right-10 top-10 h-px bg-slate-200"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
              {personaSteps.map((step, idx) => (
                <Link
                  key={step.key}
                  href={step.href}
                  onMouseEnter={() => setMessageKey(step.key)}
                  className="group flex flex-col items-center text-center"
                >
                  <div className="relative z-10 h-12 w-12 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center transition group-hover:scale-105">
                    <Image src={step.logo} alt={step.label} fill className="object-contain p-2" unoptimized />
                  </div>
                  <div className="mt-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Step {idx + 1}
                  </div>
                  <div className="text-[12px] font-semibold text-slate-700">{step.tag}</div>
                  <div className="text-sm font-black text-slate-900">{step.label}</div>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-[12px] text-slate-500 font-medium">
              Start with Imposed, then Surface and Innate, then view your Summary Report.
            </div>
          </div>
        </section>

        {/* PREMIUM ANALYSIS SECTION */}
        <section className="mb-14">
          <div className="flex items-center mb-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500/60 mr-4">
              Premium Analysis{" "}
            </h3>
            <div className="h-[1px] bg-slate-200 flex-1"></div>
          </div>
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
              {premiumReports.map((report) => {
                const isFree = report.isFree === true;
                const isUnlocked = isFree || (report.accessField ? profile?.[report.accessField] === true : false);
                const href = isFree || isUnlocked ? `/reports/${report.key}` : `/payment?report=${report.key}`;

                return (
                  <Link
                    key={report.key}
                    href={href}
                    className="w-full max-w-[340px] rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    onMouseEnter={() => setMessageKey("welcome")}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700">
                        {report.tag}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                          isFree ? "text-emerald-700" : isUnlocked ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        {isFree ? "Free" : isUnlocked ? "Access Granted" : "Locked"}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 mb-2 tracking-tight">{report.label}</h4>
                    <p className="text-[12px] text-slate-600 leading-relaxed font-semibold mb-5">
                      {report.description}
                    </p>

                    <div
                      className={`w-full rounded-xl py-2.5 text-center text-[10px] font-black uppercase tracking-widest border transition ${
                        isFree || isUnlocked
                          ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                          : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      }`}
                    >
                      {isFree ? "Free Access" : isUnlocked ? "Open Report" : "Unlock Access — $3.99"}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* PROMO REDEMPTION & BALANCE SECTION (MOVED TO BOTTOM) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Current Balance</p>
            <p className="text-3xl font-bold text-slate-900">${(profile?.store_credits || 0).toFixed(2)}</p>
          </div>
          <div className="lg:col-span-2">
            <PromoCodeInput onRefresh={fetchData} />
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Persona Drive Secrets</h4>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                Advanced psychological mapping of innate drives vs. behavioral persona. Premium reports are available for{" "}
                <strong>$3.99 per individual unlock</strong>.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Legal</h4>
              <nav className="flex flex-col space-y-2 text-[12px]">
                <Link href="/terms" className="hover:text-rose-900 transition-colors">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="hover:text-rose-900 transition-colors">
                  Privacy Policy
                </Link>
              </nav>
            </div>
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Support</h4>
              <p className="text-[12px] text-slate-500">Contact team:</p>
              <a
                href="mailto:support@persona-drive-secrets.com"
                className="text-[12px] font-bold text-rose-900 underline underline-offset-4"
              >
                support@persona-drive-secrets.com
              </a>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-[10px] text-slate-400 uppercase tracking-widest font-black">
            <p>© {new Date().getFullYear()} Persona Drive Secrets.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
