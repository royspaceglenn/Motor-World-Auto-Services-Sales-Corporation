import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Printer, FileDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { DocumentPreviewDoc } from '../lib/documentPreviewBus';
import { Button } from './ui/Button';

interface DocumentPrintPreviewModalProps {
  docs: DocumentPreviewDoc[] | null;
  onClose: () => void;
}

export const DocumentPrintPreviewModal: React.FC<DocumentPrintPreviewModalProps> = ({ docs, onClose }) => {
  const [tab, setTab] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    setTab(0);
  }, [docs]);

  const active = docs && docs.length > 0 ? docs[Math.min(tab, docs.length - 1)] : null;

  const runPrint = useCallback(() => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    w.focus();
    setTimeout(() => w.print(), 200);
  }, []);

  const runSavePdf = useCallback(async () => {
    if (!active) return;
    const iframe = iframeRef.current;
    const body = iframe?.contentDocument?.body;
    if (!body) return;
    setPdfBusy(true);
    try {
      const mod = await import('html2pdf.js');
      const html2pdf = mod.default;
      await html2pdf()
        .set({
          margin: [0.4, 0.4, 0.4, 0.4],
          filename: active.filename.endsWith('.pdf') ? active.filename : `${active.filename}.pdf`,
          image: { type: 'jpeg', quality: 0.92 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(body)
        .save();
    } catch (e) {
      console.error(e);
      window.alert('Could not generate PDF. You can still use Print and choose "Save as PDF" in the system dialog.');
    } finally {
      setPdfBusy(false);
    }
  }, [active]);

  if (!docs || docs.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <div className="flex h-[min(92vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-slate-800 sm:text-lg">Print preview</h2>
            <p className="truncate text-xs text-slate-500">{active?.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {docs.length > 1 && (
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-2">
            <button
              type="button"
              disabled={tab <= 0}
              onClick={() => setTab((t) => Math.max(0, t - 1))}
              className="rounded-lg p-1.5 text-slate-600 disabled:opacity-40 hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-slate-600">
              {tab + 1} / {docs.length}
            </span>
            <button
              type="button"
              disabled={tab >= docs.length - 1}
              onClick={() => setTab((t) => Math.min(docs.length - 1, t + 1))}
              className="rounded-lg p-1.5 text-slate-600 disabled:opacity-40 hover:bg-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="ml-2 flex flex-wrap gap-1">
              {docs.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTab(i)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    i === tab ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 bg-slate-100 p-2 sm:p-3">
          <iframe
            key={`${tab}-${active?.filename}`}
            ref={iframeRef}
            title={active?.title || 'Preview'}
            className="h-full w-full rounded-lg border border-slate-200 bg-white shadow-inner"
            srcDoc={active?.html}
          />
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="inline-flex items-center gap-2"
            onClick={() => void runSavePdf()}
            disabled={pdfBusy}
          >
            <FileDown className="h-4 w-4" />
            {pdfBusy ? 'Preparing PDF…' : 'Save as PDF'}
          </Button>
          <Button type="button" className="inline-flex items-center gap-2" onClick={runPrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
};
