import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Person, Vehicle } from '../types';
import { X, RotateCcw, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { InlineAlert } from './ui/InlineAlert';

const REASON_OPTIONS: { value: Transaction['returnReason']; label: string }[] = [
  { value: 'defective', label: 'Defective' },
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'customer_return', label: 'Customer return' },
  { value: 'others', label: 'Others (with text input)' },
];

interface ReturnFromSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    releaseTransactionId: string,
    returnQuantity: number,
    reason: NonNullable<Transaction['returnReason']>,
    reasonOthers: string | undefined,
    condition: 'restock' | 'defective',
    returnReasonText: string
  ) => void | Promise<void>;
  transactions: Transaction[];
  persons?: Person[];
  vehicles?: Vehicle[];
  /** Pre-select this release when modal opens (e.g. from Return button on a row). */
  initialReleaseId?: string | null;
}

export const ReturnFromSalesModal: React.FC<ReturnFromSalesModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  transactions,
  persons = [],
  vehicles = [],
  initialReleaseId,
}) => {
  const [selectedReleaseId, setSelectedReleaseId] = useState('');
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [reason, setReason] = useState<NonNullable<Transaction['returnReason']>>('customer_return');
  const [reasonOthers, setReasonOthers] = useState('');
  const [condition, setCondition] = useState<'restock' | 'defective'>('restock');
  const [returnReasonText, setReturnReasonText] = useState('');
  const [returnReasonError, setReturnReasonError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /** Only Product releases with valid itemId can be returned. Exclude Service, ISSUE, RETURN, summary records. */
  const releaseTransactions = useMemo(
    () =>
      transactions
        .filter(
          (t) =>
            t.type === 'RELEASE' &&
            t.itemType === 'Product' &&
            t.itemId &&
            t.bundledSale !== true &&
            !(t.posLineItems && t.posLineItems.length > 1) &&
            (Math.abs(Number(t.quantityChange)) || 0) > 0
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [transactions]
  );

  const selectedRelease = useMemo(
    () => releaseTransactions.find((t) => t.id === selectedReleaseId),
    [releaseTransactions, selectedReleaseId]
  );

  const alreadyReturned = useMemo(() => {
    if (!selectedReleaseId) return 0;
    return transactions
      .filter((t) => t.type === 'RETURN_FROM_SALES' && t.releaseTransactionId === selectedReleaseId)
      .reduce((sum, t) => sum + Math.abs(t.quantityChange), 0);
  }, [transactions, selectedReleaseId]);

  const releasedQty = selectedRelease ? Math.abs(selectedRelease.quantityChange) : 0;
  const maxReturnable = Math.max(0, releasedQty - alreadyReturned);

  const getPerson = (id: string | null | undefined) => (id ? persons.find((p) => p.id === id) : null);
  const getVehicle = (id: string | null | undefined) => (id ? vehicles.find((v) => v.id === id) : null);
  const responsiblePerson = selectedRelease ? getPerson(selectedRelease.personId) : null;
  const responsibleVehicle = selectedRelease ? getVehicle(selectedRelease.vehicleId) : null;

  useEffect(() => {
    if (isOpen) {
      const id = initialReleaseId && releaseTransactions.some((t) => t.id === initialReleaseId) ? initialReleaseId : '';
      setSelectedReleaseId(id);
      setReturnQuantity(1);
      setReason('customer_return');
      setReasonOthers('');
      setCondition('restock');
      setReturnReasonText('');
      setReturnReasonError('');
      setDropdownOpen(false);
      setSubmitting(false);
      setSubmitError(null);
    }
  }, [isOpen, initialReleaseId, releaseTransactions]);

  useEffect(() => {
    if (maxReturnable > 0 && returnQuantity > maxReturnable) setReturnQuantity(maxReturnable);
  }, [maxReturnable, returnQuantity]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnReasonError('');
    setSubmitError(null);
    const trimmedReason = returnReasonText.trim();
    if (!trimmedReason) {
      setReturnReasonError('Return reason is required.');
      return;
    }
    if (!selectedReleaseId || !selectedRelease) return;
    const qty = Math.min(maxReturnable, Math.max(1, returnQuantity));
    const reasonVal = reason;
    const others = reasonVal === 'others' ? reasonOthers.trim() : undefined;
    if (reasonVal === 'others' && !others) return;
    setSubmitting(true);
    try {
      await Promise.resolve(onConfirm(selectedReleaseId, qty, reasonVal, others, condition, trimmedReason));
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to process return.');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    selectedReleaseId &&
    selectedRelease &&
    maxReturnable > 0 &&
    returnQuantity >= 1 &&
    returnQuantity <= maxReturnable &&
    returnReasonText.trim().length > 0 &&
    (reason !== 'others' || reasonOthers.trim().length > 0);

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up my-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-amber-50">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-2 rounded-lg">
              <RotateCcw className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Return from Sales</h2>
              <p className="text-xs text-slate-500">Process a return from a release/sales transaction</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {submitError && <InlineAlert message={submitError} />}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Release / Sales Transaction</label>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-left"
            >
              <span className={selectedRelease ? 'text-slate-800' : 'text-slate-400'}>
                {selectedRelease
                  ? `${selectedRelease.itemName} · ${releasedQty} pcs to ${selectedRelease.recipient || '—'} (${new Date(selectedRelease.timestamp).toLocaleDateString()})`
                  : 'Choose a release...'}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {releaseTransactions.length === 0 ? (
                    <p className="p-3 text-sm text-slate-500">No Product release transactions to return. Only Product (stock) releases appear here.</p>
                  ) : (
                    releaseTransactions.map((t) => {
                      const released = Math.abs(t.quantityChange);
                      const ret = transactions
                        .filter((x) => x.type === 'RETURN_FROM_SALES' && x.releaseTransactionId === t.id)
                        .reduce((s, x) => s + Math.abs(x.quantityChange), 0);
                      const canReturn = released - ret > 0;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedReleaseId(t.id);
                            setDropdownOpen(false);
                            setReturnQuantity(1);
                          }}
                          disabled={!canReturn}
                          className={`w-full text-left px-4 py-2.5 border-b border-slate-50 last:border-0 text-sm transition-colors ${canReturn ? 'hover:bg-amber-50 text-slate-800' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}
                        >
                          <div className="font-medium">{t.itemName}</div>
                          <div className="text-xs text-slate-500 flex justify-between mt-0.5">
                            <span>{released} pcs → {t.recipient || '—'}</span>
                            <span>{new Date(t.timestamp).toLocaleString()}</span>
                          </div>
                          {ret > 0 && <div className="text-xs text-amber-600 mt-0.5">Already returned: {ret} · Max: {released - ret}</div>}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {selectedRelease && maxReturnable > 0 && (
            <>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <span className="font-medium text-slate-800">{selectedRelease.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Original released quantity:</span>
                  <span className="font-medium text-slate-800">{releasedQty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Already returned:</span>
                  <span className="font-medium text-slate-800">{alreadyReturned}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Remaining returnable:</span>
                  <span className="font-semibold text-amber-700">{maxReturnable}</span>
                </div>
                {(responsiblePerson || selectedRelease.releasedBy) && (
                  <div className="pt-1 border-t border-slate-200 space-y-0.5">
                    {responsiblePerson && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Responsible person:</span>
                        <span className="font-medium text-slate-800">{responsiblePerson.fullName}</span>
                      </div>
                    )}
                    {responsibleVehicle && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Vehicle:</span>
                        <span className="font-medium text-slate-800">{responsibleVehicle.plateNumber}</span>
                      </div>
                    )}
                    {selectedRelease.releasedBy && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Released by:</span>
                        <span className="font-medium text-slate-800">{selectedRelease.releasedBy}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Return Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={maxReturnable}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-xs text-slate-500 mt-1">Cannot exceed {maxReturnable}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Return Reason <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  value={returnReasonText}
                  onChange={(e) => {
                    setReturnReasonText(e.target.value);
                    if (returnReasonError) setReturnReasonError('');
                  }}
                  placeholder="Enter reason for return..."
                  className={`w-full px-3 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-800 resize-y min-h-[80px] ${returnReasonError ? 'border-red-400' : 'border-slate-200'}`}
                  aria-invalid={!!returnReasonError}
                  aria-describedby={returnReasonError ? 'return-reason-error' : undefined}
                />
                {returnReasonError && (
                  <p id="return-reason-error" className="text-sm text-red-600 mt-1">{returnReasonError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason Category</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as NonNullable<Transaction['returnReason']>)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-800"
                >
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {reason === 'others' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specify Reason (Others)</label>
                  <input
                    type="text"
                    value={reasonOthers}
                    onChange={(e) => setReasonOthers(e.target.value)}
                    placeholder="Enter reason..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Item Condition</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="condition"
                      value="restock"
                      checked={condition === 'restock'}
                      onChange={() => setCondition('restock')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-slate-700">Restock (Good Condition)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="condition"
                      value="defective"
                      checked={condition === 'defective'}
                      onChange={() => setCondition('defective')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-slate-700">Defective (Do Not Restock)</span>
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {condition === 'restock' ? 'Quantity will be added back to sellable stock.' : 'Quantity will be recorded as defective/damaged and not added to sellable stock.'}
                </p>
              </div>
            </>
          )}

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
              disabled={submitting || !canSubmit}
              className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
            >
              {submitting ? 'Saving...' : 'Process Return'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
