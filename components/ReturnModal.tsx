import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, Transaction } from '../types';
import { X, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';
import { InlineAlert } from './ui/InlineAlert';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (itemId: string, quantity: number, note: string) => void | Promise<void>;
  item: InventoryItem | null;
  items: InventoryItem[];
  /** Only items with outstanding ISSUE quantity are shown in the select (when item is not pre-selected). */
  transactions: Transaction[];
}

export const ReturnModal: React.FC<ReturnModalProps> = ({ isOpen, onClose, onConfirm, item, items, transactions }) => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issuedQtyByItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === 'ISSUE' && t.itemId) {
        map.set(t.itemId, (map.get(t.itemId) ?? 0) + Math.abs(t.quantityChange));
      }
    }
    return map;
  }, [transactions]);

  const returnedQtyByItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === 'RETURN' && t.itemId) {
        map.set(t.itemId, (map.get(t.itemId) ?? 0) + Math.abs(t.quantityChange));
      }
    }
    return map;
  }, [transactions]);

  const itemsReturnable = useMemo(
    () =>
      items.filter((i) => {
        const issued = issuedQtyByItem.get(i.id) ?? 0;
        const returned = returnedQtyByItem.get(i.id) ?? 0;
        return issued - returned > 0;
      }),
    [items, issuedQtyByItem, returnedQtyByItem]
  );

  const activeItem = item || items.find(i => i.id === selectedItemId);
  const maxReturnable = activeItem
    ? Math.max(0, (issuedQtyByItem.get(activeItem.id) ?? 0) - (returnedQtyByItem.get(activeItem.id) ?? 0))
    : 0;

  useEffect(() => {
    if (isOpen) {
      setSubmitting(false);
      setError(null);
      if (item) {
        setQuantity(1);
        setNote('');
        setSelectedItemId(item.id);
      } else {
        setQuantity(1);
        setNote('');
        setSelectedItemId('');
      }
    }
  }, [item, isOpen]);

  useEffect(() => {
    if (maxReturnable > 0 && quantity > maxReturnable) {
      setQuantity(maxReturnable);
    }
  }, [maxReturnable, quantity]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    setError(null);
    setSubmitting(true);
    try {
      await Promise.resolve(onConfirm(activeItem.id, quantity, note));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to return item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-teal-50">
          <div className="flex items-center gap-2">
            <div className="bg-teal-100 p-2 rounded-lg">
              <RotateCcw className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Return Item</h2>
              <p className="text-xs text-slate-500">Return issued items back to stock</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <InlineAlert message={error} />}
          {!item && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Item</label>
              <select
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                <option value="">Choose item...</option>
                {itemsReturnable.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({Math.max(0, (issuedQtyByItem.get(i.id) ?? 0) - (returnedQtyByItem.get(i.id) ?? 0))} available to return)
                  </option>
                ))}
              </select>
              {itemsReturnable.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">No issued items are currently outstanding. Use Return from Sales for customer sales returns.</p>
              )}
            </div>
          )}

          {activeItem && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Item:</span>
                <span className="font-medium text-slate-800">{activeItem.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Outstanding issue quantity:</span>
                <span className="font-medium text-slate-800">{maxReturnable} {activeItem.unit || 'pcs'}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity Returning</label>
            <input
              required
              type="number"
              min="1"
              max={maxReturnable || undefined}
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400 transition-all shadow-sm"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={!activeItem}
            />
            {activeItem && <p className="text-xs text-slate-500 mt-1">Cannot exceed {maxReturnable}.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note (Optional)</label>
            <textarea
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400 h-20 resize-none transition-all shadow-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Returned by John, condition good"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              disabled={submitting || !activeItem || quantity <= 0 || quantity > maxReturnable}
              className="bg-teal-600 hover:bg-teal-700 focus:ring-teal-500"
            >
              {submitting ? 'Saving...' : 'Confirm Return'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
