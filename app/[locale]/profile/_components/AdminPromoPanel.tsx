"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Ticket } from "lucide-react";

interface PromoCode {
  code: string;
  item_key: string;
  credit_value: number;
  max_uses: number;
  is_active: boolean;
}

export default function AdminPromoPanel() {
  const supabase = createBrowserSupabaseClient();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const MAX_SLOTS = 6;

  useEffect(() => {
    fetchCodes();
  }, []);

  async function fetchCodes() {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(MAX_SLOTS);

    if (data) {
      const emptySlots = MAX_SLOTS - data.length;
      const placeholderData = Array(emptySlots).fill(null).map(() => ({
        code: "",
        item_key: "report_full",
        credit_value: 0,
        max_uses: 500,
        is_active: true,
      }));
      setCodes([...data, ...placeholderData]);
    }
    setLoading(false);
  }

  const handleChange = (index: number, field: keyof PromoCode, value: any) => {
    const newCodes = [...codes];
    newCodes[index] = { ...newCodes[index], [field]: value };
    setCodes(newCodes);
  };

  async function saveAll() {
    setLoading(true);
    const dataToSave = codes.filter((c) => c.code.trim() !== "");
    const { error } = await supabase.from("promo_codes").upsert(dataToSave, {
      onConflict: "code",
    });

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Success: All codes updated.");
      setTimeout(() => setMessage(""), 3000);
      fetchCodes();
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mt-8 transition-all duration-300">
      {/* STATIC HEADER */}
      <div className="w-full flex justify-between items-center p-6 border-b border-slate-50">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-slate-900 rounded-lg text-white">
            <Ticket size={20} />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Promo Code Management</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Configure Store Credits & Discounts</p>
          </div>
        </div>
      </div>

      {/* DIRECT CONTENT */}
      <div className="p-8 animate-in fade-in duration-300">
        <div className="flex justify-end mb-6">
          <button 
            onClick={saveAll}
            disabled={loading}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
          >
            {loading ? "Processing..." : "Update All Slots"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[9px] uppercase font-black text-slate-400 tracking-widest">
                <th className="px-4 pb-2">Code</th>
                <th className="px-4 pb-2">Item</th>
                <th className="px-4 pb-2">Credit ($)</th>
                <th className="px-4 pb-2">Limit</th>
                <th className="px-4 pb-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((promo, idx) => (
                <tr key={idx} className="bg-slate-50/50 rounded-xl">
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="EMPTY"
                      value={promo.code}
                      onChange={(e) => handleChange(idx, "code", e.target.value.toUpperCase())}
                      className="bg-white border border-slate-200 rounded-lg p-2 w-full text-[11px] font-bold focus:ring-2 ring-slate-100 outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={promo.item_key}
                      onChange={(e) => handleChange(idx, "item_key", e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg p-2 w-full text-[11px] font-bold outline-none"
                    >
                      <option value="report_full">Full Report</option>
                      <option value="report_bundle">Bundle</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      value={promo.credit_value}
                      onChange={(e) => handleChange(idx, "credit_value", parseFloat(e.target.value))}
                      className="bg-white border border-slate-200 rounded-lg p-2 w-full text-[11px] font-bold outline-none"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={promo.max_uses}
                      onChange={(e) => handleChange(idx, "max_uses", parseInt(e.target.value))}
                      className="bg-white border border-slate-200 rounded-lg p-2 w-full text-[11px] font-bold outline-none"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={promo.is_active}
                      onChange={(e) => handleChange(idx, "is_active", e.target.checked)}
                      className="h-4 w-4 accent-slate-900 cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-xl text-[10px] font-black uppercase text-center tracking-widest ${message.startsWith('Error') ? 'bg-red-500' : 'bg-slate-900'} text-white animate-pulse`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}