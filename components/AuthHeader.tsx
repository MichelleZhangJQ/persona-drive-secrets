// components/AuthHeader.tsx (or wherever this lives)
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { History, ShoppingCart, UserCircle } from "lucide-react";
import { headerI18n, pick, type Locale } from "@/lib/i18n/header";
import { isAnonymousUser } from "@/lib/auth/isAnonymousUser";

export function AuthHeader() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "en";

  const stripLocale = useCallback((path: string) => {
    return path.replace(/^\/(en|zh)(?=\/|$)/, "") || "/";
  }, []);

  const withLocale = useCallback(
    (href: string, nextLocale = locale) => {
      if (!href) return `/${nextLocale}`;
      if (href.startsWith("http") || href.startsWith("mailto:")) return href;
      const normalized = href.startsWith("/") ? href : `/${href}`;
      return `/${nextLocale}${normalized}`;
    },
    [locale]
  );

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const sage = "#93a97c";
  const mutedBlue = "#7c94be";
  const dustyPurple = "#512d94ff";
  const buttonGrey = "#69768dff";

  const [userDisplay, setUserDisplay] = useState("User");

  const fetchSession = useCallback(async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    setSession(currentSession);

    if (currentSession) {
      setUserDisplay(currentSession.user.email?.split("@")[0] || "User");
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);

      if (currentSession) {
        setUserDisplay(currentSession.user.email?.split("@")[0] || "User");
      } else {
        setUserDisplay("User");
      }

      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [supabase, router, fetchSession]);

  const t = useMemo(() => {
    const loc = (locale === "zh" ? "zh" : "en") as Locale;
    return (item: { en: string; zh: string }) => pick(item, loc, "single");
  }, [locale]);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push(withLocale("/login"));
    router.refresh();
  };

  const tabBase =
    "flex items-center gap-2 rounded-t-xl border border-slate-300 px-4 py-2 text-xs uppercase tracking-widest transition-all";
  const tabActive =
    "bg-white text-slate-900 font-black -mb-px z-10 shadow-sm translate-y-[1px]";
  const tabInactive =
    "bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold";
  const langBase =
    "px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors";
  const langActive = "bg-slate-900 text-white";
  const langInactive = "text-slate-500 hover:bg-slate-100";

  const switchLocale = (nextLocale: "en" | "zh") => {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
    const nextPath = withLocale(stripLocale(pathname || "/"), nextLocale);
    router.push(nextPath);
  };

  // ✅ Active route detection for nav pills
  const activeTab = useMemo<"main" | "theories" | "orders">(() => {
    const p = stripLocale(pathname || "/");

    // Theories
    if (p === "/theories" || p.startsWith("/theories/")) return "theories";

    if (p === "/orders" || p.startsWith("/orders/")) return "orders";

    // Default: Main (dashboard + reports)
    return "main";
  }, [pathname, stripLocale]);

  const AuthButton = () => {
    if (loading) {
      return (
        <button className="rounded-full border border-slate-400 bg-white/80 px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm cursor-wait">
          {t(headerI18n.auth.loading)}
        </button>
      );
    }

    if (session && !isAnonymousUser(session.user)) {
      return (
        <div className="flex items-center gap-4">
          <Link
            href={withLocale("/payment")}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors group relative"
            title={t(headerI18n.auth.cartTitle)}
          >
            <ShoppingCart size={20} className="text-slate-500 group-hover:text-slate-800" />
          </Link>

          <Link href={withLocale("/profile")} className="flex items-center gap-2 group transition-all">
            <UserCircle size={24} className="text-slate-500 group-hover:text-slate-800" />
            <span className="text-sm font-medium text-slate-600 hidden sm:inline group-hover:text-slate-900">
              {t(headerI18n.auth.welcome)}, <span className="font-bold">{userDisplay}</span>
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="rounded-full px-4 py-1.5 text-sm font-black text-white shadow-md hover:brightness-90 transition uppercase tracking-wider"
            style={{ backgroundColor: buttonGrey }}
          >
            {t(headerI18n.auth.logout)}
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <Link
          href={withLocale("/payment")}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors group relative"
          title={t(headerI18n.auth.cartTitle)}
        >
          <ShoppingCart size={20} className="text-slate-500 group-hover:text-slate-800" />
        </Link>

        {session && isAnonymousUser(session.user) ? (
          <>
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              {t(headerI18n.auth.welcome)}, <span className="font-black">Guest</span>
            </span>

            <Link href={withLocale("/upgrade")}>
              <button className="rounded-full bg-indigo-600 text-white px-4 py-1.5 text-sm font-black shadow-sm hover:bg-indigo-700 uppercase tracking-tight transition-colors">
                {t(headerI18n.auth.saveAccount)}
              </button>
            </Link>

            <Link href={withLocale("/login")}>
              <button className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 uppercase tracking-tight">
                {t(headerI18n.auth.login)}
              </button>
            </Link>
          </>
        ) : (
          <Link href={withLocale("/login")}>
            <button className="rounded-full border border-slate-400 bg-white/80 px-4 py-1.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-100 uppercase tracking-tight">
              {t(headerI18n.auth.loginSignup)}
            </button>
          </Link>
        )}
      </div>
    );
  };

  return (
    <header className="border-b bg-white/95 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <Link href={withLocale("/")} className="flex items-center gap-2">
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
              {locale === "zh" ? (
                <>
                  <span style={{ color: sage }}>Persona</span>
                  <span style={{ color: mutedBlue }}>Drive</span>
                  <span style={{ color: dustyPurple }}>Secrets</span>
                  <span className="ml-2" style={{ color: sage }}>
                    隐秘人格
                  </span>
                </>
              ) : (
                <>
                  <span style={{ color: sage }}>Persona</span>
                  <span style={{ color: mutedBlue }}>Drive</span>
                  <span style={{ color: dustyPurple }}>Secrets</span>
                </>
              )}
            </span>
          </Link>
        </div>

        {/* Center: Navigation */}
        <nav className="flex flex-wrap items-end gap-1 border-b border-slate-300 px-1 pt-2">
          <Link
            href={withLocale("/")}
            className={`${tabBase} ${activeTab === "main" ? tabActive : tabInactive}`}
          >
            {t(headerI18n.nav.main)}
          </Link>

          <Link
            href={withLocale("/theories")}
            className={`${tabBase} ${activeTab === "theories" ? tabActive : tabInactive}`}
          >
            {t(headerI18n.nav.theories)}
          </Link>

          <Link
            href={withLocale("/orders")}
            className={`${tabBase} ${activeTab === "orders" ? tabActive : tabInactive}`}
          >
            <History size={14} className="text-slate-500" />
            {t(headerI18n.nav.orders)}
          </Link>
        </nav>

        {/* Right: Auth area */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => switchLocale("en")}
              className={`${langBase} ${locale === "en" ? langActive : langInactive} rounded-full`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => switchLocale("zh")}
              className={`${langBase} ${locale === "zh" ? langActive : langInactive} rounded-full`}
            >
              中文
            </button>
          </div>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
