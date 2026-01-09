'use client'

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Loader2, ShieldAlert, UserCheck, Mail, Fingerprint, XCircle, AlertCircle } from 'lucide-react';

export default function AdminStatusPanel() {
  const supabase = createBrowserSupabaseClient();
  
  const [searchEmail, setSearchEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [target, setTarget] = useState<{
    email: string; 
    role: string; 
    id: string;
    is_auto_fetched?: boolean;
    needs_profile?: boolean; // New flag for the reminder
  } | null>(null);

  /**
   * SEARCH LOGIC:
   * 1. Check 'staff_registry' directly for existing staff.
   * 2. If not found, check 'profiles' to grab the UUID based on email.
   * 3. Fallback to manual entry with a reminder if email exists in neither.
   */
  const handleSearch = async () => {
    const cleanEmail = searchEmail.trim().toLowerCase();
    if (!cleanEmail) return;
    
    setLoading(true);
    try {
      // Step 1: Query the actual staff_registry table
      const { data: staffData, error: staffError } = await supabase
        .from('staff_registry')
        .select('id, email, role')
        .ilike('email', cleanEmail) 
        .maybeSingle();

      if (staffError) throw staffError;

      if (staffData) {
        setTarget({
          email: staffData.email,
          role: staffData.role,
          id: staffData.id,
          needs_profile: false
        });
      } else {
        // Step 2: Search 'profiles' table to auto-grab UUID for new staff entry
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, email')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profileData) {
          setTarget({
            email: profileData.email,
            role: 'assistant', 
            id: profileData.id,
            is_auto_fetched: true,
            needs_profile: false
          });
        } else {
          // Step 3: Manual Fallback + Reminder
          setTarget({
            email: cleanEmail,
            role: 'assistant',
            id: '',
            needs_profile: true // Triggers the reminder UI
          });
        }
      }
    } catch (err: any) {
      alert("Search Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * SAVE LOGIC:
   * Writes to 'staff_registry'.
   */
  const handleSave = async () => {
    if (!target || !target.id) {
      alert("Error: A valid UUID is required.");
      return;
    }
    
    setSaving(true);
    try {
      if (target.role === 'user') {
        const { error: delErr } = await supabase
          .from('staff_registry')
          .delete()
          .eq('id', target.id);
        
        if (delErr) throw delErr;
      } else {
        const { error: upsertErr } = await supabase
          .from('staff_registry')
          .upsert({ 
            id: target.id, 
            email: target.email,
            role: target.role 
          }, { onConflict: 'id' });
        
        if (upsertErr) throw upsertErr;
      }
      
      alert(`Success: staff_registry updated for ${target.email}`);
      // Refresh state to clear "needs_profile" if they just added it manually
      setTarget({ ...target, needs_profile: false, is_auto_fetched: false });
    } catch (err: any) {
      alert("Update Failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
      <div className="bg-slate-900 p-6 text-white flex items-center gap-4">
        <div className="p-3 bg-indigo-500 rounded-2xl">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold">Staff Registry Manager</h2>
          <p className="text-[10px] uppercase tracking-widest text-indigo-200">Table: staff_registry</p>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="flex gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex-1 flex items-center px-3 gap-3">
            <Mail className="text-slate-400" size={18} />
            <input 
              className="w-full bg-transparent py-2 text-sm font-medium outline-none text-slate-700"
              placeholder="Search email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl transition-all font-bold text-xs"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "LOOKUP"}
          </button>
        </div>

        {target && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            
            {/* --- Profile Creation Reminder --- */}
            {target.needs_profile && (
              <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl items-start">
                <AlertCircle className="text-amber-600 shrink-0" size={18} />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Profile Not Found</p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    This person must first **create a profile** in the application before they can be officially recognized as staff. 
                    Alternatively, you can manually paste their UUID below if you have it.
                  </p>
                </div>
              </div>
            )}

            <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-center justify-between">
              <div>
                <label className="text-[9px] font-black uppercase text-indigo-400">Target User</label>
                <p className="font-bold text-slate-700">{target.email}</p>
              </div>
              <button onClick={() => setTarget(null)} className="text-slate-300 hover:text-red-500 transition-colors">
                <XCircle size={20} />
              </button>
            </div>

            <div className={`p-4 rounded-2xl border space-y-2 ${!target.id ? 'bg-amber-50/50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <Fingerprint size={14} />
                  <label className="text-[10px] font-bold uppercase">User UUID</label>
                </div>
                {target.is_auto_fetched && (
                  <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase">Pulled from Profiles</span>
                )}
              </div>
              <input 
                className={`w-full bg-white border rounded-xl px-4 py-3 text-xs font-mono outline-none ${!target.id ? 'border-amber-300' : 'border-slate-200'}`}
                placeholder="UUID required..."
                value={target.id}
                onChange={(e) => setTarget({...target, id: e.target.value})}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Assign Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['user', 'assistant', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTarget({ ...target, role: r })}
                    className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${
                      target.role === r 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-100 bg-white text-slate-400'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSave} 
              disabled={saving || !target.id}
              className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:bg-slate-200"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <UserCheck size={16} />}
              Update staff_registry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}