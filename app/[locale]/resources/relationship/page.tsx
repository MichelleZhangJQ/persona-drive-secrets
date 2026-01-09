// app/resources/relationship/page.tsx
"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthHeader } from "@/components/AuthHeader";
import { HeartHandshake, BookOpen } from "lucide-react";

type DriveName =
  | "Care"
  | "Exploration"
  | "Affiliation"
  | "Value"
  | "Achievement"
  | "Dominance"
  | "Pleasure";

type RefItem = {
  id: string; // e.g. "R1"
  label: string; // short label
  citation: string; // human readable
  href?: string; // optional
};

type DriveCard = {
  drive: DriveName;
  subtitle: string;
  watermark: string;
  concepts: string[]; // chips
  how: string[];
  evidence: { text: string; refs: string[] }[]; // refs by id
};

export default function RelationshipResourcesPage() {
  const pathname = usePathname();

  const navItems = useMemo(
    () => [
      { label: "Dashboard", href: "/" },
      { label: "Theories", href: "/theories" },
      { label: "Resources", href: "/resources" },
    ],
    []
  );

  const references: RefItem[] = useMemo(
    () => [
      {
        id: "R1",
        label: "Responsiveness / intimacy",
        citation:
          "Reis, H. T., & Shaver, P. (1988/2018). Intimacy as an interpersonal process (disclosure + perceived partner responsiveness).",
        href: "https://www.taylorfrancis.com/chapters/edit/10.4324/9780203732496-5/intimacy-interpersonal-process-harry-reis-phillip-shaver",
      },
      {
        id: "R2",
        label: "Diary test of intimacy model",
        citation:
          "Laurenceau, J.-P., Barrett, L. F., & Pietromonaco, P. R. (1998). Event-contingent diary tests of disclosure + responsiveness and intimacy.",
        href: "https://www.affective-science.org/pubs/1998/LaurenFBPl1998.pdf",
      },
      {
        id: "R3",
        label: "Need to belong",
        citation:
          "Baumeister, R. F., & Leary, M. R. (1995). The need to belong: Desire for interpersonal attachments as a fundamental human motivation.",
        href: "https://persweb.wabash.edu/facstaff/hortonr/articles%20for%20class/baumeister%20and%20leary.pdf",
      },
      {
        id: "R4",
        label: "Self-expansion",
        citation:
          "Aron, A., & Aron, E. N. (1996). Self and self-expansion in relationships (chapter).",
        href: "https://www.taylorfrancis.com/chapters/edit/10.4324/9781315806631-16/self-self-expansion-relationships-arthur-aron-elaine-aron",
      },
      {
        id: "R5",
        label: "Self-expansion overview",
        citation:
          "Lewandowski, G. W., & Aron, A. (overview). The self-expansion model of motivation and cognition in close relationships (chapter PDF).",
        href: "https://www.researchgate.net/profile/Gary-Lewandowski-Jr/publication/284143380_The_self-expansion_model_of_motivation_and_cognition_in_close_relationships/links/5bbf7449458515a7a9e28df3/The-self-expansion-model-of-motivation-and-cognition-in-close-relationships.pdf",
      },
      {
        id: "R6",
        label: "SDT needs in relationships",
        citation:
          "La Guardia, J. G., Ryan, R. M., Couchman, C. E., & Deci, E. L. (2000). Need satisfaction (autonomy/relatedness/competence) and relationship functioning.",
        href: "https://www.sweetstudy.com/files/2000_laguardiaryancouchdeci.pdf",
      },
      {
        id: "R7",
        label: "Autonomy support",
        citation:
          "Deci, E. L., & Ryan, R. M. (self-determination theory); and close-relationship need satisfaction syntheses (chapter PDF).",
        href: "https://link.springer.com/content/pdf/10.1007/978-94-017-8542-6_3",
      },
      {
        id: "R8",
        label: "Communal strength",
        citation:
          "Mills, J., Clark, M. S., Ford, T. E., & Johnson, M. (2004). Measurement of communal strength (responsiveness motivation).",
        href: "https://clarkrelationshiplab.yale.edu/sites/default/files/files/Measurement%20in%20communal%20strength.pdf",
      },
      {
        id: "R9",
        label: "Thriving support",
        citation:
          "Feeney, B. C., & Collins, N. L. (2015). Thriving through relationships: Support in adversity and in growth.",
        href: "https://www.ucsbcrlab.com/uploads/4/3/4/7/43470485/feeneycollins%282015%29currentopinion.pdf",
      },
      {
        id: "R10",
        label: "Michelangelo phenomenon",
        citation:
          "Drigotas, S. M., Rusbult, C. E., Wieselquist, J., & Whitton, S. W. (1999). Close partner as sculptor of the ideal self (Michelangelo phenomenon).",
        href: "https://faculty.wcas.northwestern.edu/eli-finkel/documents/69_DrigotasRusbultWieselquistWhitton1999_JournalOfPersonalityAndSocialPsychology.pdf",
      },
      {
        id: "R11",
        label: "Capitalization",
        citation:
          "Gable, S. L., Reis, H. T., Impett, E. A., & Asher, E. R. (2004). Active-constructive responses to good news and relationship well-being.",
        href: "https://www.sas.rochester.edu/psy/people/faculty/reis_harry/assets/pdf/GableReisImpettAsher_2004.pdf",
      },
      {
        id: "R12",
        label: "Power dynamics",
        citation:
          "Körner, R., & Schütz, A. (2021). Power in romantic relationships: Positional/experienced power and relationship quality.",
        href: "https://journals.sagepub.com/doi/pdf/10.1177/02654075211017670",
      },
      {
        id: "R13",
        label: "Demand–withdraw pattern",
        citation:
          "Christensen, A., & Heavey, C. L. (1990). Gender and social structure in the demand/withdraw pattern of marital conflict.",
        href: "https://europepmc.org/article/MED/2213491",
      },
      {
        id: "R14",
        label: "Equity / fairness",
        citation:
          "Hatfield (Walster), E., Walster, G. W., & Berscheid, E. (1978) and later equity research in intimate relations (Springer chapter overview).",
        href: "https://link.springer.com/chapter/10.1007/978-1-4612-5044-9_5",
      },
      {
        id: "R15",
        label: "Sexual communal strength",
        citation:
          "Muise, A., Impett, E. A., Kogan, A., & Desmarais, S. (2013). Keeping the spark alive: Sexual communal strength and desire.",
        href: "https://www.researchgate.net/profile/Amy-Muise/publication/230800303_Keeping_the_Spark_Alive/links/0912f50489ccfcd4a2000000/Keeping-the-Spark-Alive.pdf",
      },
      {
        id: "R16",
        label: "Sexual autonomy support",
        citation:
          "Muise, A., et al. (2024). Perceived partner sexual autonomy support, need fulfillment, and satisfaction.",
        href: "https://journals.sagepub.com/doi/pdf/10.1177/01461672241279099",
      },
    ],
    []
  );

  const cards: DriveCard[] = useMemo(
    () => [
      {
        drive: "Care",
        watermark: "CARE",
        subtitle:
          "Feeling safe and supported. In couples research, this maps closely to perceived partner responsiveness and attachment-related security.",
        concepts: ["Responsiveness", "Emotional safety", "Repair"],
        how: [
          "Respond to bids quickly: acknowledge, validate, and follow through.",
          "Ask what kind of support is wanted (empathy vs advice vs action).",
          "Repair after ruptures: name what happened, take responsibility, reconnect.",
          "Be reliably available in high-stress moments (small consistency matters).",
        ],
        evidence: [
          { text: "Intimacy is strongly linked to disclosure followed by perceived partner responsiveness.", refs: ["R1", "R2"] },
          { text: "Communal responsiveness motivation predicts supportive behavior and relationship benefits.", refs: ["R8"] },
        ],
      },
      {
        drive: "Exploration",
        watermark: "GROW",
        subtitle:
          "Feeling free to try, learn, and expand. Often supported by self-expansion and autonomy-supportive behavior.",
        concepts: ["Self-expansion", "Autonomy support", "Novelty"],
        how: [
          "Do novel activities together (new places, hobbies, learning projects).",
          "Offer choices and curiosity; avoid pressure and guilt as “motivation.”",
          "Encourage identity growth: reduce obstacles, celebrate experiments.",
          "Revisit routines and agreements when life changes (keep flexibility explicit).",
        ],
        evidence: [
          { text: "Self-expansion research links novelty and growth to relationship well-being.", refs: ["R4", "R5"] },
          { text: "Autonomy/need satisfaction in relationships predicts better functioning and well-being.", refs: ["R6", "R7"] },
        ],
      },
      {
        drive: "Affiliation",
        watermark: "US",
        subtitle:
          "Feeling connected and included. This aligns with belongingness and stable, frequent positive interactions.",
        concepts: ["Belongingness", "Connection rituals", "Inclusion"],
        how: [
          "Build frequent low-friction connection (check-ins, routines, shared meals).",
          "Actively include each other in plans and decisions (no “last to know”).",
          "Use “us” language: shared jokes, traditions, and shared identity.",
          "Reduce chronic aversive interaction (tone matters as much as content).",
        ],
        evidence: [
          { text: "Belongingness emphasizes frequent, non-aversive interactions within stable bonds.", refs: ["R3"] },
          { text: "Responsiveness supports felt connection and intimacy in daily life.", refs: ["R1", "R2"] },
        ],
      },
      {
        drive: "Value",
        watermark: "ALIGN",
        subtitle:
          "Feeling aligned on priorities and standards: what matters, what’s fair, and how decisions should be made.",
        concepts: ["Shared standards", "Congruence", "Fairness"],
        how: [
          "Name non-negotiables early (ethics, money rules, family, boundaries).",
          "Translate values into behaviors (“respect” means what, day-to-day?).",
          "Create shared standards for decisions, commitments, and conflict rules.",
          "When values differ, negotiate tradeoffs instead of moralizing.",
        ],
        evidence: [
          { text: "Need satisfaction/autonomy support frameworks help explain alignment and well-being.", refs: ["R6", "R7"] },
          { text: "Equity/fairness research connects perceived justice to satisfaction/stability.", refs: ["R14"] },
        ],
      },
      {
        drive: "Achievement",
        watermark: "WIN",
        subtitle:
          "Feeling supported in goals and competence—encouraged, celebrated, and helped to grow.",
        concepts: ["Thriving support", "Capitalization", "Ideal-self support"],
        how: [
          "Be a secure base for growth: encourage challenges and reduce friction.",
          "Celebrate wins actively (“tell me more!”), not just politely.",
          "Coordinate goals and household load so ambition doesn’t become hidden conflict.",
          "Support the person they want to become (not just who they already are).",
        ],
        evidence: [
          { text: "Thriving through relationships distinguishes support in adversity vs support in growth.", refs: ["R9"] },
          { text: "Michelangelo phenomenon: partner affirmation predicts movement toward the ideal self.", refs: ["R10"] },
          { text: "Capitalization: active-constructive responses to good news predict relationship benefits.", refs: ["R11"] },
        ],
      },
      {
        drive: "Dominance",
        watermark: "POWER",
        subtitle:
          "Feeling respected in decisions and influence—without coercion, control, or chronic power struggles.",
        concepts: ["Power dynamics", "Demand–withdraw", "Fairness"],
        how: [
          "Make influence visible: define who decides what; revisit when it stops working.",
          "Use mutual-influence rules: leadership zones + veto zones + escalation rules.",
          "Watch demand–withdraw spirals: pause, take breaks, return with a concrete next step.",
          "Protect fairness in workload and decision-making so resentment doesn’t accumulate.",
        ],
        evidence: [
          { text: "Power dynamics (positional/experienced) relate to relationship quality.", refs: ["R12"] },
          { text: "Demand–withdraw interaction patterns are linked to poorer adjustment.", refs: ["R13"] },
          { text: "Equity/fairness research connects perceived justice with satisfaction/stability.", refs: ["R14"] },
        ],
      },
      {
        drive: "Pleasure",
        watermark: "PLAY",
        subtitle:
          "Feeling desire, enjoyment, sensuality, and play. Often supported by sexual communal motivation and sexual autonomy support.",
        concepts: ["Sexual communal strength", "Autonomy support", "Novelty"],
        how: [
          "Prioritize mutual responsiveness and curiosity (without scorekeeping).",
          "Make consent and choice central; reduce pressure so desire can be safe.",
          "Protect novelty with small experiments and playful routines.",
          "Normalize feedback and changing desire across seasons of life.",
        ],
        evidence: [
          { text: "Sexual communal strength predicts sustained desire in long-term relationships.", refs: ["R15"] },
          { text: "Perceived partner sexual autonomy support predicts sexual/relationship satisfaction.", refs: ["R16"] },
        ],
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <AuthHeader />

      {/* Nav (same style as /theories) */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap gap-2">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all ${
                  active
                    ? "bg-slate-900 text-white border-slate-900 shadow"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <section className="mb-10">
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-black uppercase italic text-slate-900 leading-none">
              Couple&apos;s Theory <span className="text-indigo-600">Resources</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-4">
              Research-backed patterns for satisfying each relationship drive
            </p>
          </div>

          <div className="mt-8 bg-indigo-50/50 border border-indigo-100 rounded-3xl p-8 md:p-10">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-indigo-700" />
              <div className="text-[11px] font-black uppercase tracking-widest text-indigo-900 italic">How to use</div>
            </div>
            <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
              Each card lists practical behaviors that tend to satisfy a drive, and points to well-known research threads
              behind those behaviors. Use this as a menu: pick 1–2 small experiments per week, then reflect on what
              actually helped.
            </p>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-6">
          {cards.map((c) => (
            <div
              key={`drive-${c.drive}`}
              id={c.drive.toLowerCase()}
              className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm relative overflow-hidden"
            >
              <div className="absolute -top-6 -right-6 text-[7rem] font-black italic text-slate-900/5 pointer-events-none select-none">
                {c.watermark}
              </div>

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow">
                      <HeartHandshake className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase italic text-slate-900 leading-none">{c.drive}</h2>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">
                        {c.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {c.concepts.map((x) => (
                      <span
                        key={`${c.drive}-chip-${x}`}
                        className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600"
                      >
                        {x}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 bg-slate-50 border border-slate-200 rounded-3xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-slate-700 mb-2">
                        How to satisfy
                      </div>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700/90 leading-relaxed font-medium">
                        {c.how.map((t, idx) => (
                          <li key={`${c.drive}-how-${idx}`}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-slate-700 mb-2">
                        Evidence threads
                      </div>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700/90 leading-relaxed font-medium">
                        {c.evidence.map((e, idx) => (
                          <li key={`${c.drive}-ev-${idx}`}>
                            {e.text}{" "}
                            <span className="text-slate-500">
                              {e.refs.map((rid) => (
                                <a
                                  key={`${c.drive}-${rid}`}
                                  href={`#${rid}`}
                                  className="font-black text-indigo-700 hover:underline"
                                >
                                  [{rid}]
                                </a>
                              ))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-[11px] text-slate-600 font-medium">
                  Jump:{" "}
                  <Link href="#references" className="font-black text-indigo-700 hover:underline">
                    References
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* References */}
        <section id="references" className="mt-12">
          <div className="rounded-[2.5rem] border-2 border-slate-200 bg-white p-8 md:p-10 shadow-sm">
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-700 mb-2">References</div>
            <p className="text-sm text-slate-700/90 leading-relaxed font-medium">
              These are starting points (mostly primary sources or PDFs). You can swap in your preferred editions/journals.
            </p>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Topic</th>
                    <th className="px-5 py-3">Citation</th>
                    <th className="px-5 py-3">Link</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {references.map((r) => (
                    <tr key={r.id} id={r.id} className="border-t border-slate-200 text-[11px] text-slate-700 font-medium">
                      <td className="px-5 py-4">
                        <strong className="uppercase">{r.id}</strong>
                      </td>
                      <td className="px-5 py-4">{r.label}</td>
                      <td className="px-5 py-4">{r.citation}</td>
                      <td className="px-5 py-4">
                        {r.href ? (
                          <a
                            href={r.href}
                            target="_blank"
                            rel="noreferrer"
                            className="font-black text-indigo-700 hover:underline"
                          >
                            Open
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-[11px] text-slate-600 font-medium leading-relaxed">
              Weekly usage suggestion: pick one drive, run one small experiment, then ask:
              <strong> “What fed this drive?”</strong> <span className="text-slate-400">·</span>
              <strong> “What drained it?”</strong> <span className="text-slate-400">·</span>
              <strong> “What’s the next tiny tweak?”</strong>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}