import React, { useState, useEffect } from 'react';
import { X, Receipt } from 'lucide-react';

const CATEGORIES = ['Utilities', 'Supplies', 'Salary', 'Maintenance', 'Others'] as const;

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; category: string; amount: number; description?: string; date: string }) => void;
  isSaving?: boolean;
  error?: string | null;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving,
  error,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Others');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setCategory('Others');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const numAmount = Number(amount);
    if (!trimmedTitle) return;
    if (!Number.isFinite(numAmount) || numAmount < 0) return;
    if (!date) return;
    onSave({
      title: trimmedTitle,
      category,
      amount: numAmount,
      description: description.trim() || undefined,
      date,
    });
  };

  const canSubmit = title.trim().length > 0 && Number(amount) >= 0 && date.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up my-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-rose-50">
          <div className="flex items-center gap-2">
            <div className="bg-rose-100 p-2 rounded-lg">
              <Receipt className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Add Expense</h2>
              <p className="text-xs text-slate-500">Record an expense</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expense Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder-slate-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Electric bill January"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₱) <span className="text-red-500">*</span></label>
            <input
              type="number"
              required
              min={0}
              step={0.01}
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder-slate-400"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              required
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder-slate-400 h-20 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isSaving}
              className="flex-1 px-4 py-2 text-white bg-rose-600 rounded-lg hover:bg-rose-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
