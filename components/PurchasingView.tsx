import React, { useState, useEffect } from 'react';
import { Supplier, Purchase, InventoryItem, PurchaseLineItem, PurchaseDiscountMode } from '../types';
import { suppliersApi, purchasesApi, itemsApi } from '../lib/api/adminData';
import { ReceiveFromSupplierModal } from './ReceiveFromSupplierModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { SupplierModal } from './SupplierModal';
import { Truck, PackagePlus, FileText, Pencil, Trash2, Banknote } from 'lucide-react';
import { Button } from './ui/Button';
import { InlineAlert } from './ui/InlineAlert';

interface PurchasingViewProps {
  canEdit: boolean;
  onReceiveComplete?: () => void;
}

export const PurchasingView: React.FC<PurchasingViewProps> = ({ canEdit, onReceiveComplete }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [recordPaymentPurchase, setRecordPaymentPurchase] = useState<Purchase | null>(null);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([suppliersApi.list(), purchasesApi.list(), itemsApi.list()])
      .then(([supRes, purchasesRes, itemsRes]) => {
        setSuppliers(supRes.suppliers ?? []);
        setPurchases(purchasesRes.purchases ?? []);
        setItems((itemsRes.items ?? []) as InventoryItem[]);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load purchasing data.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const apList = purchases.filter((p) => p.paymentType === 'accounts_payable' && (p.status === 'unpaid' || p.status === 'partial'));

  const handleReceive = (data: {
    supplierId: string;
    supplierName: string;
    paymentType: 'cash' | 'accounts_payable';
    receiptNumber?: string;
    note?: string;
    lineItems: PurchaseLineItem[];
    purchaseDiscountMode?: PurchaseDiscountMode;
    purchaseDiscountValue?: number;
  }) => {
    setSaving(true);
    setError(null);
    return purchasesApi
      .create(data)
      .then(() => {
        loadData();
        onReceiveComplete?.();
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to save';
        setError(message);
        throw new Error(message);
      })
      .finally(() => setSaving(false));
  };

  const handleRecordPayment = (amount: number, method: 'cash' | 'cheque' | 'card', paidAt: string, reference?: string) => {
    if (!recordPaymentPurchase) return;
    setSaving(true);
    setError(null);
    return purchasesApi
      .addPayment(recordPaymentPurchase.id, { amount, method, paidAt, reference })
      .then(() => {
        loadData();
        setRecordPaymentPurchase(null);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to record payment';
        setError(message);
        throw new Error(message);
      })
      .finally(() => setSaving(false));
  };

  const handleSaveSupplier = (data: { name: string; contactNumber?: string; address?: string; email?: string; tin?: string }) => {
    setSaving(true);
    setError(null);
    const promise = editSupplier ? suppliersApi.update(editSupplier.id, data) : suppliersApi.create(data);
    promise
      .then((saved) => {
        setSuppliers((prev) => (editSupplier ? prev.map((s) => (s.id === editSupplier.id ? saved : s)) : [saved, ...prev]));
        setSupplierModalOpen(false);
        setEditSupplier(null);
      })
      .catch((err) => setError(err?.message ?? 'Failed to save'))
      .finally(() => setSaving(false));
  };

  const handleDeleteSupplier = (s: Supplier) => {
    if (!window.confirm(`Delete supplier "${s.name}"? This will fail if they have purchases.`)) return;
    suppliersApi
      .delete(s.id)
      .then(() => setSuppliers((prev) => prev.filter((x) => x.id !== s.id)))
      .catch((err) => alert(err?.message ?? 'Could not delete.'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">Loading purchasing data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {error && <InlineAlert message={error} />}
      {/* Receive from Supplier */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <PackagePlus className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Receive from Supplier</h3>
              <p className="text-sm text-slate-500">Receive items and move to inventory. Tag as Cash (paid) or Accounts Payable (to be paid).</p>
            </div>
          </div>
          {canEdit && (
            <Button
              type="button"
              onClick={() => setReceiveModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
            >
              <PackagePlus className="w-4 h-4" />
              Receive from Supplier
            </Button>
          )}
        </div>
      </div>

      {/* Accounts Payable Report */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Accounts Payable</h3>
              <p className="text-sm text-slate-500">Unpaid/partial supplier purchases. Match with supplier billing statements and record payments (cash, cheque, or card terminal).</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 font-semibold text-slate-600">Date</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Supplier</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Receipt #</th>
                <th className="py-3 px-4 font-semibold text-slate-600 text-right">Total (₱)</th>
                <th className="py-3 px-4 font-semibold text-slate-600 text-right">Paid (₱)</th>
                <th className="py-3 px-4 font-semibold text-slate-600 text-right">Balance (₱)</th>
                {canEdit && <th className="py-3 px-4 font-semibold text-slate-600 w-28">Action</th>}
              </tr>
            </thead>
            <tbody>
              {apList.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="py-8 text-center text-slate-400">
                    No accounts payable. Receive purchases with &quot;Accounts Payable&quot; to see them here.
                  </td>
                </tr>
              )}
              {apList.map((p) => {
                const totalPaid = (p.payments ?? []).reduce((s, x) => s + x.amount, 0);
                const balance = p.totalAmount - totalPaid;
                return (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-700">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{p.supplierName}</td>
                    <td className="py-3 px-4 text-slate-600">{p.receiptNumber || '—'}</td>
                    <td className="py-3 px-4 text-right font-medium">₱{p.totalAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-slate-700">₱{totalPaid.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-amber-700">₱{balance.toFixed(2)}</td>
                    {canEdit && balance > 0 && (
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setRecordPaymentPurchase(p)}
                          className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium"
                        >
                          <Banknote className="w-4 h-4" />
                          Record payment
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suppliers */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-lg">
              <Truck className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Suppliers</h3>
              <p className="text-sm text-slate-500">Manage suppliers for receiving and accounts payable.</p>
            </div>
          </div>
          {canEdit && (
            <Button
              type="button"
              onClick={() => { setEditSupplier(null); setError(null); setSupplierModalOpen(true); }}
              variant="secondary"
            >
              Add Supplier
            </Button>
          )}
        </div>
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 font-semibold text-slate-600">Name</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Contact</th>
                <th className="py-3 px-4 font-semibold text-slate-600">TIN</th>
                <th className="py-3 px-4 font-semibold text-slate-600">Address</th>
                {canEdit && <th className="py-3 px-4 font-semibold text-slate-600 w-24">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="py-8 text-center text-slate-400">
                    No suppliers yet. Add one when receiving from supplier, or use Add Supplier.
                  </td>
                </tr>
              )}
              {suppliers.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-800">{s.name}</td>
                  <td className="py-3 px-4 text-slate-600">{s.contactNumber || '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{s.tin || '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{s.address || '—'}</td>
                  {canEdit && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => { setEditSupplier(s); setError(null); setSupplierModalOpen(true); }} className="p-1.5 text-slate-500 hover:text-emerald-600 rounded" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button type="button" onClick={() => handleDeleteSupplier(s)} className="p-1.5 text-slate-500 hover:text-red-600 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ReceiveFromSupplierModal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        onConfirm={handleReceive}
        suppliers={suppliers}
        items={items}
        onSupplierCreated={loadData}
      />
      <RecordPaymentModal
        isOpen={!!recordPaymentPurchase}
        onClose={() => setRecordPaymentPurchase(null)}
        onConfirm={handleRecordPayment}
        purchase={recordPaymentPurchase}
      />
      <SupplierModal
        isOpen={supplierModalOpen}
        onClose={() => { setSupplierModalOpen(false); setEditSupplier(null); setError(null); }}
        onSave={handleSaveSupplier}
        editSupplier={editSupplier}
        isSaving={saving}
        error={error}
      />
    </div>
  );
};
