import React, { useEffect, useMemo, useState } from 'react';
import { transactionsApi, loansApi } from '../lib/api/adminData';
import type { Person, Vehicle, Transaction } from '../types';
import type { LoanApi } from '../lib/api/client';
import { X, History, CreditCard, Car } from 'lucide-react';
import { Button } from './ui/Button';
import { InlineAlert } from './ui/InlineAlert';

function norm(s: string | null | undefined) {
  return String(s ?? '')
    .trim()
    .toLowerCase();
}

function typeBadgeClass(t: Transaction) {
  switch (t.type) {
    case 'ADDITION':
      return 'bg-green-100 text-green-700';
    case 'RETURN':
    case 'RETURN_FROM_SALES':
      return 'bg-teal-100 text-teal-700';
    case 'RELEASE':
      return 'bg-orange-100 text-orange-700';
    case 'ISSUE':
      return 'bg-indigo-100 text-indigo-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
}

function typeLabel(t: Transaction) {
  if (t.type === 'RETURN_FROM_SALES') return 'Return from Sales';
  return t.type;
}

interface PersonBusinessHistoryModalProps {
  isOpen: boolean;
  person: Person | null;
  vehicles: Vehicle[];
  onClose: () => void;
}

export const PersonBusinessHistoryModal: React.FC<PersonBusinessHistoryModalProps> = ({
  isOpen,
  person,
  vehicles,
  onClose,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<LoanApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !person) return;
    setLoading(true);
    setError(null);
    Promise.all([transactionsApi.list(), loansApi.list({ customerName: person.fullName, limit: 100 })])
      .then(([txRes, loanRes]) => {
        setTransactions(txRes.transactions ?? []);
        setLoans(loanRes.loans ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load history.'))
      .finally(() => setLoading(false));
  }, [isOpen, person?.id]);

  const myVehicleIds = useMemo(
    () => new Set(vehicles.filter((v) => v.personId === person?.id).map((v) => v.id)),
    [vehicles, person?.id]
  );

  const personVehicles = useMemo(() => vehicles.filter((v) => v.personId === person?.id), [vehicles, person?.id]);

  const relevantTransactions = useMemo(() => {
    if (!person) return [];
    const nameN = norm(person.fullName);
    return transactions
      .filter((t) => {
        if (t.personId && t.personId === person.id) return true;
        if (t.vehicleId && myVehicleIds.has(t.vehicleId)) return true;
        if (nameN && norm(t.recipient) === nameN) return true;
        return false;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, person, myVehicleIds]);

  if (!isOpen || !person) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">Business activity</h2>
              <p className="text-xs text-slate-500">
                {person.fullName} · ID <span className="font-mono">{person.id.slice(0, 8)}…</span>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && <InlineAlert message={error} />}

          {personVehicles.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                <Car className="w-4 h-4 text-amber-600" />
                Linked vehicles
              </div>
              <ul className="text-sm text-slate-700 space-y-1">
                {personVehicles.map((v) => (
                  <li key={v.id}>
                    <span className="font-medium">{v.plateNumber}</span>
                    {[v.brand, v.model, v.year].filter(Boolean).length > 0 && (
                      <span className="text-slate-500"> · {[v.brand, v.model, v.year].filter(Boolean).join(' ')}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              Receivable accounts (name match)
            </h3>
            {loading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : loans.length === 0 ? (
              <p className="text-sm text-slate-500">No receivable records for this customer name.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="py-2 px-3 text-left font-semibold text-slate-500">Status</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500">Total</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500">Remaining</th>
                      <th className="py-2 px-3 text-left font-semibold text-slate-500">Due</th>
                      <th className="py-2 px-3 text-left font-semibold text-slate-500">Txn ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((L) => (
                      <tr key={L.id} className="border-t border-slate-100">
                        <td className="py-2 px-3 capitalize text-slate-800">{L.status}</td>
                        <td className="py-2 px-3 text-right">₱{L.totalAmount.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-medium">₱{L.remainingBalance.toFixed(2)}</td>
                        <td className="py-2 px-3 text-slate-600">{new Date(L.dueDate).toLocaleDateString()}</td>
                        <td className="py-2 px-3 font-mono text-xs text-slate-500">#{L.transactionId.slice(0, 8)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">All linked transactions</h3>
            <p className="text-xs text-slate-500 mb-3">
              Includes rows where this person is the customer/responsible party, their vehicles are linked, or the
              recipient name matches (for older records without person ID).
            </p>
            {loading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : relevantTransactions.length === 0 ? (
              <p className="text-sm text-slate-500">No transactions found for this person yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[360px] overflow-y-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-3 text-left font-semibold text-slate-500">When / ID</th>
                      <th className="py-2 px-3 text-left font-semibold text-slate-500">Type</th>
                      <th className="py-2 px-3 text-left font-semibold text-slate-500">Item</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500">Qty</th>
                      <th className="py-2 px-3 text-right font-semibold text-slate-500">Amount</th>
                      <th className="py-2 px-3 text-left font-semibold text-slate-500">Payment / Party</th>
                      <th className="py-2 px-3 text-left font-semibold text-slate-500">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relevantTransactions.map((t) => (
                      <tr key={t.id} className="border-t border-slate-100 align-top hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-slate-700">
                          <div className="font-mono text-xs text-slate-500">#{t.id.slice(0, 8)}</div>
                          <div className="text-xs">{new Date(t.timestamp).toLocaleString()}</div>
                          {t.receiptNumber && (
                            <div className="text-[10px] text-indigo-600 font-medium mt-0.5">OR# {t.receiptNumber}</div>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeBadgeClass(t)}`}>
                            {typeLabel(t)}
                          </span>
                          {t.itemType && (
                            <div className="text-[10px] text-slate-500 mt-0.5">{t.itemType}</div>
                          )}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">{t.itemName}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{Math.abs(t.quantityChange)}</td>
                        <td className="py-2 px-3 text-right font-medium tabular-nums">₱{t.totalValue.toFixed(2)}</td>
                        <td className="py-2 px-3 text-slate-700">
                          {t.type === 'RELEASE' || t.type === 'ISSUE' ? (
                            <>
                              <div>
                                {t.modeOfPayment === 'Others' && t.modeOfPaymentOther
                                  ? t.modeOfPaymentOther
                                  : t.modeOfPayment ?? '—'}
                              </div>
                              {t.recipient && <div className="text-xs text-slate-500 mt-0.5">To: {t.recipient}</div>}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-xs max-w-[200px]">
                          {t.returnReasonText || t.note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
