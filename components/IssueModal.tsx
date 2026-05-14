import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { X, Send, ChevronDown, Search } from 'lucide-react';
import { Button } from './ui/Button';
import { InlineAlert } from './ui/InlineAlert';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (itemId: string, quantity: number, price: number, recipient: string, note: string) => void | Promise<void>;
  item: InventoryItem | null;
  items: InventoryItem[];
}

export const IssueModal: React.FC<IssueModalProps> = ({ isOpen, onClose, onConfirm, item, items }) => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeItem = item || items.find(i => i.id === selectedItemId);

  useEffect(() => {
    if (isOpen) {
      setSubmitting(false);
      setError(null);
      if (item) {
        setPrice(item.unitPrice);
        setQuantity(1);
        setNote('');
        setRecipient('');
        setSelectedItemId(item.id);
        setItemSearch(item.name);
      } else {
        setPrice(0);
        setQuantity(1);
        setNote('');
        setRecipient('');
        setSelectedItemId('');
        setItemSearch('');
      }
    }
  }, [item, isOpen]);

  useEffect(() => {
    const i = items.find(it => it.id === selectedItemId);
    if (i) setPrice(i.unitPrice);
  }, [selectedItemId, items]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    setError(null);
    setSubmitting(true);
    try {
      await Promise.resolve(onConfirm(activeItem.id, quantity, price, recipient, note));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue item.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((i) =>
    (i.name ?? '').toLowerCase().includes(itemSearch.toLowerCase()) ||
    (i.brand && i.brand.toLowerCase().includes(itemSearch.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Send className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Issue Item</h2>
              <p className="text-xs text-slate-500">Issue out to recipient (returnable)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <InlineAlert message={error} />}
          {!item && (
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Item</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-3 pr-10 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 text-sm"
                  placeholder="Search item name..."
                  value={itemSearch}
                  onChange={(e) => {
                    setItemSearch(e.target.value);
                    setIsDropdownOpen(true);
                    if (e.target.value === '') setSelectedItemId('');
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {isDropdownOpen && filteredItems.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredItems.map(i => (
                    <button
                      key={i.id}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm text-slate-700 border-b border-slate-50 last:border-0"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSelectedItemId(i.id);
                        setItemSearch(i.name);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="font-medium">{i.name}</div>
                      <div className="text-xs text-slate-500 flex justify-between">
                        <span>{i.brand || 'No Brand'}</span>
                        <span>Stock: {i.quantity}</span>
                      </div>
                    </button>
                  ))}
                </div>
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
                <span className="text-slate-500">Available Stock:</span>
                <span className="font-medium text-slate-800">{activeItem.quantity} {activeItem.unit || 'pcs'}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Recipient Name / Department</label>
            <input
              required
              type="text"
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 transition-all shadow-sm"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. John Doe, HR Department"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input
                required
                type="number"
                min="1"
                max={activeItem ? activeItem.quantity : 999999}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 transition-all shadow-sm"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={!activeItem}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price (₱)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 transition-all shadow-sm"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                disabled={!activeItem}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note (Optional)</label>
            <textarea
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 h-20 resize-none transition-all shadow-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. For project use, return by..."
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
              disabled={submitting || !activeItem || quantity > (activeItem?.quantity ?? 0) || quantity <= 0}
            >
              {submitting ? 'Saving...' : 'Confirm Issue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
