'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

export function AuthHeader() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Brand Colors
  const sage = "#93a97c";
  const mutedBlue = "#7c94be";
  const dustyPurple = "#512d94ff";
  const buttonGrey="#69768dff"

  const [userDisplay, setUserDisplay] = useState('User');

  const fetchSession = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
    
    if (currentSession) {
        setUserDisplay(currentSession.user.email?.split('@')[0] || 'User'); 
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        if (currentSession) {
            setUserDisplay(currentSession.user.email?.split('@')[0] || 'User');
        } else {
            setUserDisplay('User');
        }
        router.refresh(); 
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router, fetchSession]);

 const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      // Force a hard redirect to the login page to clear all states
      window.location.href = "/login";
    } catch (error) {
      console.error("Error logging out:", error);
      setLoading(false); // Reset loading so the user can try again if it fails
    }
  };

  const AuthButton = () => {
    if (loading) {
        return (
          <button className="rounded-full border border-slate-400 bg-white/80 px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm cursor-wait">
            Loading...
          </button>
        )
    }

    if (session) {
      return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 hidden sm:inline">
                Welcome, <span className="font-bold">{userDisplay}</span>
            </span>
            <button 
                onClick={handleLogout}
                className="rounded-full px-4 py-1.5 text-sm font-black text-white shadow-md hover:brightness-90 transition uppercase tracking-wider"
                style={{ backgroundColor: buttonGrey }}
            >
                Log Out
            </button>
        </div>
      );
    }
    
    return (
      <Link href="/login">
        <button className="rounded-full border border-slate-400 bg-white/80 px-4 py-1.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-100 uppercase tracking-tight">
          Log in / Sign up
        </button>
      </Link>
    );
  };

  return (
    <header className="border-b bg-white/95 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Left: Logo - PersonaDriveSecrets */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-10 w-10 md:h-12 md:w-12">
              <Image
                src="/PersonaDriveSecretLogo.jpg"
                alt="PersonaDriveSecrets logo"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase italic">
              <span style={{ color: sage }}>Persona</span>
              <span style={{ color: mutedBlue }}>Drive</span>
              <span style={{ color: dustyPurple }}>Secrets</span>
            </span>
          </Link>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden items-center gap-1 rounded-full bg-slate-50 px-1 py-1 text-xs font-medium border border-slate-400 md:flex">
          <Link 
            href="/" 
            className="rounded-full px-4 py-1.5 text-xs font-black text-white shadow-sm uppercase tracking-widest"
            style={{ backgroundColor: buttonGrey }}
          >
            Tests
          </Link>
          <Link href="/theories" className="rounded-full px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 uppercase">Theories</Link>
          <Link href="/resources" className="rounded-full px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 uppercase">Resources</Link>
        </nav>

        {/* Right: Auth area */}
        <div className="flex items-center gap-3">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}