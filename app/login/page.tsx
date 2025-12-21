// app/login/page.tsx - ENTIRE CORRECTED CODE
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // Import useRouter for manual redirect
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

// Helper component for the consistent Header (same as before)
function SiteHeader() {
  return (
    <header className="border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-10 w-10 md:h-12 md:w-12">
              <Image
                src="/PersonaDriveSecretLogo.jpg"
                alt="PersonaDriveSecrets logo"
                fill
                className="object-contain"
                priority
                // NOTE: The console warning is about the missing 'sizes' prop here.
                // It does not break functionality, but adding it is good practice:
                sizes="(max-width: 768px) 100vw, 50vw" 
              />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-800">
              PersonaDriveSecrets
            </span>
          </Link>
        </div>
        <nav className="hidden items-center gap-1 rounded-full bg-slate-200/70 px-1 py-1 text-xs font-medium shadow-inner md:flex">
          <Link
            href="/"
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300/70"
          >
            Tests
          </Link>
          <Link
            href="/theories"
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300/70"
          >
            Theories
          </Link>
          <Link
            href="/resources"
            className="rounded-full px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300/70"
          >
            Resources
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <button className="rounded-full border border-slate-300 bg-white/80 px-4 py-1.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-100">
              Log in / Sign up
            </button>
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function LoginPage() {
  const supabase = createBrowserSupabaseClient()
  const router = useRouter() // Initialize router
  const [loading, setLoading] = useState(true)

  // 1. Initial check (if user is already logged in)
  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            router.push('/'); // Use router.push instead of Next.js redirect
        } else {
            setLoading(false);
        }
    }
    checkSession();
  }, [supabase, router])


  // 2. Listener for real-time authentication state changes (handles post-login redirect)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // When the Auth UI successfully exchanges the token and sets the session,
        // the state changes to 'SIGNED_IN', and we manually redirect.
        if (event === 'SIGNED_IN' && session) {
          router.push('/');
        }
      }
    )

    // Cleanup the subscription when the component unmounts
    return () => subscription.unsubscribe()
  }, [supabase, router])


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <SiteHeader /> 

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex justify-center items-center h-full">
          <div className="w-full max-w-md p-8 rounded-xl shadow-lg bg-white">
            <h1 className="text-2xl font-semibold mb-6 text-center text-slate-800">
              Sign In to Save Your Responses
            </h1>
            
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={[]} 
              // KEEP the redirectTo for the email confirmation flow, it still needs the callback
              redirectTo={`${window.location.origin}/auth/callback`}
            />
          </div>
        </div>
      </main>
    </div>
  )
}