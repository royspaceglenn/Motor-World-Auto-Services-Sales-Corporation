import fs from 'fs';
import path from 'path';
import { getAdminDb, getAdminStorage, getFirebaseShopId, getRootDir } from './firebase-admin.mjs';

const rootDir = getRootDir();
const serverDataDir = path.join(rootDir, 'server', 'data');
const uploadsDir = path.join(rootDir, 'server', 'public', 'uploads');
const shopId = getFirebaseShopId();

function readJson(filename, defaultValue = []) {
  const filePath = path.join(serverDataDir, filename);
  if (!fs.existsSync(filePath)) return defaultValue;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toItem(row) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? '',
    category: row.category ?? '',
    quantity: Number(row.quantity ?? 0),
    unit: row.unit ?? 'pcs',
    unitPrice: Number(row.unit_price ?? row.unitPrice ?? 0),
    description: row.description ?? '',
    minStockLevel: Number(row.min_stock_level ?? row.minStockLevel ?? 0),
    lastUpdated: row.last_updated ?? row.lastUpdated ?? new Date().toISOString(),
    receiptNumber: row.receipt_number ?? row.receiptNumber ?? null,
    defectiveQuantity: Number(row.defective_quantity ?? row.defectiveQuantity ?? 0),
    photoFilename: row.photo_filename ?? row.photoFilename ?? null,
  };
}

function toTransaction(row) {
  return {
    id: row.id,
    itemId: row.item_id ?? row.itemId ?? null,
    itemName: row.item_name ?? row.itemName ?? '',
    type: row.type,
    quantityChange: Number(row.quantity_change ?? row.quantityChange ?? 0),
    unitPriceAtTime: Number(row.unit_price_at_time ?? row.unitPriceAtTime ?? 0),
    totalValue: Number(row.total_value ?? row.totalValue ?? 0),
    timestamp: row.timestamp ?? new Date().toISOString(),
    recipient: row.recipient ?? null,
    note: row.note ?? null,
    receiptNumber: row.receipt_number ?? row.receiptNumber ?? null,
    releaseTransactionId: row.release_transaction_id ?? row.releaseTransactionId ?? null,
    returnReason: row.return_reason ?? row.returnReason ?? null,
    returnReasonOthers: row.return_reason_others ?? row.returnReasonOthers ?? null,
    returnReasonText: row.return_reason_text ?? row.returnReasonText ?? null,
    condition: row.condition ?? null,
    modeOfPayment: row.mode_of_payment ?? row.modeOfPayment ?? null,
    modeOfPaymentOther: row.mode_of_payment_other ?? row.modeOfPaymentOther ?? null,
    personId: row.person_id ?? row.personId ?? null,
    vehicleId: row.vehicle_id ?? row.vehicleId ?? null,
    discountPercent: row.discount_percent ?? row.discountPercent ?? null,
    discountAmount: row.discount_amount ?? row.discountAmount ?? null,
    taxPercent: row.tax_percent ?? row.taxPercent ?? null,
    taxAmount: row.tax_amount ?? row.taxAmount ?? null,
    itemType: row.item_type ?? row.itemType ?? 'Product',
    releasedBy: row.released_by ?? row.releasedBy ?? null,
    returnProcessedBy: row.return_processed_by ?? row.returnProcessedBy ?? null,
    purchaseId: row.purchase_id ?? row.purchaseId ?? null,
    invoiceNumber: row.invoice_number ?? row.invoiceNumber ?? null,
    dueDate: row.due_date ?? row.dueDate ?? null,
    terms: row.terms ?? null,
  };
}

function toPerson(row) {
  return {
    id: row.id,
    fullName: row.full_name ?? row.fullName ?? '',
    contactNumber: row.contact_number ?? row.contactNumber ?? '',
    address: row.address ?? '',
    email: row.email ?? '',
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  };
}

function toVehicle(row) {
  return {
    id: row.id,
    personId: row.person_id ?? row.personId ?? '',
    plateNumber: row.plate_number ?? row.plateNumber ?? '',
    brand: row.brand ?? '',
    model: row.model ?? '',
    year: row.year ?? null,
    color: row.color ?? '',
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  };
}

function toExpense(row) {
  return {
    id: row.id,
    title: row.expense_title ?? row.title ?? '',
    category: row.category ?? 'Others',
    amount: Number(row.amount ?? 0),
    description: row.description ?? '',
    date: row.expense_date ?? row.date ?? '',
    recordedBy: row.recorded_by ?? row.recordedBy ?? '',
    recordedByUserId: row.recorded_by_user_id ?? row.recordedByUserId ?? null,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  };
}

