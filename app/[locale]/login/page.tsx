// app/login/page.tsx - ENTIRE CORRECTED CODE
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation' // Import useRouter for manual redirect
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { AuthHeader } from '@/components/AuthHeader'
import { isAnonymousUser } from '@/lib/auth/isAnonymousUser'

export default function LoginPage() {
  const supabase = createBrowserSupabaseClient()
  const router = useRouter() // Initialize router
  const params = useParams()
  const locale = typeof (params as any)?.locale === 'string' ? (params as any).locale : 'en'
  const effectDeps = [supabase, router, locale] as const
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 1. Initial check (if user is already logged in)
  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !isAnonymousUser(session.user)) {
            router.push(`/${locale}`); // Use router.push instead of Next.js redirect
        } else {
            setLoading(false);
        }
    }
    checkSession();
  }, effectDeps)


  // 2. Listener for real-time authentication state changes (handles post-login redirect)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // When the Auth UI successfully exchanges the token and sets the session,
        // the state changes to 'SIGNED_IN', and we manually redirect.
        if (event === 'SIGNED_IN' && session && !isAnonymousUser(session.user)) {
          router.push(`/${locale}`);
        }
      }
    )

    // Cleanup the subscription when the component unmounts
    return () => subscription.unsubscribe()
  }, effectDeps)

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMsg(null)
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (isAnonymousUser(user)) {
        await supabase.auth.signOut()
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      router.push(`/${locale}`)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed.')
    } finally {
      setSubmitting(false)
    }
  }


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <AuthHeader />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex justify-center items-center h-full">
          <div className="w-full max-w-md p-8 rounded-xl shadow-lg bg-white">
            <h1 className="text-2xl font-semibold mb-6 text-center text-slate-800">
              Sign In to Save Your Responses
            </h1>

            <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="Your password"
                />
              </div>

              {errorMsg ? (
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-widest">
                  {errorMsg}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-2 text-center text-xs font-bold uppercase tracking-widest">
              <Link href={`/${locale}/signup`} className="text-slate-700 hover:text-slate-900">
                Create an account
              </Link>
              <Link href={`/${locale}/forgot-password`} className="text-slate-400 hover:text-slate-600">
                Forgot password
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
