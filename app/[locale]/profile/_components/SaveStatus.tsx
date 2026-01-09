'use client'
import { CloudCheck, CloudUpload, AlertCircle } from 'lucide-react';

export function SaveStatus({ status, lastSaved }: { status: 'idle' | 'saving' | 'saved' | 'error', lastSaved?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-full border border-slate-200">
      {status === 'saving' && <CloudUpload size={14} className="text-blue-500 animate-pulse" />}
      {status === 'saved' && <CloudCheck size={14} className="text-emerald-500" />}
      {status === 'error' && <AlertCircle size={14} className="text-rose-500" />}
      {status === 'idle' && <CloudCheck size={14} className="text-slate-300" />}
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
        {status === 'saving' ? 'Syncing...' : status === 'error' ? 'Error' : 'Verified'}
      </span>
    </div>
  );
}