function toSupplier(row) {
  return {
    id: row.id,
    name: row.name ?? '',
    contactNumber: row.contact_number ?? row.contactNumber ?? '',
    address: row.address ?? '',
    email: row.email ?? '',
    tin: row.tin ?? row.tin_number ?? '',
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  };
}

function toPurchase(row) {
  return {
    id: row.id,
    supplierId: row.supplier_id ?? row.supplierId ?? '',
    supplierName: row.supplier_name ?? row.supplierName ?? '',
    purchaseDate: row.purchase_date ?? row.purchaseDate ?? row.created_at ?? row.createdAt ?? new Date().toISOString(),
    paymentType: row.payment_type ?? row.paymentType ?? 'cash',
    totalAmount: Number(row.total_amount ?? row.totalAmount ?? 0),
    status: row.status ?? 'unpaid',
    receiptNumber: row.receipt_number ?? row.receiptNumber ?? null,
    note: row.note ?? null,
    lineItems: (row.line_items ?? row.lineItems ?? []).map((item) => ({
      itemId: item.item_id ?? item.itemId ?? '',
      itemName: item.item_name ?? item.itemName ?? '',
      quantity: Number(item.quantity ?? 0),
      unitCost: Number(item.unit_cost ?? item.unitCost ?? 0),
      total: Number(item.total ?? 0),
    })),
    payments: (row.payments ?? []).map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount ?? 0),
      method: payment.method ?? 'cash',
      paidAt: payment.paid_at ?? payment.paidAt ?? '',
      reference: payment.reference ?? null,
    })),
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  };
}

function toSoa(row) {
  return {
    id: row.id,
    transactionId: row.transaction_id ?? row.transactionId ?? '',
    customerName: row.customer_name ?? row.customerName ?? '',
    itemId: row.item_id ?? row.itemId ?? null,
    itemName: row.item_name ?? row.itemName ?? '',
    quantity: Number(row.quantity ?? 0),
    srp: Number(row.srp ?? 0),
    discountPercent: row.discount_percent ?? row.discountPercent ?? null,
    discountAmount: row.discount_amount ?? row.discountAmount ?? null,
    taxPercent: row.tax_percent ?? row.taxPercent ?? null,
    taxAmount: row.tax_amount ?? row.taxAmount ?? null,
    totalAmountDue: Number(row.total_amount_due ?? row.totalAmountDue ?? 0),
    transactionDate: row.transaction_date ?? row.transactionDate ?? '',
    dueDate: row.due_date ?? row.dueDate ?? '',
    paymentStatus: row.payment_status ?? row.paymentStatus ?? 'Unpaid',
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    personId: row.person_id ?? row.personId ?? null,
    vehicleId: row.vehicle_id ?? row.vehicleId ?? null,
    vehiclePlateNumber: row.vehicle_plate_number ?? row.vehiclePlateNumber ?? null,
    itemType: row.item_type ?? row.itemType ?? 'Product',
  };
}

function toSoaPayment(row) {
  return {
    id: row.id,
    soaId: row.soa_id ?? row.soaId ?? '',
    amountPaid: Number(row.amount_paid ?? row.amountPaid ?? 0),
    paidAt: row.paid_at ?? row.paidAt ?? new Date().toISOString(),
    method: row.method ?? 'cash',
    reference: row.reference ?? null,
    note: row.note ?? null,
  };
}

function toLoan(row) {
  return {
    id: row.id,
    transactionId: row.transaction_id ?? row.transactionId ?? '',
    customerName: row.customer_name ?? row.customerName ?? '',
    totalAmount: Number(row.total_amount ?? row.totalAmount ?? 0),
    downPayment: Number(row.down_payment ?? row.downPayment ?? 0),
    remainingBalance: Number(row.remaining_balance ?? row.remainingBalance ?? 0),
    interestRate: row.interest_rate ?? row.interestRate ?? null,
    startDate: row.start_date ?? row.startDate ?? '',
    dueDate: row.due_date ?? row.dueDate ?? '',
    paymentSchedule: row.payment_schedule ?? row.paymentSchedule ?? 'monthly',
    status: row.status ?? 'unpaid',
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
    personId: row.person_id ?? row.personId ?? null,
    vehicleId: row.vehicle_id ?? row.vehicleId ?? null,
    vehiclePlateNumber: row.vehicle_plate_number ?? row.vehiclePlateNumber ?? null,
  };
}

