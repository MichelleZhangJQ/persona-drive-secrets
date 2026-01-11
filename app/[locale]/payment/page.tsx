"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthHeader } from "@/components/AuthHeader";
import PromoCodeInput from "@/components/PromoCodeInput";
import { isAnonymousUser } from "@/lib/auth/isAnonymousUser";
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingCart,
  ArrowLeft,
  Crown,
  ExternalLink,
} from "lucide-react";

type Locale = "en" | "zh";

type MembershipPlan = {
  id: string;
  label: string;
  months: number; // 6 / 12 / 24
  price: number; // USD / credits
};

const LEMON_CHECKOUT_MODE =
  (process.env.NEXT_PUBLIC_LEMON_CHECKOUT_MODE as "hosted" | "overlay" | undefined) ?? "hosted";
const LEMON_CHECKOUT_URL = process.env.NEXT_PUBLIC_LEMON_CHECKOUT_URL ?? "";

// Treat as demo unless you explicitly set NEXT_PUBLIC_CHECKOUT_LIVE="true"
const IS_DEMO_CHECKOUT = (process.env.NEXT_PUBLIC_CHECKOUT_LIVE ?? "false") !== "true";

const REPORTS = [
  { id: "relationship", field: "has_access_report_1", title: "Ideal Partner Analysis", price: 3.99, reportIndex: 1 },
  { id: "drain-analysis", field: "has_access_report_2", title: "Energy Drain and Adaptation Analysis", price: 3.99, reportIndex: 2 },
  { id: "profession-fit", field: "has_access_report_3", title: "Occupation Analysis", price: 3.99, reportIndex: 3 },
] as const;

const REPORT_ID_ALIASES: Record<string, (typeof REPORTS)[number]["id"]> = {
  instrumentation: "relationship",
  adaptive: "drain-analysis",
  playbook: "profession-fit",
  occupation: "profession-fit",
  profession: "profession-fit",
};

const REPORT_UNIT_PRICE = 3.99;
const REPORT_ACCESS_MONTHS = 1;
const REPORT_ACCESS_DAYS_ANON = 1;

const REPORT_EXPIRES_FIELD: Record<1 | 2 | 3, string> = {
  1: "report_1_expires_at",
  2: "report_2_expires_at",
  3: "report_3_expires_at",
};

function isFutureTs(ts: any) {
  if (!ts) return false;
  const d = new Date(ts);
  return Number.isFinite(d.getTime()) && d > new Date();
}

function isReportActive(profile: any, reportIndex: 1 | 2 | 3) {
  const boolField = `has_access_report_${reportIndex}`;
  if (profile?.[boolField] === true) return true;
  const expField = REPORT_EXPIRES_FIELD[reportIndex];
  return isFutureTs(profile?.[expField]);
}

