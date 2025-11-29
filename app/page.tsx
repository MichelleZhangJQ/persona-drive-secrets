"use client";

import { useState } from "react";
import Link from "next/link";

type PersonaTab = "public" | "private" | "innate" | "report";

export default function HomePage() {
  const [activePersona, setActivePersona] = useState<PersonaTab>("public");

  const personaLabel = {
    public: "Public Persona",
    private: "Private Persona",
    innate: "Innate Persona",
    report: "Report",
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              {/* Replace this with your logo image later */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold">
                PD
              </div>
              <span className="text-lg font-semibold tracking-tight">
                Persona Drive Secrets
              </span>
            </Link>
          </div>

          {/* Center: Top Tabs */}
          <nav className="hidden gap-6 text-sm font-medium md:flex">
            <Link href="/" className="hover:text-slate-900 text-slate-600">
              Tests
            </Link>
            <Link href="/theories" className="hover:text-slate-900 text-slate-600">
              Theories
            </Link>
            <Link href="/resources" className="hover:text-slate-900 text-slate-600">
              Resources
            </Link>
          </nav>

          {/* Right: Auth area */}
          <div className="flex items-center gap-3">
            {/* For now: pretend user is logged out */}
            <button
              className="rounded-full border px-4 py-1.5 text-sm font-medium hover:bg-slate-100"
            >
              Log in / Sign up
            </button>

            {/* Later: when logged in, show profile icon instead */}
            {/* <button className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-semibold">
              Y
            </button> */}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Persona progress bar / stepper */}
        <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
              <span>Persona Journey</span>
              <span>{personaLabel[activePersona]}</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  ["public", "Public Persona"],
                  ["private", "Private Persona"],
                  ["innate", "Innate Persona"],
                  ["report", "Report"],
                ] as [PersonaTab, string][]
              ).map(([key, label], idx) => {
                const isActive = activePersona === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActivePersona(key)}
                    className={[
                      "relative flex items-center justify-center rounded-full border px-3 py-2 text-xs font-semibold transition",
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[0.65rem]">
                      {idx + 1}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Content panel – changes based on persona selection */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          {activePersona === "public" && (
            <div>
              <h2 className="mb-2 text-xl font-semibold">Public Persona Tests</h2>
              <p className="text-sm text-slate-600">
                This section will host tests that measure how you present yourself
                to others: impression management, social roles, and public traits.
              </p>
              {/* Add test cards/components here */}
            </div>
          )}

          {activePersona === "private" && (
            <div>
              <h2 className="mb-2 text-xl font-semibold">Private Persona Tests</h2>
              <p className="text-sm text-slate-600">
                Tests here focus on your internal experiences, motivations,
                and self-concept that others may not see.
              </p>
            </div>
          )}

          {activePersona === "innate" && (
            <div>
              <h2 className="mb-2 text-xl font-semibold">Innate Persona Tests</h2>
              <p className="text-sm text-slate-600">
                This section explores more stable and intrinsic traits, such as
                temperament or core cognitive style.
              </p>
            </div>
          )}

          {activePersona === "report" && (
            <div>
              <h2 className="mb-2 text-xl font-semibold">Integrated Persona Report</h2>
              <p className="text-sm text-slate-600">
                Once users complete their tests, this area will generate an integrated
                report summarizing Public, Private, and Innate personas.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}