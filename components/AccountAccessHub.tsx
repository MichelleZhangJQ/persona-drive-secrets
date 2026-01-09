"use client";

import { Wallet, Zap, Calendar } from "lucide-react";
import PromoCodeInput from "@/components/PromoCodeInput";
interface Props {
  userCredits?: number;
  subExpiresAt?: string | null;
  onRefresh: () => void;
}

export default function AccountAccessHub({ 
  userCredits, 
  subExpiresAt, 
  onRefresh
}: Props) {

  const isSubscribed = subExpiresAt ? new Date(subExpiresAt) > new Date() : false;

  return (
    <section className="mt-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Access Management</h3>
        <div className="h-[1px] bg-slate-200 flex-1"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: WALLET & PROMO */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* 1. Wallet Box (Balance Display) */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Store Credits</span>
              </div>
              <span className="text-lg font-bold text-slate-900">${Number(userCredits).toFixed(2)}</span>
            </div>
          </div>

          {/* 2. Pass the props down to the child */}
          <PromoCodeInput 
            onRefresh={onRefresh} 
          />
          
        </div>

        {/* RIGHT COLUMN: SUBSCRIPTION CARD */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden border-2 border-slate-800 shadow-2xl flex flex-col justify-between group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Unlimited Access</span>
              </div>
              {isSubscribed && (
                <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center gap-2">
                  <Calendar size={10} className="text-emerald-400" />
                  <span className="text-[8px] font-black uppercase text-emerald-400">Active Session</span>
                </div>
              )}
            </div>
            <h4 className="text-2xl font-bold mb-4 tracking-tight">Platform Membership</h4>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Full intelligence clearance. Generate unlimited reports and access the complete suite.
            </p>
          </div>
          <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Zap size={240} />
          </div>
        </div>
      </div>
    </section>
  );
}
