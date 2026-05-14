import express from 'express';
import { requireAdmin } from '../middleware/rbac.js';
import {
  addTransaction,
  createLoan,
  createSoa,
  getItemById,
  getReturnedQuantityForRelease,
  getSoaByTransactionId,
  getTransactionById,
  getTransactions,
  rebuildProductItemInventoryFromLedger,
  updateItem,
  updateTransaction,
  upsertDocumentArchivesForRelease,
} from '../db/store.js';
import { logActivity } from '../services/activityLogger.js';
import { notifyAdminsAboutAction } from '../services/notificationService.js';
import { scheduleViewerSync } from '../services/firebaseViewerSync.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  return res.json({ transactions: await getTransactions() });
});

router.patch('/:id/metadata', requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const existing = await getTransactionById(id);
    if (!existing || (existing.type !== 'RELEASE' && existing.type !== 'ISSUE')) {
      return res.status(400).json({ error: 'Only RELEASE or ISSUE transactions support metadata correction here.' });
    }
    const b = req.body || {};
    const patch = {};
    if (b.recipient !== undefined) patch.recipient = String(b.recipient ?? '').trim() || null;
    if (b.note !== undefined) patch.note = String(b.note ?? '').trim() || null;
    if (b.invoiceNumber !== undefined) patch.invoice_number = String(b.invoiceNumber ?? '').trim() || null;
    if (b.dueDate !== undefined) patch.due_date = String(b.dueDate ?? '').trim() || null;
    if (b.terms !== undefined) patch.terms = String(b.terms ?? '').trim() || null;
    if (b.chequeExpectedClearDate !== undefined) {
      patch.cheque_expected_clear_date = String(b.chequeExpectedClearDate ?? '').trim() || null;
    }
    if (b.chequeReference !== undefined) patch.cheque_reference = String(b.chequeReference ?? '').trim() || null;
    if (b.modeOfPaymentOther !== undefined) {
      patch.mode_of_payment_other = String(b.modeOfPaymentOther ?? '').trim() || null;
    }
    if (b.releasedBy !== undefined) patch.released_by = String(b.releasedBy ?? '').trim() || null;
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'No allowed fields to update.' });
    }
    await updateTransaction(id, patch);
    const updated = await getTransactionById(id);
    const soa = await getSoaByTransactionId(id);
    await upsertDocumentArchivesForRelease(updated, req.user.id, { soaId: soa?.id ?? null });
    await logActivity(req.user.id, 'EDIT_POS_METADATA', {
      transactionId: id,
      fields: Object.keys(patch),
    });
    scheduleViewerSync();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to update transaction metadata.' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const existing = await getTransactionById(id);
    if (!existing || existing.type !== 'ADDITION') {
      return res.status(400).json({ error: 'Only ADDITION (stock-in / restock) records can be edited here.' });
    }
    if (!existing.itemId) {
      return res.status(400).json({ error: 'This addition is not linked to an inventory item.' });
    }

    const qty = Math.abs(Number(req.body?.quantityChange ?? existing.quantityChange));
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than zero.' });
    }

    const cap = Number(req.body?.unitPriceAtTime ?? existing.unitPriceAtTime);
    if (!Number.isFinite(cap) || cap < 0) {
      return res.status(400).json({ error: 'Capital cost per unit must be a valid non-negative number.' });
    }

    const sellIn = req.body?.sellingPriceAtTime;
    const sellResolved =
      sellIn !== undefined && sellIn !== '' && Number.isFinite(Number(sellIn))
        ? Number(sellIn)
        : existing.sellingPriceAtTime != null && Number.isFinite(Number(existing.sellingPriceAtTime))
          ? Number(existing.sellingPriceAtTime)
          : null;

    const note = req.body?.note !== undefined ? String(req.body.note ?? '') : existing.note ?? '';
    const receipt =
      req.body?.receiptNumber !== undefined ? String(req.body.receiptNumber ?? '') : existing.receiptNumber ?? '';
    const editSummary =
      String(req.body?.editSummary || '').trim() || 'Stock addition (restock) corrected.';
    const now = new Date().toISOString();

    await updateTransaction(id, {
      quantity_change: qty,
      unit_price_at_time: cap,
      selling_price_at_time: sellResolved,
      total_value: qty * cap,
      note: note || null,
      receipt_number: receipt || null,
      edited_at: now,
      edit_note: editSummary,
    });

    await rebuildProductItemInventoryFromLedger(existing.itemId);

    await logActivity(req.user.id, 'EDIT_ADDITION', {
      transactionId: id,
      itemId: existing.itemId,
      itemName: existing.itemName,
      quantity: qty,
    });
    await notifyAdminsAboutAction(
      req.user,
      'EDIT_ADDITION',
      `corrected restock #${id.slice(0, 8)} for ${existing.itemName}`
    );
    scheduleViewerSync();

    const updated = await getTransactionById(id);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to update addition.' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const payload = req.body || {};
    const itemType = payload.itemType === 'Service' ? 'Service' : 'Product';
    const quantity = Math.abs(Number(payload.quantityChange ?? 0));
    const type = String(payload.type || '');
    const item = payload.itemId ? await getItemById(payload.itemId) : null;

    if (itemType === 'Product' && !item) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }
    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than zero.' });
    }

    if ((type === 'RELEASE' || type === 'ISSUE') && item && item.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock.' });
    }

    if (item && ['RELEASE', 'ISSUE', 'RETURN', 'ADDITION'].includes(type)) {
      const delta = Number(payload.quantityChange ?? 0);
      if (type === 'ADDITION') {
        const addQty = Math.abs(delta);
        const cost = Number(payload.unitPriceAtTime ?? item.capitalPrice ?? item.unitPrice);
        const sellInput = payload.sellingPriceAtTime ?? payload.selling_price_at_time;
        const sell =
          sellInput != null && sellInput !== ''
            ? Number(sellInput)
            : Number(item.unitPrice);
        const q0 = Number(item.quantity);
        const q1 = q0 + addQty;
        const oldCap = Number(item.capitalPrice ?? item.unitPrice);
        const oldSell = Number(item.unitPrice);
        const newCap = q1 > 0 ? (q0 * oldCap + addQty * cost) / q1 : cost;
        const newSell =
          sellInput != null && sellInput !== '' && Number.isFinite(Number(sellInput))
            ? (q0 * oldSell + addQty * sell) / q1
            : oldSell;
        await updateItem(item.id, {
          quantity: q1,
          unitPrice: newSell,
          capitalPrice: newCap,
          lastUpdated: payload.timestamp,
          receiptNumber: payload.receiptNumber ?? item.receiptNumber ?? null,
        });
      } else {
        await updateItem(item.id, {
          quantity: item.quantity + delta,
          unitPrice: item.unitPrice,
          lastUpdated: payload.timestamp,
          receiptNumber: payload.receiptNumber ?? item.receiptNumber ?? null,
        });
      }
    }

    const created = await addTransaction({
      ...payload,
      itemType,
      releasedBy: req.user.displayName,
    });

    let soaIdForArchive = null;
    if (type === 'RELEASE' && String(payload.modeOfPayment || '').toLowerCase() === 'credit') {
      const dueDays = Math.max(1, Number(payload.dueDays || 30));
      const interestRate = Number(payload.interestRate || 0);
      const downPayment = Math.max(0, Number(payload.downPayment || 0));
      const subtotal = Number(created.totalValue);
      const discountAmount =
        payload.discountPercent != null
          ? subtotal * (Number(payload.discountPercent) / 100)
          : Number(payload.discountAmount || 0);
      const afterDiscount = subtotal - discountAmount;
      const taxAmount =
        payload.taxPercent != null
          ? afterDiscount * (Number(payload.taxPercent) / 100)
          : Number(payload.taxAmount || 0);
      const totalAmountDue = afterDiscount + taxAmount;
      const dueDate = new Date(created.timestamp);
      dueDate.setDate(dueDate.getDate() + dueDays);

      const soa = await createSoa({
        transactionId: created.id,
        customerName: created.recipient || 'Walk-in Customer',
        itemId: created.itemId,
        itemName: created.itemName,
        quantity,
        srp: created.unitPriceAtTime,
        discountPercent: payload.discountPercent ?? null,
        discountAmount: discountAmount || null,
        taxPercent: payload.taxPercent ?? null,
        taxAmount: taxAmount || null,
        totalAmountDue,
        transactionDate: created.timestamp,
        dueDate: dueDate.toISOString(),
        paymentStatus: downPayment >= totalAmountDue ? 'Paid' : downPayment > 0 ? 'Partially Paid' : 'Unpaid',
        personId: payload.personId ?? null,
        vehicleId: payload.vehicleId ?? null,
        vehiclePlateNumber: null,
        itemType,
      });
      soaIdForArchive = soa.id;
      await logActivity(req.user.id, 'CREATE_SOA', {
        soaId: soa.id,
        transactionId: created.id,
        customerName: soa.customerName,
        totalAmountDue: soa.totalAmountDue,
      });

      const principal = Math.max(0, totalAmountDue - downPayment);
      if (principal > 0) {
        const totalAmount = principal + principal * (interestRate / 100);
        await createLoan({
          transactionId: created.id,
          customerName: created.recipient || 'Walk-in Customer',
          totalAmount,
          downPayment,
          remainingBalance: totalAmount,
          interestRate,
          startDate: created.timestamp,
          dueDate: dueDate.toISOString(),
          paymentSchedule: payload.paymentSchedule === 'weekly' ? 'weekly' : 'monthly',
          status: 'ongoing',
          personId: payload.personId ?? null,
          vehicleId: payload.vehicleId ?? null,
          vehiclePlateNumber: null,
        });
      } else if (soa) {
        // Cash-equivalent credit transaction where down payment already covers the billing.
      }
    }

    if (type === 'RELEASE') {
      await upsertDocumentArchivesForRelease(created, req.user.id, { soaId: soaIdForArchive });
    }

    await logActivity(req.user.id, created.type, {
      transactionId: created.id,
      itemId: created.itemId,
      itemName: created.itemName,
      quantity,
      recipient: created.recipient,
      ...(created.type === 'RELEASE'
        ? {
            totalValue: created.totalValue,
            modeOfPayment: created.modeOfPayment,
            posLineCount: Array.isArray(created.posLineItems) ? created.posLineItems.length : 0,
          }
        : {}),
    });
    const actionText =
      created.type === 'ISSUE'
        ? `issued ${quantity} of ${created.itemName} to ${created.recipient || 'internal use'}`
        : created.type === 'RETURN'
          ? `returned ${quantity} of ${created.itemName}`
          : created.type === 'ADDITION'
            ? `added stock for ${created.itemName}`
            : `released ${quantity} of ${created.itemName} to ${created.recipient || 'customer'}`;
    await notifyAdminsAboutAction(req.user, created.type, actionText);
    scheduleViewerSync();
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to create transaction.' });
  }
});

