"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AuthHeader } from '@/components/AuthHeader';

type PersonaTab = "public" | "private" | "innate" | "report";
type MessageKey = "welcome" | PersonaTab;

interface WindowSize {
  width: number;
  height: number;
}

const personaConfigs: {
  key: PersonaTab;
  label: string;
  bg: string;
  logo: string;
  borderColor: string;
  textColor: string;
  href: string;
  title: string;
  description: string;
  panelBorder: string; 
  titleColor: string; 
}[] = [
  {
    key: "public",
    label: "Public Persona",
    bg: "#93a97c", // Sage
    logo: "/PublicPersonaLogo.png?v=1",
    borderColor: "#FFFFFF",
    textColor: "#FFFFFF",
    href: "/tests/public-persona",
    title: "What is your Public Persona?",
    description: "Your Public Persona reflects how you present yourself to others—your visible roles and impression management.",
    panelBorder: "border-[#93a97c]",
    titleColor: "text-[#93a97c]",
  },
  {
    key: "private",
    label: "Private Persona",
    bg: "#7c94be", // Muted Blue
    logo: "/PrivatePersonaLogo.png?v=1",
    borderColor: "#FFFFFF",
    textColor: "#FFFFFF",
    href: "/tests/private-persona",
    title: "What is your Private Persona?",
    description: "Your Private Persona captures your inner experiences and self-concept—how you understand yourself privately.",
    panelBorder: "border-[#7c94be]",
    titleColor: "text-[#7c94be]",
  },
  {
    key: "innate",
    label: "Innate Persona",
    bg: "#684c9bff", // Dusty Purple
    logo: "/InnatePersonaLogo.png?v=1",
    borderColor: "#FFFFFF",
    textColor: "#FFFFFF",
    href: "/tests/innate-persona",
    title: "What is your Innate Persona?",
    description: "Your Innate Persona reflects stable and intrinsic aspects—such as temperament and baseline emotional tone.",
    panelBorder: "border-[#8f6899]",
    titleColor: "text-[#8f6899]",
  },
  {
    key: "report",
    label: "Final Report",
    bg: "#c77b84", // Rosewood
    logo: "/ReportLogo.jpg?v=2", // Cache buster added here
    borderColor: "#FFFFFF",
    textColor: "#FFFFFF",
    href: "/reports/overall",
    title: "Integrated Persona Report",
    description: "The Integrated Persona Report combines results from all three persona tests into one coherent summary.",
    panelBorder: "border-[#c77b84]",
    titleColor: "text-[#c77b84]",
  },
];

const welcomeConfig = {
  key: "welcome" as const,
  title: "Welcome to PersonaDriveSecrets",
  description: "Each of us moves through life with multiple personas. Explore how they fit together into a whole picture of you.",
  panelBorder: "border-slate-400", // Neutral mediating color
  titleColor: "text-slate-600",
};

export default function HomePage() {
  const [messageKey, setMessageKey] = useState<MessageKey>("welcome");
  const [windowSize, setWindowSize] = useState<WindowSize | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const width = windowSize?.width ?? 1024;
  const height = windowSize?.height ?? 768;
  const isPortrait = height > width;
  const isVerySmall = width < 480;

  let panelHeightPx: number | undefined;
  if (windowSize) {
    const fraction = isPortrait ? 0.28 : 0.35;
    panelHeightPx = Math.round(Math.max(220, Math.min(height * fraction, 420)));
  }

  const activeConfig = messageKey === "welcome" 
    ? welcomeConfig 
    : personaConfigs.find((p) => p.key === messageKey) ?? welcomeConfig;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-600 font-sans">
      <AuthHeader />

      <main className="mx-auto max-w-6xl px-4 py-8">
        
        {/* TOP PANEL */}
        <section
          className={`mb-6 rounded-2xl bg-white p-8 shadow-sm border-t-4 transition-colors duration-500 ${activeConfig.panelBorder}`}
          style={{ height: panelHeightPx ? `${panelHeightPx}px` : "auto" }}
        >
          <div className="flex h-full flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
              Persona Analysis System
            </span>
            <h2 className={`text-2xl font-bold mb-3 ${activeConfig.titleColor}`}>
              {activeConfig.title}
            </h2>
            <p className="text-slate-500 leading-relaxed max-w-2xl">
              {activeConfig.description}
            </p>
          </div>
        </section>

        {/* BOTTOM PANEL */}
        <section
          className={`rounded-2xl bg-white p-8 shadow-sm border-t-4 transition-colors duration-500 ${activeConfig.panelBorder}`}
          style={{ height: panelHeightPx ? `${panelHeightPx}px` : "auto" }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Select a Module to Start
              </span>
              <span className={`text-xs font-bold uppercase ${activeConfig.titleColor}`}>
                {messageKey === 'welcome' ? 'Dashboard' : messageKey}
              </span>
            </div>

            <div
              className={`grid flex-1 gap-6 ${isVerySmall ? 'grid-cols-1' : isPortrait ? 'grid-cols-2' : 'grid-cols-4'}`}
              onMouseLeave={() => setMessageKey("welcome")}
            >
              {personaConfigs.map(({ key, label, bg, logo, borderColor, textColor, href }) => (
                <div
                  key={key}
                  className="flex flex-col items-center justify-between rounded-xl p-5 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  style={{ backgroundColor: bg }}
                  onMouseEnter={() => setMessageKey(key)}
                >
                  <span className="text-[10px] font-black uppercase text-white/80 tracking-widest">
                    {label}
                  </span>

                  <div className="relative h-12 w-12 my-2">
                    <Image src={logo} alt={label} fill className="object-contain" unoptimized />
                  </div>

                  <Link href={href} className="w-full">
                    <button
                      className="w-full rounded-lg py-2 text-[10px] font-bold uppercase tracking-tighter transition-all hover:bg-white/10"
                      style={{ border: `1.5px solid ${borderColor}`, color: textColor }}
                    >
                      Initialize Test
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}