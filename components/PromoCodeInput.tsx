"use client";

import { useState } from "react";
import { Ticket, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
// Import the same client factory used in your Profile Panel
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

interface PromoCodeInputProps {
  onRefresh: () => void; // Used to tell the dashboard to reload balance
}

export default function PromoCodeInput({ onRefresh }: PromoCodeInputProps) {
  const supabase = createBrowserSupabaseClient();
  const t = useTranslations("home");
  
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ text: string; isError: boolean } | null>(null);

const handleRedeem = async (e: React.FormEvent) => {
  e.preventDefault();
  const cleanCode = promoCode.toUpperCase().trim();
  if (!cleanCode) return;

  setLoading(true);
  setStatus(null);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required.");

    // 1. Fetch the Promo Code
    const { data: codeData, error: codeError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', cleanCode)
      .eq('is_active', true)
      .maybeSingle();

    if (codeError || !codeData) throw new Error("Invalid or expired code.");

    // 2. Fetch Profile by Email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, store_credits')
      .ilike('email', user.email!.trim().toLowerCase())
      .maybeSingle();

    if (profileError || !profile) throw new Error("Profile not found.");

    // NEW Logic: 3. Check if this user has already used this code
    const { data: existingRedemption } = await supabase
      .from('promo_redemptions')
      .select('id')
      .eq('user_id', profile.id)
      .eq('code_used', cleanCode)
      .maybeSingle();

    if (existingRedemption) {
      throw new Error("You have already redeemed this code.");
    }

    // 4. Perform the Credit Update
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        store_credits: (profile.store_credits || 0) + codeData.credit_value,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) throw updateError;

    // NEW Logic: 5. Record the redemption to prevent reuse
    const { error: redemptionError } = await supabase
      .from('promo_redemptions')
      .insert({
        user_id: profile.id,
        code_used: cleanCode,
        source_platform: 'web_dashboard'
      });

    if (redemptionError) console.error("Redemption log failed:", redemptionError);

    setStatus({ text: `Success! +$${codeData.credit_value} added.`, isError: false });
    setPromoCode("");
    
    onRefresh();

  } catch (err: any) {
    setStatus({ text: err.message || "Redemption failed", isError: true });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="w-4 h-4 text-slate-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {t("promo.redeem")}
        </span>
      </div>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {t("promo.signInNote")}
      </p>
      
      <form onSubmit={handleRedeem} className="flex gap-2">
        <input 
          type="text" 
          placeholder="ENTER CODE"
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-bold outline-none uppercase text-slate-700 focus:border-slate-400 transition-colors"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
        />
        <button 
          type="submit"
          disabled={loading || !promoCode}
          className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:bg-slate-300 transition-all flex items-center justify-center min-w-[100px]"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
        </button>
      </form>

      {status && (
        <p className={`mt-3 text-[10px] font-bold uppercase tracking-tight ${
          status.isError ? 'text-rose-500' : 'text-emerald-500'
        }`}>
          {status.text}
        </p>
      )}
    </div>
  );
}
