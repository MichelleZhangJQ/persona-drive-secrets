"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";
import { hasTesterAccess } from "@/lib/access-logic";

type Locale = "en" | "zh";

type CopyBlock = {
  title: { en: string; zh: string };
  subtitle: { en: string; zh: string };
  cta: { en: string; zh: string };
  note: { en: string; zh: string };
  statusActive: { en: string; zh: string };
  statusInactive: { en: string; zh: string };
  placeholder: { en: string; zh: string };
};

const COPY: CopyBlock = {
  title: { en: "Volunteer Tester Program", zh: "志愿测试者计划" },
  subtitle: {
    en: "Complete a short test pack to unlock 10 days of full access.",
    zh: "完成一套短测试包即可解锁 10 天游览权限。",
  },
  cta: { en: "Start Tester Pack", zh: "开始测试包" },
  note: {
    en: "Takes ~10-15 minutes. Optional. You can stop anytime.",
    zh: "约 10-15 分钟，可选参与，随时可以停止。",
  },
  statusActive: { en: "Tester access active until {date}.", zh: "测试者权限有效至 {date}。" },
  statusInactive: { en: "Tester access not active yet.", zh: "测试者权限尚未激活。" },
  placeholder: { en: "Tester Pack (Placeholder)", zh: "测试包（占位）" },
};

export default function TesterProgramPage() {
  const supabase = createBrowserSupabaseClient();
  const params = useParams();
  const locale: Locale =
    (typeof (params as any)?.locale === "string" ? (params as any).locale : "en") as Locale;

  const t = useMemo(() => {
    return (v: { en: string; zh: string }) => (locale === "zh" ? v.zh : v.en);
  }, [locale]);

  const withLocale = useCallback(
    (href: string) => {
      if (!href) return `/${locale}`;
      if (href.startsWith("http") || href.startsWith("mailto:")) return href;
      if (href.startsWith(`/${locale}`)) return href;
      if (href.startsWith("/")) return `/${locale}${href}`;
      return `/${locale}/${href}`;
    },
    [locale]
  );

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let activeUser = user;
      if (!activeUser) {
        const { data: anonData } = await supabase.auth.signInAnonymously();
        activeUser = anonData?.user ?? null;
      }

      if (!activeUser?.id) {
        if (active) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", activeUser.id)
        .maybeSingle();

      if (active) {
        setProfile(data ?? null);
        setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [supabase]);

  const testerActive = hasTesterAccess(profile);
  const expiresAt = profile?.access_expires_at ? new Date(profile.access_expires_at) : null;

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <AuthHeader />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">{t(COPY.title)}</h1>
          <p className="mt-3 text-sm text-slate-600 font-medium">{t(COPY.subtitle)}</p>
          <p className="mt-2 text-[11px] text-slate-500 font-medium">{t(COPY.note)}</p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              {testerActive
                ? t(COPY.statusActive).replace("{date}", expiresAt?.toLocaleDateString() ?? "--")
                : t(COPY.statusInactive)}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={withLocale("/tester/pack")}
              className="rounded-full bg-emerald-600 text-white px-5 py-2 text-[11px] font-black uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-colors"
            >
              {t(COPY.cta)}
            </Link>
            <span className="text-[11px] text-slate-500 font-medium">{t(COPY.placeholder)}</span>
          </div>

          {loading ? (
            <p className="mt-4 text-[11px] text-slate-400 font-medium">Loading...</p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