function toLoanPayment(row) {
  return {
    id: row.id,
    loanId: row.loan_id ?? row.loanId ?? '',
    amountPaid: Number(row.amount_paid ?? row.amountPaid ?? 0),
    paidAt: row.paid_at ?? row.paidAt ?? new Date().toISOString(),
    remainingBalanceAfter: Number(row.remaining_balance_after ?? row.remainingBalanceAfter ?? 0),
    note: row.note ?? null,
  };
}

function toNotification(row) {
  return {
    id: row.id,
    sourceUserId: row.source_user_id ?? row.sourceUserId ?? '',
    actionType: row.action_type ?? row.actionType ?? '',
    message: row.message ?? '',
    read: Number(row.read ?? 0),
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    sourceDisplayName: row.source_display_name ?? row.sourceDisplayName ?? '',
    sourceEmail: row.source_email ?? row.sourceEmail ?? '',
  };
}

function toActivityLog(row) {
  return {
    id: row.id,
    userId: row.user_id ?? row.userId ?? '',
    actionType: row.action_type ?? row.actionType ?? '',
    metadata:
      typeof row.metadata === 'string'
        ? row.metadata
        : JSON.stringify(row.metadata ?? {}),
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    userDisplayName: row.user_display_name ?? row.userDisplayName ?? '',
    userEmail: row.user_email ?? row.userEmail ?? '',
  };
}

async function writeCollection(db, collectionName, rows) {
  if (!rows.length) return;
  const batchSize = 250;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = db.batch();
    const slice = rows.slice(index, index + batchSize);
    slice.forEach((row) => {
      const ref = db.collection('shops').doc(shopId).collection(collectionName).doc(String(row.id));
      const { id, ...data } = row;
      batch.set(ref, data, { merge: true });
    });
    await batch.commit();
    console.log(`Migrated ${Math.min(index + batchSize, rows.length)} / ${rows.length} into ${collectionName}`);
  }
}

async function uploadPhotos(items) {
  if (!fs.existsSync(uploadsDir)) {
    return;
  }

  const storage = getAdminStorage();
  const bucket = storage.bucket();

  for (const item of items) {
    if (!item.photoFilename) continue;
    const sourcePath = path.join(uploadsDir, item.photoFilename);
    if (!fs.existsSync(sourcePath)) continue;

    const destination = `shops/${shopId}/items/${item.id}/${item.photoFilename}`;
    await bucket.upload(sourcePath, { destination });
    await getAdminDb()
      .collection('shops')
      .doc(shopId)
      .collection('items')
      .doc(item.id)
      .set(
        {
          photoStoragePath: destination,
        },
        { merge: true }
      );
    console.log(`Uploaded ${item.photoFilename} -> ${destination}`);
  }
}

async function main() {
  const db = getAdminDb();

  const items = readJson('items.json').map(toItem);
  const transactions = readJson('transactions.json').map(toTransaction);
  const persons = readJson('persons.json').map(toPerson);
  const vehicles = readJson('vehicles.json').map(toVehicle);
  const expenses = readJson('expenses.json').map(toExpense);
  const suppliers = readJson('suppliers.json').map(toSupplier);
  const purchases = readJson('purchases.json').map(toPurchase);
  const soas = readJson('soa.json').map(toSoa);
  const soaPayments = readJson('soa_payments.json').map(toSoaPayment);
  const loans = readJson('loans.json').map(toLoan);
  const loanPayments = readJson('loan_payments.json').map(toLoanPayment);
  const notifications = readJson('notifications.json').map(toNotification);
  const activityLogs = readJson('activity_logs.json').map(toActivityLog);

  await writeCollection(db, 'items', items);
  await writeCollection(db, 'transactions', transactions);
  await writeCollection(db, 'persons', persons);
  await writeCollection(db, 'vehicles', vehicles);
  await writeCollection(db, 'expenses', expenses);
  await writeCollection(db, 'suppliers', suppliers);
  await writeCollection(db, 'purchases', purchases);
  await writeCollection(db, 'soas', soas);
  await writeCollection(db, 'soaPayments', soaPayments);
  await writeCollection(db, 'loans', loans);
  await writeCollection(db, 'loanPayments', loanPayments);
  await writeCollection(db, 'notifications', notifications);
  await writeCollection(db, 'activityLogs', activityLogs);

  await uploadPhotos(items);
  console.log(`Migration complete for shop "${shopId}".`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
