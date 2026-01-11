"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";

type Locale = "en" | "zh";

const ACCESS_DAYS = 10;

type CopyBlock = {
  title: { en: string; zh: string };
  subtitle: { en: string; zh: string };
  consent: { en: string; zh: string };
  action: { en: string; zh: string };
  done: { en: string; zh: string };
  error: { en: string; zh: string };
  back: { en: string; zh: string };
  placeholder: { en: string; zh: string };
};

const COPY: CopyBlock = {
  title: { en: "Tester Pack (Placeholder)", zh: "测试包（占位）" },
  subtitle: {
    en: "This page will host the tester pack. For now, use the button below to simulate completion.",
    zh: "这里将展示测试包内容。现在可用下面按钮模拟完成。",
  },
  consent: {
    en: "I understand this is voluntary and my data will be used in aggregate to improve reports.",
    zh: "我理解这是自愿参与，我的数据将用于汇总分析以改进报告。",
  },
  action: { en: "Complete Tester Pack", zh: "完成测试包" },
  done: { en: "Tester access activated for 10 days.", zh: "测试者权限已激活 10 天。" },
  error: { en: "Unable to activate tester access.", zh: "无法激活测试者权限。" },
  back: { en: "Back to Tester Program", zh: "返回测试者计划" },
  placeholder: { en: "Pseudo test page only.", zh: "仅为占位测试页面。" },
};

export default function TesterPackPage() {
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

  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");

  const completePack = async () => {
    if (!consent) return;
    setLoading(true);
    setStatus("idle");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let activeUser = user;
      if (!activeUser) {
        const { data: anonData } = await supabase.auth.signInAnonymously();
        activeUser = anonData?.user ?? null;
      }

      if (!activeUser?.id) throw new Error("no_user");

      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", activeUser.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!existingProfile) {
        setStatus("error");
        return;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + ACCESS_DAYS);

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: activeUser.id,
            access_level: "tester",
            access_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (error) throw error;

      setStatus("done");
    } catch (err) {
      console.error("Tester pack activation failed:", err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <AuthHeader />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">{t(COPY.title)}</h1>
          <p className="mt-3 text-sm text-slate-600 font-medium">{t(COPY.subtitle)}</p>
          <p className="mt-2 text-[11px] text-slate-500 font-medium">{t(COPY.placeholder)}</p>

          <label className="mt-6 flex items-start gap-3 text-[12px] text-slate-600 font-medium">
            <input
              type="checkbox"
              className="mt-1"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>{t(COPY.consent)}</span>
          </label>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={completePack}
              disabled={!consent || loading}
              className="rounded-full bg-emerald-600 text-white px-5 py-2 text-[11px] font-black uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? "..." : t(COPY.action)}
            </button>
            <Link
              href={withLocale("/tester")}
              className="text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-emerald-700"
            >
              {t(COPY.back)}
            </Link>
          </div>

          {status === "done" ? (
            <p className="mt-4 text-[11px] font-medium text-emerald-700">{t(COPY.done)}</p>
          ) : null}
          {status === "error" ? (
            <p className="mt-4 text-[11px] font-medium text-rose-600">{t(COPY.error)}</p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
