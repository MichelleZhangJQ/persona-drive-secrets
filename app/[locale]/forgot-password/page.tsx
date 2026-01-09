"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";

export default function ForgotPasswordPage() {
  const supabase = createBrowserSupabaseClient();
  const params = useParams();
  const locale = typeof (params as any)?.locale === "string" ? (params as any).locale : "en";

  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const redirectTo = `${window.location.origin}/${locale}/auth/callback?next=/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
      setSuccessMsg("Check your email for the reset link.");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to send reset email.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <AuthHeader />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex justify-center items-center h-full">
          <div className="w-full max-w-md p-8 rounded-xl shadow-lg bg-white">
            <h1 className="text-2xl font-semibold mb-6 text-center text-slate-800">
              Reset Password
            </h1>

            <form onSubmit={handleReset} className="space-y-4">
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
                disabled={submitting}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send Reset Link"}
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
