import React, { useEffect, useState, useMemo } from 'react';
import { expensesApi } from '../lib/api/adminData';
import type { Expense } from '../types';
import { AddExpenseModal } from './AddExpenseModal';
import { Receipt, Plus, Calendar, Filter } from 'lucide-react';
import { Button } from './ui/Button';
import { InlineAlert } from './ui/InlineAlert';

interface ExpensesViewProps {
  canEdit: boolean;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ canEdit }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadExpenses = () => {
    setLoading(true);
    setError(null);
    expensesApi
      .list({
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      .then((res) => setExpenses(res.expenses ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load expenses.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExpenses();
  }, [categoryFilter, startDate, endDate]);

  const handleSaveExpense = (data: { title: string; category: string; amount: number; description?: string; date: string }) => {
    setSaving(true);
    setError(null);
    expensesApi
      .create(data)
      .then((created) => {
        setExpenses((prev) => [created, ...prev]);
        setModalOpen(false);
      })
      .catch((err) => setError(err?.message ?? 'Failed to save expense'))
      .finally(() => setSaving(false));
  };

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const totalOverall = useMemo(() => expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0), [expenses]);
  const totalMonthly = useMemo(
    () =>
      expenses
        .filter((e) => {
          const d = e.date ? new Date(e.date) : null;
          if (!d) return false;
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, e) => sum + (e.amount ?? 0), 0),
    [expenses]
  );

  const categories = ['All', 'Utilities', 'Supplies', 'Salary', 'Maintenance', 'Others'];
  const hasActiveFilters = categoryFilter !== 'All' || !!startDate || !!endDate;
  const overallLabel = hasActiveFilters ? 'Total (Filtered)' : 'Total (All-Time)';

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Expenses</h2>
          <p className="text-sm text-slate-500">Track and filter expenses. Recorded by is set automatically.</p>
        </div>
        {canEdit && (
          <Button
            onClick={() => { setModalOpen(true); setError(null); }}
            className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        )}
      </div>
      {error && <InlineAlert message={error} />}

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-rose-100 p-3 rounded-lg">
              <Receipt className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Expenses (This Month)</p>
              <p className="text-2xl font-bold text-slate-800">₱{totalMonthly.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-3 rounded-lg">
              <Receipt className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{overallLabel}</p>
              <p className="text-2xl font-bold text-slate-800">₱{totalOverall.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filters</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
            <select
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From date</label>
            <input
              type="date"
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To date</label>
            <input
              type="date"
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {(categoryFilter !== 'All' || startDate || endDate) && (
            <button
              type="button"
              onClick={() => { setCategoryFilter('All'); setStartDate(''); setEndDate(''); }}
              className="text-sm text-rose-600 hover:text-rose-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No expenses recorded yet. Use “Add Expense” to add one.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-6 text-xs font-semibold uppercase text-slate-500">Title</th>
                  <th className="py-3 px-6 text-xs font-semibold uppercase text-slate-500">Category</th>
                  <th className="py-3 px-6 text-xs font-semibold uppercase text-slate-500 text-right">Amount (₱)</th>
                  <th className="py-3 px-6 text-xs font-semibold uppercase text-slate-500">Date</th>
                  <th className="py-3 px-6 text-xs font-semibold uppercase text-slate-500">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="py-3 px-6 font-medium text-slate-800">{e.title}</td>
                    <td className="py-3 px-6">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right font-medium text-slate-800">
                      ₱{(e.amount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-6 text-slate-600">
                      {e.date ? new Date(e.date).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-6 text-slate-600">{e.recordedBy || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddExpenseModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setError(null); }}
        onSave={handleSaveExpense}
        isSaving={saving}
        error={error}
      />
    </div>
  );
};
