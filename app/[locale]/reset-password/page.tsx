"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";
import { isAnonymousUser } from "@/lib/auth/isAnonymousUser";

export default function ResetPasswordPage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const params = useParams();
  const locale = typeof (params as any)?.locale === "string" ? (params as any).locale : "en";

  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
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
        setHasSession(true);
      }
      setLoading(false);
    };
    checkSession();
  }, [supabase]);

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccessMsg("Password updated. Please sign in again.");
      setTimeout(() => router.push(`/${locale}/login`), 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to reset password.");
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
              Set a New Password
            </h1>

            {!hasSession ? (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-amber-700">
                Reset link required. Use the email reset link to continue.
              </div>
            ) : null}

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  New Password
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
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-widest">
                  {successMsg}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting || !hasSession}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Update Password"}
              </button>
            </form>

            <div className="mt-6 text-center text-xs font-bold uppercase tracking-widest">
              <Link href={`/${locale}/login`} className="text-slate-700 hover:text-slate-900">
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
