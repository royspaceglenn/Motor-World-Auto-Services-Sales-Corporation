import React, { useEffect, useState } from 'react';
import { Transaction } from '../types';
import { X, Pencil } from 'lucide-react';
import { Button } from './ui/Button';
import { InlineAlert } from './ui/InlineAlert';

interface EditAdditionTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (
    id: string,
    body: {
      quantityChange: number;
      unitPriceAtTime: number;
      sellingPriceAtTime: number;
      note: string;
      receiptNumber: string;
      editSummary: string;
    }
  ) => void | Promise<void>;
}

export const EditAdditionTransactionModal: React.FC<EditAdditionTransactionModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onSave,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [capital, setCapital] = useState(0);
  const [selling, setSelling] = useState(0);
  const [note, setNote] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSubmitting(false);
    setError(null);
    if (!transaction || !isOpen) return;
    setQuantity(Math.max(1, Math.abs(Number(transaction.quantityChange)) || 1));
    setCapital(Number(transaction.unitPriceAtTime) || 0);
    const s = transaction.sellingPriceAtTime;
    setSelling(s != null && Number.isFinite(Number(s)) ? Number(s) : 0);
    setNote(transaction.note ?? '');
    setReceiptNumber(transaction.receiptNumber ?? '');
    setEditSummary('');
  }, [transaction, isOpen]);

  if (!isOpen || !transaction || transaction.type !== 'ADDITION') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await Promise.resolve(
        onSave(transaction.id, {
          quantityChange: quantity,
          unitPriceAtTime: capital,
          sellingPriceAtTime: selling,
          note,
          receiptNumber,
          editSummary: editSummary.trim(),
        })
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-amber-50">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Pencil className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Edit restock entry</h2>
              <p className="text-xs text-slate-500">{transaction.itemName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">#{transaction.id.slice(0, 8)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <InlineAlert message={error} />}
          <p className="text-xs text-slate-600">
            Saving updates this history row and <span className="font-medium">recomputes on-hand stock</span> from all
            transactions for this item. A correction note is stored on the row.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity received</label>
            <input
              required
              type="number"
              min={1}
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Capital cost per unit (₱)</label>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Selling price per unit (₱)</label>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm"
              value={selling}
              onChange={(e) => setSelling(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Receipt number (optional)</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Source / note</label>
            <textarea
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 h-20 resize-none shadow-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correction summary (optional)</label>
            <textarea
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 h-16 resize-none shadow-sm"
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              placeholder="e.g. Wrong quantity keyed in"
            />
            <p className="text-xs text-slate-400 mt-1">Shown on the transaction when marked as edited.</p>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              disabled={submitting}
              className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
            >
              {submitting ? 'Saving...' : 'Save correction'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
