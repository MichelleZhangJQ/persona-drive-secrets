"use client";
import { useState } from "react";

export default function PanelUI({ 
  rosewood, 
  number, 
  title, 
  label, 
  labelDetails, // New prop for the popup definition
  archetype, 
  summary, 
  analysis, 
  matrix 
}: any) {
  const [showMatrix, setShowMatrix] = useState(false);
  const [showLabelDef, setShowLabelDef] = useState(false);

  return (
    <section className="bg-white rounded-3xl shadow-xl border-2 p-10 transition-all duration-500 hover:shadow-2xl" style={{ borderColor: rosewood }}>
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: rosewood }}>{number}</div>
          <h2 className="text-lg font-black uppercase tracking-widest" style={{ color: rosewood }}>{title}</h2>
        </div>
        
        {/* Matrix Toggle Button */}
        <button 
          onMouseEnter={() => setShowMatrix(true)} 
          onMouseLeave={() => setShowMatrix(false)} 
          className="text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors"
        >
          View Subtype Logic
        </button>
      </div>

      <div className="relative min-h-[180px]">
        {/* Main Content Layer */}
        <div className={`transition-opacity duration-300 ${showMatrix ? 'opacity-10 blur-sm' : 'opacity-100'}`}>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4 relative">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classification:</span>
              
              {/* Interactive Label with Popup */}
              <div className="relative">
                <button 
                  onMouseEnter={() => setShowLabelDef(true)}
                  onMouseLeave={() => setShowLabelDef(false)}
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white border border-slate-200 cursor-help transition-all hover:bg-slate-50" 
                  style={{ color: rosewood }}
                >
                  {label}
                </button>

                {/* Definition Popup */}
                {showLabelDef && labelDetails && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-800 text-white text-[11px] rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2">
                    <div className="font-bold mb-1 uppercase tracking-tighter text-slate-300 underline decoration-rose-500 underline-offset-4">
                      What is {label}?
                    </div>
                    {labelDetails}
                    {/* Tooltip Arrow */}
                    <div className="absolute top-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-800"></div>
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-xl font-black uppercase tracking-tight mb-4" style={{ color: rosewood }}>{archetype}</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-rose-50/30 border-l-4 rounded-r-xl transition-all" style={{ borderColor: rosewood }}>
                <p className="text-[15px] text-slate-800 font-bold leading-relaxed">{summary}</p>
              </div>
              <p className="text-[14px] text-slate-600 leading-relaxed italic pl-5 border-l border-slate-200">
                <span className="font-bold uppercase text-[10px] text-slate-400 block mb-1">Deeper Insight:</span>
                {analysis}
              </p>
            </div>
          </div>
        </div>

        {/* Matrix Overlay Layer */}
        {showMatrix && (
          <div className="absolute inset-0 z-10 flex items-center justify-center animate-in fade-in zoom-in duration-200">
            <div className="w-full bg-white/95 p-6 rounded-2xl border border-slate-100 shadow-inner">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 text-center">Subtype Matchup Logic</h4>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[9px] text-slate-400 uppercase">
                    <th className="text-left p-2">Drive Path</th>
                    <th className="text-left p-2">Raw Data</th>
                    <th className="text-left p-2">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((m: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-2 font-medium">{m.c1}</td>
                      <td className="p-2 text-slate-400 font-mono">{m.c2}</td>
                      <td className={`p-2 font-black ${m.n === "WIN" || m.n === "SELECTED" || m.n === "PASS" ? "text-green-600" : "text-slate-300"}`}>
                        {m.n}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}