import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { X, PackagePlus } from 'lucide-react';
import { Button } from './ui/Button';
import { InlineAlert } from './ui/InlineAlert';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    itemId: string,
    quantity: number,
    capitalPerUnit: number,
    sellingPerUnit: number,
    note: string,
    receiptNumber: string
  ) => void | Promise<void>;
  item: InventoryItem | null;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose, onConfirm, item }) => {
  const [quantity, setQuantity] = useState(1);
  const [capital, setCapital] = useState(0);
  const [selling, setSelling] = useState(0);
  const [note, setNote] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSubmitting(false);
    setError(null);
    if (item) {
      setCapital(item.capitalPrice ?? item.unitPrice ?? 0);
      setSelling(item.unitPrice ?? 0);
      setQuantity(1);
      setNote('');
      setReceiptNumber('');
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await Promise.resolve(onConfirm(item.id, quantity, capital, selling, note, receiptNumber));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-green-50">
          <div className="flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <PackagePlus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Restock / add stock</h2>
              <p className="text-xs text-slate-500">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <InlineAlert message={error} />}
          <div>
            <div className="flex justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Quantity to Add</label>
              <span className="text-xs text-slate-500">
                Current: {item.quantity} {item.unit || 'pcs'}
              </span>
            </div>
            <input
              required
              type="number"
              min={1}
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-slate-400 transition-all shadow-sm"
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
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-slate-400 transition-all shadow-sm"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
            />
            <p className="text-xs text-slate-400 mt-1">Cost basis for this batch (weighted into item capital).</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Selling price per unit (₱)</label>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-slate-400 transition-all shadow-sm"
              value={selling}
              onChange={(e) => setSelling(Number(e.target.value))}
            />
            <p className="text-xs text-slate-400 mt-1">SRP for this batch (weighted into item selling price).</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Receipt Number (Optional)</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-slate-400 transition-all shadow-sm"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="e.g. OR-998877"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Source / Note</label>
            <textarea
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-slate-400 h-20 resize-none transition-all shadow-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Received from Supplier X, Restock..."
            />
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
            >
              {submitting ? 'Saving...' : 'Add stock'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
