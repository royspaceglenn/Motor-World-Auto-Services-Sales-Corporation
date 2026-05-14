import React, { useEffect, useState } from 'react';
import {
  documentArchivesApi,
  soaApi,
  transactionsApi,
  USE_FIRESTORE_ADMIN_DATA,
  type DocumentArchiveEntry,
} from '../lib/api/adminData';
import type { Transaction } from '../types';
import { Button } from './ui/Button';
import { DashboardSurface } from './ui/DashboardPrimitives';
import { Eye, RefreshCw, Search } from 'lucide-react';
import { openDocumentPreview } from '../lib/documentPreviewBus';
import { buildReceiptHtml } from './ReceiptPrint';
import {
  BILLING_VAT_RATE,
  buildTransactionBillingStatementHtml,
} from '../lib/transactionBillingStatementPrint';
import { loadBillingLetterhead } from '../lib/billingLetterhead';

interface DocumentArchivesViewProps {
  canEdit: boolean;
}

export const DocumentArchivesView: React.FC<DocumentArchivesViewProps> = ({ canEdit }) => {
  const [archives, setArchives] = useState<DocumentArchiveEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editSoaId, setEditSoaId] = useState<string | null>(null);
  const [soaCustomer, setSoaCustomer] = useState('');
  const [soaItemName, setSoaItemName] = useState('');
  const [soaDue, setSoaDue] = useState('');
  const [editRecipient, setEditRecipient] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editInvoice, setEditInvoice] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editTerms, setEditTerms] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    documentArchivesApi
      .list({ q, kind, from, to, limit: 80, offset: 0 })
      .then((res) => {
        setArchives(res.archives ?? []);
        setTotal(res.total ?? 0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load archives'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- search on demand
  }, []);

  const previewArchive = (row: DocumentArchiveEntry) => {
    const snap = row.transactionSnapshot;
    if (!snap) return;
    const letterhead = loadBillingLetterhead();
    if (row.kind === 'pos_receipt') {
      openDocumentPreview({
        html: buildReceiptHtml(snap),
        title: `POS receipt · #${snap.id.slice(0, 8)}`,
        filename: `pos-receipt-${snap.id.slice(0, 8)}.pdf`,
      });
    } else {
      const html = buildTransactionBillingStatementHtml(snap, letterhead, {
        showVatBreakdown: false,
        vatRatePercent: BILLING_VAT_RATE,
        prePrintedForm: false,
      });
      openDocumentPreview({
        html,
        title: `Billing statement · #${snap.id.slice(0, 8)}`,
        filename: `billing-${snap.id.slice(0, 8)}.pdf`,
      });
    }
  };

  const openEditRelease = (row: DocumentArchiveEntry) => {
    const snap = row.transactionSnapshot;
    if (!snap || (snap.type !== 'RELEASE' && snap.type !== 'ISSUE')) return;
    setEditTx(snap);
    setEditSoaId(null);
    setEditRecipient(snap.recipient || '');
    setEditNote(snap.note || '');
    setEditInvoice(snap.invoiceNumber || '');
    setEditDue(snap.dueDate || '');
    setEditTerms(snap.terms || '');
  };

  const openEditSoa = async (row: DocumentArchiveEntry) => {
    if (!row.soaId) return;
    try {
      const soa = await soaApi.getById(row.soaId);
      setEditTx(null);
      setEditSoaId(soa.id);
      setSoaCustomer(soa.customerName || '');
      setSoaItemName(soa.itemName || '');
      setSoaDue(soa.dueDate ? String(soa.dueDate).slice(0, 10) : '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load SOA');
    }
  };

  const saveReleaseMeta = () => {
    if (!editTx) return;
    setSaving(true);
    transactionsApi
      .patchMetadata(editTx.id, {
        recipient: editRecipient,
        note: editNote,
        invoiceNumber: editInvoice,
        dueDate: editDue,
        terms: editTerms,
      })
      .then(() => {
        setEditTx(null);
        load();
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Save failed'))
      .finally(() => setSaving(false));
  };

  const saveSoaRecord = () => {
    if (!editSoaId) return;
    setSaving(true);
    soaApi
      .patchRecord(editSoaId, {
        customerName: soaCustomer,
        itemName: soaItemName,
        dueDate: soaDue,
      })
      .then(() => {
        setEditSoaId(null);
        load();
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Save failed'))
      .finally(() => setSaving(false));
  };

  const resyncRow = (row: DocumentArchiveEntry) => {
    if (!canEdit) return;
    documentArchivesApi
      .syncTransaction(row.transactionId, row.soaId)
      .then(() => load())
      .catch((e) => setError(e instanceof Error ? e.message : 'Sync failed'));
  };

  return (
    <div className="animate-fade-in space-y-4 max-w-6xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Document archive</h2>
        <p className="text-sm text-slate-600 mt-1">
          Saved POS receipts and billing statement snapshots. New sales are archived automatically on the server.
        </p>
        {USE_FIRESTORE_ADMIN_DATA && (
          <p className="text-xs text-amber-800 mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Document archiving and this search view require the REST API backend (not Firebase-only mode).
          </p>
        )}
      </div>

      <DashboardSurface>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-medium text-slate-500">Search</label>
            <div className="relative mt-0.5">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
                placeholder="Customer or transaction id"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Kind</label>
            <select
              className="mt-0.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:w-44"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="">All</option>
              <option value="pos_receipt">POS receipt</option>
              <option value="billing_statement">Billing statement</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">From</label>
            <input
              type="date"
              className="mt-0.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">To</label>
            <input
              type="date"
              className="mt-0.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <Button type="button" onClick={load} className="shrink-0">
            Apply filters
          </Button>
        </div>

        {error && (
          <div className="mx-4 mb-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto max-h-[560px]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Kind</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : (
                archives.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                      {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-800">{row.kind}</td>
                    <td className="px-4 py-2 text-slate-700">{row.customerName || '—'}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-600">#{row.transactionId.slice(0, 8)}</td>
                    <td className="px-4 py-2 text-right">₱{Number(row.totalValue).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap justify-center gap-1">
                        <button
                          type="button"
                          title="Preview"
                          onClick={() => previewArchive(row)}
                          className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canEdit && row.kind === 'billing_statement' && row.soaId && (
                          <button
                            type="button"
                            title="Edit Statement of Account labels"
                            onClick={() => void openEditSoa(row)}
                            className="rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-900 hover:bg-amber-200"
                          >
                            SOA
                          </button>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            title="Edit sale / release labels (customer, PO, notes)"
                            onClick={() => openEditRelease(row)}
                            className="rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide bg-slate-200 text-slate-800 hover:bg-slate-300"
                          >
                            Sale
                          </button>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            title="Re-sync snapshot from live transaction"
                            onClick={() => resyncRow(row)}
                            className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && archives.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No archived documents yet. Complete a POS sale to create entries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">Showing {archives.length} of {total}</div>
      </DashboardSurface>

      {editTx && (
        <div className="fixed inset-0 z-[1080] flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-3">
            <h3 className="font-bold text-slate-800">Edit POS / release labels</h3>
            <p className="text-xs text-slate-500">Does not change quantities or amounts. Updates the live transaction and archived copies.</p>
            <label className="block text-xs font-medium text-slate-600">Recipient</label>
            <input className="w-full rounded border px-3 py-2 text-sm" value={editRecipient} onChange={(e) => setEditRecipient(e.target.value)} />
            <label className="block text-xs font-medium text-slate-600">Note</label>
            <textarea className="w-full rounded border px-3 py-2 text-sm" rows={2} value={editNote} onChange={(e) => setEditNote(e.target.value)} />
            <label className="block text-xs font-medium text-slate-600">Invoice # (PO)</label>
            <input className="w-full rounded border px-3 py-2 text-sm" value={editInvoice} onChange={(e) => setEditInvoice(e.target.value)} />
            <label className="block text-xs font-medium text-slate-600">Due date</label>
            <input className="w-full rounded border px-3 py-2 text-sm" value={editDue} onChange={(e) => setEditDue(e.target.value)} />
            <label className="block text-xs font-medium text-slate-600">Terms</label>
            <textarea className="w-full rounded border px-3 py-2 text-sm" rows={2} value={editTerms} onChange={(e) => setEditTerms(e.target.value)} />
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditTx(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={saveReleaseMeta} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editSoaId && (
        <div className="fixed inset-0 z-[1080] flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-3">
            <h3 className="font-bold text-slate-800">Edit billing statement (SOA)</h3>
            <p className="text-xs text-slate-500">Customer name, line description, and due date. Totals are unchanged.</p>
            <label className="block text-xs font-medium text-slate-600">Customer</label>
            <input className="w-full rounded border px-3 py-2 text-sm" value={soaCustomer} onChange={(e) => setSoaCustomer(e.target.value)} />
            <label className="block text-xs font-medium text-slate-600">Item / description</label>
            <input className="w-full rounded border px-3 py-2 text-sm" value={soaItemName} onChange={(e) => setSoaItemName(e.target.value)} />
            <label className="block text-xs font-medium text-slate-600">Due date</label>
            <input type="date" className="w-full rounded border px-3 py-2 text-sm" value={soaDue} onChange={(e) => setSoaDue(e.target.value)} />
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditSoaId(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={saveSoaRecord} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
