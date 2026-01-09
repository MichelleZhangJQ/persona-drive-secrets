"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isAnonymousUser } from "@/lib/auth/isAnonymousUser";
import { AuthHeader } from "@/components/AuthHeader";

export default function UpgradePage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const params = useParams();
  const locale = typeof (params as any)?.locale === "string" ? (params as any).locale : "en";

  const withLocale = useMemo(() => {
    return (href: string) => `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
  }, [locale]);

  const [loading, setLoading] = useState(true);
  const [modeOk, setModeOk] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        router.push(withLocale("/login"));
        return;
      }

      if (!isAnonymousUser(user)) {
        router.push(withLocale("/"));
        return;
      }

      setModeOk(true);
      setLoading(false);
    })();
  }, [supabase, router, withLocale]);

  const upgrade = async () => {
    setErr(null);
    setMsg(null);

    if (!email || !password || password.length < 8) {
      setErr("Please enter a valid email and a password (8+ characters).");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ email, password });
      if (error) throw error;

      setMsg("Account saved. If email confirmation is enabled, please confirm via email.");
    } catch (e: any) {
      setErr(e?.message ?? "Upgrade failed.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm font-bold text-slate-500">Loading…</div>
      </div>
    );
  }

  if (!modeOk) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <main className="max-w-md mx-auto px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-black mb-2">Save your account</h1>
          <p className="text-sm text-slate-600 mb-6">
            This keeps your test results, orders, and report access across devices.
          </p>

          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Email</label>
          <input
            className="w-full border rounded-lg p-3 mt-2 mb-4 text-sm font-semibold"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Password</label>
          <input
            className="w-full border rounded-lg p-3 mt-2 mb-4 text-sm font-semibold"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8+ characters"
            type="password"
          />

          <button
            onClick={upgrade}
            className="w-full bg-emerald-600 text-white rounded-lg py-3 font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-colors"
          >
            Save Account
          </button>

          {msg ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-emerald-700">{msg}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Note: Some workplace email servers filter outside commercial messages. Try a personal
                email, and check both your inbox and spam/clutter folders for the confirmation email.
              </p>
            </div>
          ) : null}
          {err ? <p className="mt-4 text-sm text-rose-700">{err}</p> : null}
        </div>
      </main>
    </div>
  );
}
