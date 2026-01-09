"use client";

import React, { useMemo, useState } from "react";
import { Loader2, Download } from "lucide-react";
import { InstrumentationPDF } from "./InstrumentationPDF";

export function DownloadInstrumentationPDFButton({
  reportFlow,
  driveDefinitions,
  className,
}: {
  reportFlow: any[];
  driveDefinitions: Record<string, string>;
  className?: string;
}) {
  const [downloading, setDownloading] = useState(false);

  // Make the Document element stable
  const doc = useMemo(
    () => <InstrumentationPDF data={reportFlow} driveDefinitions={driveDefinitions} />,
    [reportFlow, driveDefinitions]
  );

  const onDownload = async () => {
    setDownloading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const blob = await pdf(doc).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Instrumentation-Analysis-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF download failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onDownload}
      disabled={downloading}
      className={
        className ??
        "flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase italic text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-lg disabled:opacity-60"
      }
    >
      {downloading ? (
        <>
          <Loader2 size={14} className="animate-spin" /> Generating…
        </>
      ) : (
        <>
          <Download size={14} /> Download PDF
        </>
      )}
    </button>
  );
}