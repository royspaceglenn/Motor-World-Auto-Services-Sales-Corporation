import React, { useState, useEffect } from 'react';
import { Purchase } from '../types';
import { X, Banknote } from 'lucide-react';
import { Button } from './ui/Button';
import { InlineAlert } from './ui/InlineAlert';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, method: 'cash' | 'cheque' | 'card', paidAt: string, reference?: string) => void | Promise<void>;
  purchase: Purchase | null;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, onConfirm, purchase }) => {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<'cash' | 'cheque' | 'card'>('cash');
  const [paidAt, setPaidAt] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && purchase) {
      const totalPaid = (purchase.payments ?? []).reduce((s, p) => s + p.amount, 0);
      const remaining = purchase.totalAmount - totalPaid;
      setAmount(remaining);
      setPaidAt(new Date().toISOString().slice(0, 16));
      setReference('');
      setMethod('cash');
      setSubmitting(false);
      setError(null);
    }
  }, [isOpen, purchase]);

  if (!isOpen || !purchase) return null;

  const totalPaid = (purchase.payments ?? []).reduce((s, p) => s + p.amount, 0);
  const remaining = purchase.totalAmount - totalPaid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Math.max(0, Number(amount));
    if (amt <= 0) return;
    if (amt > remaining) return;
    setError(null);
    setSubmitting(true);
    try {
      await Promise.resolve(onConfirm(amt, method, paidAt || new Date().toISOString(), reference.trim() || undefined));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-amber-50">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Banknote className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Record Payment</h2>
              <p className="text-xs text-slate-500">{purchase.supplierName} · Receipt #{purchase.receiptNumber || purchase.id.slice(0, 8)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <InlineAlert message={error} />}
          <div className="bg-slate-50 p-3 rounded-lg text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Total amount:</span><span className="font-medium">₱{purchase.totalAmount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Already paid:</span><span className="font-medium">₱{totalPaid.toFixed(2)}</span></div>
            <div className="flex justify-between pt-1 border-t border-slate-200"><span className="text-slate-500">Remaining:</span><span className="font-semibold text-amber-700">₱{remaining.toFixed(2)}</span></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₱) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min={0.01}
              max={remaining}
              step={0.01}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <p className="text-xs text-slate-500 mt-1">Max: ₱{remaining.toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment method <span className="text-red-500">*</span></label>
            <select
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              value={method}
              onChange={(e) => setMethod(e.target.value as 'cash' | 'cheque' | 'card')}
            >
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card terminal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date & time</label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reference (e.g. cheque no. or card transaction ref)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              disabled={submitting || remaining <= 0 || Number(amount) <= 0 || Number(amount) > remaining}
              className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
            >
              {submitting ? 'Saving...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
