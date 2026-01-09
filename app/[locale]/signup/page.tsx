"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";
import { isAnonymousUser } from "@/lib/auth/isAnonymousUser";

export default function SignupPage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const params = useParams();
  const locale = typeof (params as any)?.locale === "string" ? (params as any).locale : "en";

  const [loading, setLoading] = useState(true);
  const [isAnon, setIsAnon] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session && !isAnonymousUser(session.user)) {
        router.push(`/${locale}`);
        return;
      }
      setIsAnon(!!session && isAnonymousUser(session.user));
      setLoading(false);
    };
    checkSession();
  }, [supabase, router, locale]);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isAnonymousUser(user)) {
        await supabase.auth.signOut();
      }

      const redirectTo = `${window.location.origin}/${locale}/auth/callback?next=/login`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;

      setSuccessMsg("Check your email to confirm your account.");
    } catch (err: any) {
      setErrorMsg(err?.message || "Signup failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <AuthHeader />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex justify-center items-center h-full">
          <div className="w-full max-w-md p-8 rounded-xl shadow-lg bg-white">
            <h1 className="text-2xl font-semibold mb-6 text-center text-slate-800">
              Create Your Account
            </h1>

            {isAnon ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-amber-700">
                You are browsing as a guest. Use “Save Account” to keep your results.
              </div>
            ) : null}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900/5"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900/5"
                  placeholder="8+ characters"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900/5"
                  placeholder="Repeat password"
                />
              </div>

              {errorMsg ? (
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-widest">
                  {errorMsg}
                </div>
              ) : null}

              {successMsg ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-widest">
                    {successMsg}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Note: Some workplace email servers filter outside commercial messages. Try a personal
                    email, and check both your inbox and spam/clutter folders for the confirmation email.
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Sign Up"}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-2 text-center text-xs font-bold uppercase tracking-widest">
              <Link href={`/${locale}/login`} className="text-slate-700 hover:text-slate-900">
                Already have an account? Sign in
              </Link>
              <Link href={`/${locale}/upgrade`} className="text-slate-400 hover:text-slate-600">
                Save account (keep guest data)
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