function addMonths(base: Date, months: number) {
  const d = new Date(base);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return d;
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function n2(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

function buildOrderItems({
  selectedReports,
  selectedPlan,
  reportGrantExpiresAt,
  membershipGrantExpiresAt,
  isAnonymous,
}: {
  selectedReports: string[];
  selectedPlan: MembershipPlan | null;
  reportGrantExpiresAt: (reportIndex: 1 | 2 | 3) => string | null;
  membershipGrantExpiresAt: string | null;
  isAnonymous: boolean;
}) {
  const items: any[] = [];

  for (const rid of selectedReports) {
    const cfg = REPORTS.find((r) => r.id === rid);
    if (!cfg) continue;
    items.push({
      item_type: "report",
      item_id: cfg.id,
      title: cfg.title,
      quantity: 1,
      unit_price: cfg.price,
      report_index: cfg.reportIndex,
      months: isAnonymous ? 0 : REPORT_ACCESS_MONTHS,
      granted_expires_at: reportGrantExpiresAt(cfg.reportIndex),
      metadata: isAnonymous ? { access_days: REPORT_ACCESS_DAYS_ANON } : {},
    });
  }

  if (selectedPlan) {
    items.push({
      item_type: "membership",
      item_id: selectedPlan.id,
      title: selectedPlan.label,
      quantity: 1,
      unit_price: Number(selectedPlan.price),
      months: selectedPlan.months,
      report_index: null,
      granted_expires_at: membershipGrantExpiresAt,
      metadata: {},
    });
  }

  return items;
}

export default function PaymentPage() {
  const supabase = createBrowserSupabaseClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();

  const locale: Locale =
    (typeof (params as any)?.locale === "string" ? (params as any).locale : "en") as Locale;

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

  // Purchasables
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Store credit input
  const [creditInput, setCreditInput] = useState<string>("0");
  const [creditError, setCreditError] = useState<string | null>(null);

  // Plans
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  // Payment flow
  const [processing, setProcessing] = useState(false);
  const [externalProcessing, setExternalProcessing] = useState(false);
  const [paymentStage, setPaymentStage] = useState<"idle" | "pending_external" | "success">("idle");
  const [paymentCenterOpen, setPaymentCenterOpen] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [status, setStatus] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  // Load Lemon script for overlay mode
  useEffect(() => {
    if (LEMON_CHECKOUT_MODE !== "overlay") return;
    if (typeof window === "undefined") return;
    if ((window as any).LemonSqueezy) return;

    const script = document.createElement("script");
    script.src = "https://app.lemonsqueezy.com/js/lemon.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch profile (does NOT create profiles)
  const fetchProfileData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsAnonymous(false);
      setProfile(null);
      return null;
    }

    setIsAnonymous(isAnonymousUser(user));

    const { data: profileData, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr) {
      // If RLS blocks select, profile will look "missing".
      // That's OK; we only create on success anyway.
      console.warn("fetchProfileData error:", profileErr);
      setProfile(null);
      return null;
    }

    setProfile(profileData ?? null);
    return profileData ?? null;
  }, [supabase]);

  const fetchMembershipPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const { data, error } = await supabase
        .from("membership_plans")
        .select("id,label,months,price,active,sort_order")
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      const mapped: MembershipPlan[] =
        (data || []).map((x: any) => ({
          id: String(x.id),
          label: String(x.label ?? `${x.months} months`),
          months: Number(x.months),
          price: Number(x.price),
        })) ?? [];

      if (!mapped.length) {
        setPlans([
          { id: "m6", label: "6 months", months: 6, price: 19.99 },
          { id: "m12", label: "1 year", months: 12, price: 29.99 },
          { id: "m24", label: "2 years", months: 24, price: 49.99 },
        ]);
      } else {
        setPlans(mapped);
      }
    } catch {
      setPlans([
        { id: "m6", label: "6 months", months: 6, price: 19.99 },
        { id: "m12", label: "1 year", months: 12, price: 29.99 },
        { id: "m24", label: "2 years", months: 24, price: 49.99 },
      ]);
    } finally {
      setPlansLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const profileData = await fetchProfileData();
      const membershipIsActive = isFutureTs(profileData?.sub_expires_at);

      const initialRaw = searchParams.get("report");
      const initial = initialRaw ? REPORT_ID_ALIASES[initialRaw] ?? initialRaw : null;

      if (initial) {
        const cfg = REPORTS.find((r) => r.id === initial);
        if (cfg && !membershipIsActive && !isReportActive(profileData, cfg.reportIndex)) {
          setSelectedReports([initial]);
        }
      }

      await fetchMembershipPlans();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const membershipActive = useMemo(() => isFutureTs(profile?.sub_expires_at), [profile?.sub_expires_at]);

  useEffect(() => {
    if (selectedPlanId || membershipActive) setSelectedReports([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlanId, membershipActive]);

  useEffect(() => {
    if (isAnonymous) setSelectedPlanId(null);
  }, [isAnonymous]);

  useEffect(() => {
    setPaymentStage("idle");
    setPaymentCenterOpen(false);
    setStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReports.join("|"), selectedPlanId, creditInput]);

  const balance = useMemo(() => n2(profile?.store_credits || 0), [profile]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  const reportsSubtotal = useMemo(() => {
    const byId = new Map(REPORTS.map((r) => [r.id, r.price]));
    return selectedReports.reduce((acc, id) => acc + (byId.get(id as any) ?? 0), 0);
  }, [selectedReports]);

  const activeReportCountForDiscount = useMemo(() => {
    if (membershipActive) return 0;
    let n = 0;
    if (isReportActive(profile, 1)) n += 1;
    if (isReportActive(profile, 2)) n += 1;
    if (isReportActive(profile, 3)) n += 1;
    return n;
  }, [profile, membershipActive]);

  const activeReportCreditEligible = useMemo(
    () => activeReportCountForDiscount * REPORT_UNIT_PRICE,
    [activeReportCountForDiscount]
  );

  const membershipDiscountApplied = useMemo(() => {
    if (!selectedPlan) return 0;
    return Math.min(activeReportCreditEligible, n2(selectedPlan.price));
  }, [selectedPlan, activeReportCreditEligible]);

  const membershipSubtotal = useMemo(() => {
    if (!selectedPlan) return 0;
    return Math.max(0, n2(selectedPlan.price) - membershipDiscountApplied);
  }, [selectedPlan, membershipDiscountApplied]);

  const subtotal = useMemo(() => reportsSubtotal + membershipSubtotal, [reportsSubtotal, membershipSubtotal]);

  const creditsWanted = useMemo(() => {
    const x = Number(creditInput);
    return Number.isFinite(x) ? x : 0;
  }, [creditInput]);

  const creditsApplied = useMemo(() => {
    if (creditsWanted > balance) return 0;
    return clamp(creditsWanted, 0, Math.min(balance, subtotal));
  }, [creditsWanted, balance, subtotal]);

  const amountDue = useMemo(() => Math.max(0, subtotal - creditsApplied), [subtotal, creditsApplied]);

  useEffect(() => {
    if (creditsWanted > balance) setCreditError("Your store credit balance is less than what you input.");
    else setCreditError(null);
  }, [creditsWanted, balance]);

  const allUnlocked = useMemo(
    () => REPORTS.every((r) => isReportActive(profile, r.reportIndex)),
    [profile]
  );

  const membershipSelected = !!selectedPlanId;

  const toggleReport = (id: string, hasAccess: boolean) => {
    if (hasAccess) return;
    if (membershipSelected || membershipActive) return;
    setSelectedReports((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const createOrderWithItems = useCallback(
    async ({
      freshUserId,
      status,
      subtotalNow,
      creditsAppliedNow,
      dueNow,
      paymentProvider,
      items,
      metadata,
    }: {
      freshUserId: string;
      status: "pending" | "paid";
      subtotalNow: number;
      creditsAppliedNow: number;
      dueNow: number;
      paymentProvider: string | null;
      items: any[];
      metadata: any;
    }) => {
      const insertStatus = "pending";

      const { data: orderRow, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: freshUserId,
          status: insertStatus,
          currency: "USD",
          subtotal: subtotalNow,
          credits_applied: creditsAppliedNow,
          amount_due: dueNow,
          payment_provider: paymentProvider,
          locale,
          metadata: { ...(metadata ?? {}), intended_status: status },
          paid_at: null,
        })
        .select("id")
        .single();

      if (orderErr) throw orderErr;

      const payload = items.map((it) => ({ ...it, order_id: orderRow.id }));
      const { error: itemsErr } = await supabase.from("order_items").insert(payload);
      if (itemsErr) throw itemsErr;

      return orderRow.id as string;
    },
    [supabase, locale]
  );

  const markOrderPaid = useCallback(
    async (orderId: string, providerOrderId?: string | null) => {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          provider_order_id: providerOrderId ?? null,
        })
        .eq("id", orderId);

      if (error) throw error;
    },
    [supabase]
  );

  /**
   * IMPORTANT:
   * This does NOT sign in anonymously anymore.
   * It only opens Lemon / shows placeholder "payment center".
   */
  const beginExternalPaymentPlaceholder = async () => {
    if (subtotal <= 0) return;
    if (creditError) return;

    if (amountDue <= 0) {
      setStatus({ type: "success", msg: "No external payment needed. Pay with credits." });
      setPaymentCenterOpen(false);
      setPaymentStage("idle");
      return;
    }

    try {
      setPaymentCenterOpen(true);
      setPaymentStage("pending_external");

      setStatus({
        type: "success",
        msg: IS_DEMO_CHECKOUT
          ? `Demo checkout: no real charges. Proceed to the payment center to simulate paying $${amountDue.toFixed(2)}.`
          : `Proceed to the payment center to pay $${amountDue.toFixed(2)}.`,
      });

      if (!LEMON_CHECKOUT_URL) {
        setStatus({ type: "error", msg: "Lemon Squeezy checkout URL is not configured." });
        return;
      }

      if (LEMON_CHECKOUT_MODE === "overlay" && (window as any).LemonSqueezy?.Url?.Open) {
        (window as any).LemonSqueezy.Url.Open(LEMON_CHECKOUT_URL);
      } else {
        window.open(LEMON_CHECKOUT_URL, "_blank", "noopener,noreferrer");
      }
    } catch (e: any) {
      setStatus({ type: "error", msg: e.message || "Failed to start external checkout." });
    }
  };

  /**
   * Success path:
   * - ensure there is a user (if none, create anonymous user HERE)
   * - determine if profile exists
   * - insert/update profile with expiration time first
   * - then create orders + items
   */
  const finalizeSuccessfulPayment = useCallback(
    async (mode: "credits" | "external_simulated") => {
      setProcessing(true);
      setStatus(null);

      try {
        const now = new Date();

        // Ensure we have a user ONLY on success
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let activeUser = user ?? null;
        if (!activeUser) {
          const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously();
          if (anonErr) throw anonErr;
          activeUser = anonData?.user ?? null;
        }
        if (!activeUser) throw new Error("Unable to complete payment.");

        const localIsAnonymous = isAnonymousUser(activeUser);
        setIsAnonymous(localIsAnonymous);

        // Determine profile existence deterministically (don’t trust state flags)
        const { data: existingProfile, error: existErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", activeUser.id)
          .maybeSingle();
        if (existErr) throw existErr;

        const profileExistsNow = !!existingProfile;
        const fresh = existingProfile ?? {
          id: activeUser.id,
          store_credits: 0,
          sub_expires_at: null,
        };

        const membershipWasActive = isFutureTs((fresh as any).sub_expires_at);
        if (membershipWasActive && selectedReports.length > 0) {
          throw new Error(
            "Membership is active which grants access to all individual reports already. You may extend membership time instead."
          );
        }

        const freshBalance = n2((fresh as any).store_credits || 0);

        // Recompute totals at time of success (authoritative)
        const wanted = Number(creditInput);
        const wantedOk = Number.isFinite(wanted) ? wanted : 0;

        const planNow = plans.find((p) => p.id === selectedPlanId) ?? null;

        const reportsSumNow = selectedReports.reduce((acc, id) => {
          const cfg = REPORTS.find((r) => r.id === id);
          return acc + (cfg ? cfg.price : 0);
        }, 0);

        const activeCountNow = membershipWasActive
          ? 0
          : (isReportActive(fresh, 1) ? 1 : 0) +
            (isReportActive(fresh, 2) ? 1 : 0) +
            (isReportActive(fresh, 3) ? 1 : 0);

        const activeCreditNow = activeCountNow * REPORT_UNIT_PRICE;

        const membershipBaseNow = planNow ? n2(planNow.price) : 0;
        const membershipDiscountNow = planNow ? Math.min(activeCreditNow, membershipBaseNow) : 0;
        const membershipNetNow = planNow ? Math.max(0, membershipBaseNow - membershipDiscountNow) : 0;

        const subtotalNow = reportsSumNow + membershipNetNow;

        const creditsAppliedNow =
          wantedOk > freshBalance ? 0 : clamp(wantedOk, 0, Math.min(freshBalance, subtotalNow));

        const dueNow = Math.max(0, subtotalNow - creditsAppliedNow);

        if (mode === "credits" && dueNow > 0) {
          throw new Error(
            `Store credits are not enough. You still need to pay $${dueNow.toFixed(2)} in the payment center.`
          );
        }

        // Compute grants
        let membershipGrant: string | null = null;
        if (planNow) {
          const currentExpiry = (fresh as any).sub_expires_at ? new Date((fresh as any).sub_expires_at) : null;
          const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
          membershipGrant = addMonths(base, planNow.months).toISOString();
        }

        const reportGrant = (idx: 1 | 2 | 3) => {
          if (membershipGrant) return membershipGrant;
          const newExp = localIsAnonymous
            ? addDays(now, REPORT_ACCESS_DAYS_ANON)
            : addMonths(now, REPORT_ACCESS_MONTHS);

          const expField = REPORT_EXPIRES_FIELD[idx];
          const currentExp = (fresh as any)?.[expField] ? new Date((fresh as any)[expField]) : null;
          const finalExp = currentExp && currentExp > newExp ? currentExp : newExp;

          return finalExp.toISOString();
        };

        // Prepare profile updates
        const updates: any = {
          store_credits: freshBalance - creditsAppliedNow,
          updated_at: new Date().toISOString(),
        };

        // Unlock selected reports via expiry extension (do not force booleans)
        selectedReports.forEach((id) => {
          const cfg = REPORTS.find((r) => r.id === id);
          if (!cfg) return;

          const expField = REPORT_EXPIRES_FIELD[cfg.reportIndex];
          const currentExp = (fresh as any)?.[expField] ? new Date((fresh as any)[expField]) : null;

          const newExp = localIsAnonymous
            ? addDays(now, REPORT_ACCESS_DAYS_ANON)
            : addMonths(now, REPORT_ACCESS_MONTHS);

          const finalExp = currentExp && currentExp > newExp ? currentExp : newExp;
          updates[expField] = finalExp.toISOString();
        });

        // Extend membership (and align report expiries to membership expiry)
        if (planNow) {
          const currentExpiry = (fresh as any).sub_expires_at ? new Date((fresh as any).sub_expires_at) : null;
          const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
          const newExpiry = addMonths(base, planNow.months);
          updates.sub_expires_at = newExpiry.toISOString();

          updates[REPORT_EXPIRES_FIELD[1]] = newExpiry.toISOString();
          updates[REPORT_EXPIRES_FIELD[2]] = newExpiry.toISOString();
          updates[REPORT_EXPIRES_FIELD[3]] = newExpiry.toISOString();
        }

        // 1) write profile first
        if (!profileExistsNow) {
          const insertPayload = {
            id: activeUser.id,
            email: activeUser.email ?? null,
            preferred_language: locale,
            created_at: new Date().toISOString(),
            updated_at: updates.updated_at,
            ...updates,
          };
          const { error: insErr } = await supabase.from("profiles").insert(insertPayload);
          if (insErr) throw insErr;
        } else {
          const { error: updErr } = await supabase.from("profiles").update(updates).eq("id", activeUser.id);
          if (updErr) throw updErr;
        }

        // 2) then write order + items
        const items = buildOrderItems({
          selectedReports,
          selectedPlan: planNow,
          reportGrantExpiresAt: reportGrant,
          membershipGrantExpiresAt: membershipGrant,
          isAnonymous: localIsAnonymous,
        });

        const orderId = await createOrderWithItems({
          freshUserId: activeUser.id,
          status: dueNow > 0 ? "pending" : "paid",
          subtotalNow,
          creditsAppliedNow,
          dueNow,
          paymentProvider: dueNow > 0 ? "lemon_squeezy" : "credits",
          items,
          metadata: {
            kind: "checkout",
            membership_discount_applied: membershipDiscountNow,
            active_report_credit_eligible: activeCreditNow,
            mode,
          },
        });

        if (mode === "external_simulated") {
          await markOrderPaid(orderId, "SIMULATED_PROVIDER_ORDER_ID");
        } else if (dueNow <= 0) {
          await markOrderPaid(orderId, "CREDITS");
        }

        setPaymentStage("success");
        setStatus({ type: "success", msg: "Payment successful! Your access has been updated." });

        await fetchProfileData();

        // Reset cart
        setSelectedReports([]);
        setSelectedPlanId(null);
        setCreditInput("0");
        setPaymentCenterOpen(false);
      } catch (err: any) {
        setStatus({ type: "error", msg: err.message || "Payment failed." });
      } finally {
        setProcessing(false);
      }
    },
    [creditInput, createOrderWithItems, fetchProfileData, markOrderPaid, plans, selectedPlanId, selectedReports, supabase, locale]
  );

  const simulateExternalSuccess = async () => {
    setExternalProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      await finalizeSuccessfulPayment("external_simulated");
    } catch (e: any) {
      setStatus({ type: "error", msg: e.message || "Simulated payment failed." });
    } finally {
      setExternalProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <AuthHeader />

      <main className="max-w-6xl mx-auto px-4 py-12 flex-grow w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="text-slate-400" />
            <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight italic">Checkout</h1>
          </div>
          <div className="bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 mr-2">Balance:</span>
            <span className="font-bold text-slate-900">${balance.toFixed(2)}</span>
          </div>
        </div>

        {IS_DEMO_CHECKOUT ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">
              Demo / Test Checkout — no real charges. Access unlocks are for testing only.
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(300px,440px)] gap-8">
          {/* LEFT */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Reports</h3>
                {allUnlocked ? (
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 max-w-[200px] text-right leading-snug">
                    All reports already unlocked
                  </span>
                ) : null}
              </div>

              {membershipActive ? (
                <div className="text-[9px] font-bold uppercase tracking-widest text-indigo-600 leading-snug max-w-[320px]">
                  Membership is active — individual reports are active already. You may extend membership time.
                </div>
              ) : isAnonymous ? (
                <div className="text-[9px] font-bold uppercase tracking-widest text-amber-700 leading-snug max-w-[320px]">
                  Anonymous purchase: report access lasts 1 day. Save your account for 1-month access.
                </div>
              ) : membershipSelected ? (
                <div className="text-[9px] font-bold uppercase tracking-widest text-indigo-600 leading-snug max-w-[320px]">
                  Membership selected — reports are included.
                </div>
              ) : (
                <p className="text-[9px] text-slate-400 font-medium leading-snug max-w-[320px]">
                  Note: Individual report purchases grant continuous access for <strong>1 month</strong>.
                </p>
              )}

              {REPORTS.map((report) => {
                const reportActive = isReportActive(profile, report.reportIndex);
                const isSelected = selectedReports.includes(report.id);
                const disabled = reportActive || membershipSelected || membershipActive;

                return (
                  <button
                    key={report.id}
                    disabled={disabled}
                    onClick={() => toggleReport(report.id, reportActive)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                      disabled
                        ? "opacity-60 bg-slate-100 border-slate-200 cursor-not-allowed"
                        : isSelected
                        ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                        : "border-white bg-white hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          reportActive
                            ? "bg-slate-400 border-slate-400"
                            : isSelected
                            ? "bg-indigo-600 border-indigo-600"
                            : "border-slate-200"
                        }`}
                      >
                        {(isSelected || reportActive) && <CheckCircle2 className="text-white w-4 h-4" />}
                      </div>

                      <div className="text-left max-w-[220px]">
                        <span
                          className={`block text-xs font-bold leading-snug line-clamp-2 ${
                            reportActive ? "text-slate-500" : "text-slate-700"
                          }`}
                        >
                          {report.title}
                        </span>
                        {reportActive ? (
                          <span className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">
                            Active Access
                          </span>
                        ) : membershipActive ? (
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                            Membership Active (Reports Locked)
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {!reportActive ? (
                      <span className="font-mono font-semibold text-[11px] text-slate-500">${report.price}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {!membershipActive ? (
              <p className="text-[9px] text-slate-600 font-medium leading-snug max-w-[520px]">
                <span className="font-black uppercase tracking-widest">Note:</span>{" "}
                Upgrade to our membership. Individual report purchases in the last <strong>1 month</strong> will be applied to
                membership fees.
              </p>
            ) : null}

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Crown size={16} className="text-slate-400" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {membershipActive ? "Extend Membership" : "Membership"}
                </h3>
              </div>

              <div className="text-[9px] text-slate-500 font-medium mb-4 leading-snug max-w-[360px]">
                Current expiry:{" "}
                <strong>
                  {profile?.sub_expires_at ? new Date(profile.sub_expires_at).toLocaleDateString() : "No active membership"}
                </strong>
              </div>

              {plansLoading ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="animate-spin w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Loading plans...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {plans.map((p) => {
                    const picked = selectedPlanId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlanId((prev) => (prev === p.id ? null : p.id))}
                        disabled={isAnonymous}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                          isAnonymous
                            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                            : picked
                            ? "border-indigo-600 bg-indigo-50/50"
                            : "bg-white border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        <div className="text-left max-w-[220px]">
                          <div className="text-[11px] font-black text-slate-800 leading-snug line-clamp-1">
                            {p.label}
                          </div>
                          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            {p.months} months
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-[11px] text-slate-600">
                          ${Number(p.price).toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="mt-3 text-[9px] text-slate-400 font-medium leading-snug max-w-[360px]">
                {isAnonymous
                  ? "Save your account to unlock membership and longer access."
                  : membershipActive
                  ? "Membership is active. You can extend your membership time."
                  : "If you select a membership, active reports will be credited toward the membership price."}
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:sticky lg:top-24 h-fit space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Payment</h3>

              <div className="space-y-3 mb-4">
                <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
                {selectedPlan ? (
                  <Row label="Active Report Credit" value={`-$${membershipDiscountApplied.toFixed(2)}`} muted />
                ) : null}
                <Row label="Credits Applied" value={`-$${creditsApplied.toFixed(2)}`} muted />
                <div className="pt-2 border-t border-slate-100" />
                <Row label="Amount Due" value={`$${amountDue.toFixed(2)}`} strong />
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Apply Store Credits
                </label>
                <input
                  inputMode="decimal"
                  value={creditInput}
                  onChange={(e) => setCreditInput(e.target.value)}
                  className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none ${
                    creditError ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50"
                  }`}
                  placeholder="0.00"
                />
                {creditError ? (
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-rose-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {creditError}
                  </p>
                ) : (
                  <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Balance: ${balance.toFixed(2)}
                  </p>
                )}
              </div>

              {subtotal <= 0 ? (
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest italic">
                  Nothing selected.
                </p>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => finalizeSuccessfulPayment("credits")}
                    disabled={processing || !!creditError || amountDue > 0}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processing ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <>
                        <Wallet size={16} /> Pay with Credits
                      </>
                    )}
                  </button>

                  {amountDue > 0 ? (
                    <>
                      <button
                        onClick={beginExternalPaymentPlaceholder}
                        disabled={processing || !!creditError}
                        className="w-full bg-rose-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        Top Up Balance (${amountDue.toFixed(2)})
                      </button>

                      {IS_DEMO_CHECKOUT ? (
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                          Demo mode: no real payment is processed.
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <button
                      onClick={beginExternalPaymentPlaceholder}
                      disabled={processing || !!creditError || amountDue <= 0}
                      className="w-full bg-white text-slate-900 py-4 rounded-xl font-black uppercase tracking-widest text-[11px] border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ExternalLink size={16} /> Go to Payment Center
                    </button>
                  )}
                </div>
              )}

              {status ? (
                <div
                  className={`mt-4 p-3 rounded-lg flex items-start gap-2 ${
                    status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {status.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  <p className="text-[9px] font-bold uppercase">{status.msg}</p>
                </div>
              ) : null}
            </div>

            {paymentCenterOpen ? (
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Payment Center (Placeholder)
                </h3>
                <p className="text-[12px] text-slate-500 font-medium">
                  Lemon Squeezy integration will live here once approved. For now, simulate a successful payment.
                </p>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={simulateExternalSuccess}
                    disabled={externalProcessing || processing || paymentStage !== "pending_external"}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {externalProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : "Simulate Payment Success"}
                  </button>

                  <button
                    onClick={() => {
                      setPaymentCenterOpen(false);
                      setPaymentStage("idle");
                    }}
                    className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all"
                  >
                    Close Payment Center
                  </button>
                </div>
              </div>
            ) : null}

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Redeem Promo Code</p>
              <div className="mt-4">
                <PromoCodeInput onRefresh={fetchProfileData} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex justify-center">
          <Link
            href={withLocale("/")}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-xs font-black uppercase tracking-[0.2em]"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className={`italic ${muted ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
      <span className={`${strong ? "font-black text-slate-900" : "font-bold text-slate-700"}`}>{value}</span>
    </div>
  );
}