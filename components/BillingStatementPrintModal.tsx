import React, { useEffect, useState } from 'react';
import type { Transaction } from '../types';
import {
  loadBillingLetterhead,
  saveBillingLetterhead,
  loadBillingPrePrintedFormPreference,
  saveBillingPrePrintedFormPreference,
  type BillingLetterhead,
} from '../lib/billingLetterhead';
import {
  buildTransactionBillingStatementHtml,
  BILLING_VAT_RATE,
} from '../lib/transactionBillingStatementPrint';
import { openDocumentPreview } from '../lib/documentPreviewBus';
import { Button } from './ui/Button';
import { X, Printer } from 'lucide-react';

interface BillingStatementPrintModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const BillingStatementPrintModal: React.FC<BillingStatementPrintModalProps> = ({
  transaction,
  onClose,
}) => {
  const [registeredName, setRegisteredName] = useState('');
  const [tin, setTin] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [showVat, setShowVat] = useState(false);
  const [prePrintedForm, setPrePrintedForm] = useState(false);

  useEffect(() => {
    if (!transaction) return;
    const h = loadBillingLetterhead();
    setRegisteredName(h.registeredName);
    setTin(h.tin);
    setBusinessAddress(h.businessAddress);
    setShowVat(false);
    setPrePrintedForm(loadBillingPrePrintedFormPreference());
  }, [transaction]);

  if (!transaction) return null;

  const letterhead: BillingLetterhead = {
    registeredName,
    tin,
    businessAddress,
  };

  const handleSaveLetterhead = () => {
    saveBillingLetterhead(letterhead);
  };

  const handlePrint = () => {
    saveBillingLetterhead(letterhead);
    saveBillingPrePrintedFormPreference(prePrintedForm);
    const html = buildTransactionBillingStatementHtml(transaction, letterhead, {
      showVatBreakdown: showVat,
      vatRatePercent: BILLING_VAT_RATE,
      prePrintedForm,
    });
    openDocumentPreview({
      html,
      title: 'Billing statement (preview)',
      filename: `billing-${transaction.id.slice(0, 8)}.pdf`,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up my-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Print billing statement</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
          <p className="text-slate-600">
            A4 portrait layout with up to nine line rows per page. Extra lines continue on additional pages. Letterhead
            fields are saved on this device for the next print.
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Registered name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
              value={registeredName}
              onChange={(e) => setRegisteredName(e.target.value)}
              placeholder="Business / registered name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">TIN (optional)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              placeholder="Tax identification number"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Business address</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 min-h-[72px] resize-y"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="Street, city, province"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showVat}
              onChange={(e) => setShowVat(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-slate-800">
              Show VAT summary ({BILLING_VAT_RATE}% inclusive; net = total ÷ {(1 + BILLING_VAT_RATE / 100).toFixed(2)})
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={prePrintedForm}
              onChange={(e) => setPrePrintedForm(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-slate-700 text-xs leading-snug">
              Pre-printed BIR form overlay (≤ 9 items): print only customer name, item rows, and totals so
              they line up with the pre-printed paper. Sales with more than 9 items print the full
              statement automatically.
            </span>
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleSaveLetterhead}>
              Save letterhead
            </Button>
            <Button type="button" onClick={handlePrint} className="inline-flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Preview & print
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