router.post('/return-from-sales', requireAdmin, async (req, res) => {
  try {
    const releaseTransactionId = String(req.body?.releaseTransactionId || '').trim();
    const returnQuantity = Number(req.body?.returnQuantity || 0);
    const reason = req.body?.reason || 'others';
    const condition = req.body?.condition === 'defective' ? 'defective' : 'restock';
    const returnReasonText = String(req.body?.returnReasonText || '').trim();

    const release = await getTransactionById(releaseTransactionId);
    if (!release || release.type !== 'RELEASE') {
      return res.status(404).json({ error: 'Release transaction not found.' });
    }
    if (returnQuantity <= 0) {
      return res.status(400).json({ error: 'Return quantity must be greater than zero.' });
    }

    const releasedQty = Math.abs(Number(release.quantityChange));
    const alreadyReturned = await getReturnedQuantityForRelease(releaseTransactionId);
    if (returnQuantity > releasedQty - alreadyReturned) {
      return res.status(400).json({ error: 'Return quantity exceeds the remaining released quantity.' });
    }

    const item = release.itemId ? await getItemById(release.itemId) : null;
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    if (condition === 'restock') {
      await updateItem(item.id, { quantity: item.quantity + returnQuantity, lastUpdated: nowIso() });
    } else {
      await updateItem(item.id, {
        defectiveQuantity: (item.defectiveQuantity || 0) + returnQuantity,
        lastUpdated: nowIso(),
      });
    }

    const created = await addTransaction({
      id: crypto.randomUUID(),
      itemId: release.itemId,
      itemName: release.itemName,
      type: 'RETURN_FROM_SALES',
      quantityChange: returnQuantity,
      unitPriceAtTime: release.unitPriceAtTime,
      totalValue: returnQuantity * release.unitPriceAtTime,
      timestamp: nowIso(),
      recipient: release.recipient,
      note: returnReasonText || null,
      releaseTransactionId,
      returnReason: reason,
      returnReasonText,
      condition,
      returnProcessedBy: req.user.displayName,
      itemType: 'Product',
    });

    await logActivity(req.user.id, 'RETURN_FROM_SALES', {
      itemId: created.itemId,
      itemName: created.itemName,
      quantity: returnQuantity,
      returnReason: returnReasonText,
    });
    await notifyAdminsAboutAction(
      req.user,
      'RETURN_FROM_SALES',
      `returned ${returnQuantity} of ${created.itemName} from sales`
    );
    scheduleViewerSync();
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to process return from sales.' });
  }
});

function nowIso() {
  return new Date().toISOString();
}

export default router;
