"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { checkUserStaffStatus } from "@/utils/auth-logic";
import {
  Shield,
  Loader2,
  Save,
  Smartphone,
  CreditCard,
  FileText,
} from "lucide-react";

// --- Helper Components ---

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-600 truncate">{value || "—"}</p>
    </div>
  );
}

function AccessToggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        checked ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {label}
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              checked ? "bg-emerald-500" : "bg-slate-300"
            } ${disabled ? "cursor-not-allowed" : ""}`}
          >
            <span
              className={`${
                checked ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </button>
          <span
            className={`text-[11px] font-bold uppercase ${
              checked ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            {checked ? "Granted" : "Locked"}
          </span>
        </div>
      </div>
    </div>
  );
}

const INPUT_STYLE =
  "w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed";
const SECTION_CARD =
  "bg-white/70 backdrop-blur-sm p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4";

export default function UserProfilePanel() {
  const supabase = createBrowserSupabaseClient();

  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [targetUser, setTargetUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Load User on Mount
  useEffect(() => {
    async function init() {
      const role = await checkUserStaffStatus(supabase);
      setViewerRole(role || "user");

      // Auto-fetch current user's own profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        handleFetch(user.email);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const handleFetch = async (email: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("email", email.trim())
        .maybeSingle();

      if (error) throw error;
      if (data) setTargetUser(data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!targetUser) return;
    setSaving(true);

    try {
      // If membership expiry is set, also set report expiries to match it.
      // Accept either ISO timestamp or datetime-local string.
      const membershipExpiry = targetUser.sub_expires_at
        ? new Date(targetUser.sub_expires_at).toISOString()
        : null;

      const payload: any = {
        store_credits: parseFloat(targetUser.store_credits) || 0,
        sub_expires_at: membershipExpiry,
        phone_number: targetUser.phone_number,
        has_access_report_1: targetUser.has_access_report_1,
        has_access_report_2: targetUser.has_access_report_2,
        has_access_report_3: targetUser.has_access_report_3,
        updated_at: new Date().toISOString(),
      };

      // ✅ Minimal change requested:
      if (membershipExpiry) {
        payload.report_1_expires_at = membershipExpiry;
        payload.report_2_expires_at = membershipExpiry;
        payload.report_3_expires_at = membershipExpiry;
      }

      const { error } = await supabase.from("profiles").update(payload).eq("id", targetUser.id);

      if (error) throw error;
      alert("Profile updated successfully.");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = viewerRole === "admin" || viewerRole === "assistant";

  if (viewerRole === null)
    return <div className="p-12 text-center text-slate-400 animate-pulse">Initializing...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Dynamic Header */}
      <div
        className={`p-8 rounded-[3rem] shadow-xl text-white flex flex-col lg:flex-row justify-between items-center gap-6 ${
          isAdmin ? "bg-slate-900" : "bg-indigo-600"
        }`}
      >
        <div>
          <h2 className="text-2xl font-bold">{isAdmin ? "User Management" : "My Settings"}</h2>
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest flex items-center gap-2 mt-1">
            <Shield size={12} /> Role: {viewerRole}
          </p>
        </div>

        {/* Search only visible to Admin */}
        {isAdmin && (
          <div className="flex gap-2 p-1.5 bg-white/10 rounded-2xl border border-white/10 w-full lg:w-96 backdrop-blur-md">
            <input
              className="bg-transparent border-none focus:ring-0 text-sm px-4 flex-1 font-medium outline-none text-white placeholder:text-indigo-200"
              placeholder="Search user email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetch(searchEmail)}
            />
            <button
              onClick={() => handleFetch(searchEmail)}
              className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase transition-all"
            >
              {loading ? "..." : "Find"}
            </button>
          </div>
        )}
      </div>

      {targetUser ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Billing/Credits (Read-only for normal users) */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`${SECTION_CARD} border-indigo-100 bg-indigo-50/30`}>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={14} className="text-indigo-500" />
                <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                  Account Status
                </h3>
              </div>
              <Field label="Store Credits ($)">
                <input
                  type="number"
                  disabled={!isAdmin}
                  className={INPUT_STYLE}
                  value={targetUser.store_credits}
                  onChange={(e) => setTargetUser({ ...targetUser, store_credits: e.target.value })}
                />
              </Field>
              <Field label="Membership Expiry">
                <input
                  type="datetime-local"
                  disabled={!isAdmin}
                  className={INPUT_STYLE}
                  value={
                    targetUser.sub_expires_at
                      ? new Date(targetUser.sub_expires_at).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) => setTargetUser({ ...targetUser, sub_expires_at: e.target.value })}
                />
              </Field>
            </div>

            <div className={SECTION_CARD}>
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <Smartphone size={14} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Contact</h3>
              </div>
              <Field label="Phone Number">
                <input
                  className={INPUT_STYLE}
                  value={targetUser.phone_number || ""}
                  onChange={(e) => setTargetUser({ ...targetUser, phone_number: e.target.value })}
                />
              </Field>
            </div>
          </div>

          {/* Access & Save Section */}
          <div className="lg:col-span-8 space-y-6">
            <div className={SECTION_CARD}>
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <FileText size={14} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Reports & Entitlements</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <AccessToggle
                  disabled={!isAdmin}
                  label="Report 1"
                  checked={!!targetUser.has_access_report_1}
                  onChange={(val) => setTargetUser({ ...targetUser, has_access_report_1: val })}
                />
                <AccessToggle
                  disabled={!isAdmin}
                  label="Report 2"
                  checked={!!targetUser.has_access_report_2}
                  onChange={(val) => setTargetUser({ ...targetUser, has_access_report_2: val })}
                />
                <AccessToggle
                  disabled={!isAdmin}
                  label="Report 3"
                  checked={!!targetUser.has_access_report_3}
                  onChange={(val) => setTargetUser({ ...targetUser, has_access_report_3: val })}
                />
              </div>
            </div>

            <div className={SECTION_CARD}>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Identity
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ReadOnlyField label="Name" value={targetUser.display_name} />
                <ReadOnlyField label="Email" value={targetUser.email} />
                <ReadOnlyField label="Country" value={targetUser.location_country} />
              </div>
            </div>

            {/* Save Button (Bottom Left) */}
            <div className="flex justify-start pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-3 bg-slate-900 hover:bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all active:scale-[0.95] disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {saving ? "Syncing..." : "Commit Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">
            Loading Profile Data...
          </p>
        </div>
      )}
    </div>
  );
}