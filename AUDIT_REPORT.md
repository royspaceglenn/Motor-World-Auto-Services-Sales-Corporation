# System Audit & Final Validation Report  
**Motor World Auto Services & Sales Corporation / SKPPO Logistics Management System**  
**Node.js + Express + Supabase (and JSON file store)**  
**Audit Date:** 2026-02-25  

---

## Executive Summary

The system implements sales (Product/Service), returns, SOA, loans, persons/vehicles, expenses, activity logs, and notifications. **Only users are stored in Supabase**; all other data (transactions, items, SOA, loans, activity, notifications, persons, vehicles, expenses) is stored in **JSON files** under `server/data/`. Role-based access is enforced in the **UI** (admin vs overseer) but **not** in the API for write operations: any authenticated user can call write endpoints. Stock deduction for Product sales is performed only on the **frontend**; the backend does not deduct stock or validate stock level on release.

**Readiness: Needs Minor Fixes** — Core flows work; recommended fixes address permission enforcement, stock consistency, and one auth middleware pattern.

---

## 1. Role & Permission Verification

### What Works
- **Internal role values** are unchanged: `role === 'overseer'` and `role === 'admin'` used throughout; display labels are separate from these values.
- **RBAC middleware** is correct: `requireOverseer`, `requireOverseerOrAdmin`, `requireRole()` behave as intended.
- **Overseer-only routes** are properly protected: `/api/users`, `/api/activity` GET, `/api/notifications`, `/api/backups` use `authMiddleware` + `requireOverseer`.
- **Activity log** POST uses `requireOverseerOrAdmin`; notifications are created only when the actor is admin.
- **Frontend** correctly hides action buttons from overseer (`canEdit = user?.role === 'admin'`) and shows Activity Log / Manage Users / Notifications only to overseer.

### Errors / Inconsistencies
- **Permission leak (critical):** Write operations are **not** restricted to admin. Routes for transactions, items, SOA, loans, persons, vehicles, and expenses use only `authMiddleware`. An authenticated **overseer** can call:
  - `POST /api/transactions` (create sale, return-from-sales)
  - `PATCH /api/transactions/:id`
  - `POST /api/items`, `PATCH /api/items/:id`, `DELETE /api/items/:id`
  - `POST /api/persons`, `PATCH /api/persons/:id`, `DELETE /api/persons/:id`
  - `POST /api/vehicles`, `PATCH /api/vehicles/:id`, `DELETE /api/vehicles/:id`
  - `POST /api/expenses`
  - `POST /api/loans/:id/payments`, `PATCH /api/loans/:id`
  - `PATCH /api/soa/:id`
  So “view-only operational control” for overseer is enforced only in the UI, not in the API.

**Recommendation:** Add `requireAdmin` (or a dedicated “write” middleware that allows only admin) to all mutation routes (POST/PATCH/DELETE) for transactions, items, persons, vehicles, expenses, loans, and SOA. Keep GET routes with `authMiddleware` only so both roles can read.

---

## 2. Sales Module Validation

### What Works
- **Mode of Payment** is required for RELEASE; validated against allowed list; “Others” requires `modeOfPaymentOther`.
- **Person (Customer)** is required for release; vehicle optional and validated against selected person.
- **Product vs Service:** Backend accepts `itemType`; for Service, `itemId` can be null, service name required, quantity default -1.
- **Credit flow:** When `modeOfPayment === 'Credit'`, SOA and Loan are created automatically with correct linkage (`transactionId`, person, vehicle, due date, down payment, remaining balance).
- **Discount/tax fields** are stored and passed to SOA; billing total comes from transaction `totalValue`.
- **Activity logging** and **notification** triggers fire on release (and discount when applicable).

### Errors / Inconsistencies
- **Stock deduction is not in the backend.** For Product sales, only the **frontend** calls `itemsApi.update(itemId, { quantity: item.quantity - qty })` and then `transactionsApi.create()`. The backend `POST /api/transactions` never updates item quantity. Consequences:
  - Direct API calls (e.g. script or Postman) can create a RELEASE without deducting stock → **inventory can be wrong**.
  - If `transactionsApi.create()` fails after the frontend has already called `itemsApi.update()`, stock is deducted but no transaction exists → **inconsistent state**.
- **No server-side check** that release quantity does not exceed available stock for Product; negative stock is possible if the API is used directly.
- **Billing total:** The frontend sends `totalValue: qty * price` (no discount/tax applied in the payload if the modal computes them). Confirm that the Release modal sends `totalValue`, `discountPercent`, `discountAmount`, `taxPercent`, `taxAmount` when the user applies discounts/taxes so the backend (and thus SOA/Loan) get the correct total.

**Recommendation:** For RELEASE with `itemType === 'Product'` and valid `itemId`, have the backend deduct stock (and validate `quantity <= available stock`) inside `POST /api/transactions` so a single request is authoritative. Optionally make frontend send pre-calculated `totalValue` when discounts/taxes are applied so SOA/Loan totals are always correct.

---

## 3. Returns Validation

### What Works
- **Return reason** is required: `returnReasonText` and `reason` (enum) validated; “others” requires `reasonOthers`.
- **Return quantity** is validated: cannot exceed `releasedQty - alreadyReturned`; clear error message returned.
- **Restock logic:** For Product releases, condition `restock` adds to `item.quantity`, `defective` adds to `item.defectiveQuantity`. Service releases correctly skip item update (`isProductRelease` check).
- **Activity** and **notification** logged for return-from-sales.

### Errors / Inconsistencies
- None identified for return validation or restock.

---

## 4. SOA Consistency Check

### What Works
- **SOA total** is driven by the RELEASE transaction: `updateSoaFromTransaction()` syncs quantity, SRP, discounts, taxes, `total_amount_due` from the transaction. No separate “manual total” field is writable via API.
- **SOA PATCH** allows only `paymentStatus` (Unpaid, Partially Paid, Paid, Overdue); totals are not editable → **no manual override of totals**.
- **Enriched SOA** (`getSoaEnrichedByTransactionId`) returns billing breakdown, payments made, total paid, remaining balance, and computed **status** (Unpaid / Partially Paid / Paid / Overdue) from loan state and due date.
- **Payment updates:** Loan payment route calls `syncSoaPaymentStatusFromLoan(transactionId)` so SOA status stays in sync.
- Formula conceptually: **Billing total (from transaction) − Payments = Remaining balance**; status derived from balance and due date.

### Errors / Inconsistencies
- None identified; SOA is read-only for totals and correctly synced from transaction and loan payments.

---

## 5. Loan Module Verification

### What Works
- **Loan auto-creation** for Credit sales with correct `transactionId`, customer, total, down payment, `remainingBalance = totalAmount - downPayment`, due date, person/vehicle.
- **Balance updates:** `addLoanPayment` reduces `remaining_balance`; loan status becomes `paid` when balance ≤ 0.
- **Overpayment prevented:** `addLoanPayment` returns `{ error: 'Payment cannot exceed remaining balance' }` when `amount > remaining`; route returns 400.
- **SOA sync:** After adding a payment, `syncSoaPaymentStatusFromLoan` is called.
- **Status logic:** `computeLoanStatus` returns unpaid/ongoing/overdue/paid/cash based on balance and due date.
- Loans are created only with a linked RELEASE (Credit); no orphan loan creation path found.
- **Person/vehicle deletion** checks: `personHasActiveCredit` and `vehicleHasLinkedTransactions` used in delete routes; active credit or linked transactions block deletion.

### Errors / Inconsistencies
- None identified.

---

## 6. Person & Vehicle Database Check

### What Works
- **Duplicate person:** `findPersonByFullNameAndContact` used on create and update; duplicate fullName + contactNumber blocked.
- **Duplicate plate:** `findVehicleByPlateNumber` used on create and update; normalized (trim, uppercase) for comparison; duplicate plate blocked.
- **One person, many vehicles:** Vehicles have `person_id`; listing by `personId` works; release flow links person and optional vehicle.
- **Sales/Loans** store `personId` and `vehicleId`; SOA and Loan include person/vehicle info.
- **Delete person** blocked if `personHasActiveCredit`; **delete vehicle** blocked if `vehicleHasLinkedTransactions`.

### Errors / Inconsistencies
- **Foreign key integrity** is application-level only (JSON files); no DB-level FK. Orphan records (e.g. transaction pointing to deleted person ID) are possible if delete validations are bypassed. With current validation in place, normal flows are safe.

---

## 7. Expense Module Validation

### What Works
- **Expense creation:** Title, category, amount, date required; category validated; `recordedBy` and `recordedByUserId` set from `req.user`.
- **Activity log** and **notification** to overseer on add.
- **Filters:** Backend supports category, startDate, endDate; frontend applies them and shows filtered list.
- **Monthly / overall summary:** Frontend computes `totalMonthly` (current month from filtered list) and `totalOverall` (sum of filtered list).

### Errors / Inconsistencies
- **Summary semantics when filters are applied:** When the user sets date range or category filters, `expenses` is the filtered list. Then “Total Expenses (Overall)” is the sum of **filtered** expenses, not all-time overall. So with a date range selected, “Overall” is misleading. **Recommendation:** Either load all expenses for summary and use a separate filtered list for the table, or relabel to “Total (filtered)” when any filter is active.

---

## 8. Notification System Test

### What Works
- **Triggers:** Notifications are created for release, discount, return-from-sales, add/edit/delete item, add person/vehicle, add expense, user created/updated/disabled, and for activity log when actor is admin.
- **Duplicate suppression:** `hasRecentDuplicateNotification` (same source, action, message within 60s) prevents duplicate notifications.
- **Ordering:** `getNotifications` sorts by `created_at` descending → newest first.
- **Mark read:** `markNotificationRead(id)` and `markAllNotificationsRead()` persist to JSON file.
- **Delivery:** Notifications are stored and fetched via API; UI polls (e.g. every 10s) and shows unread count; no WebSocket, so “real-time” is polling-based.

### Errors / Inconsistencies
- Notifications are **global** (one list), not per-user. Only the overseer role can access `/api/notifications` (requireOverseer). So design is “one inbox for overseer”; no issue if that is intended.
- **Mark read** applies to the single notification list; if multiple overseer users existed, they would share the same read state (current design has one overseer).

---

## 9. Database & Structure Audit

### Storage Model
- **Supabase:** Used **only for users** (table `users`: id, email, password_hash, display_name, role, created_at).
- **JSON files** in `server/data/`: activity_logs.json, notifications.json, transactions.json, items.json, soa.json, loans.json, loan_payments.json, persons.json, vehicles.json, expenses.json.
- **Audit requirement “No JSON file storage remains” is not met** — the system deliberately uses JSON for all non-user data. This is an architectural fact, not a bug; only users are in Supabase.

### What Works
- **Async/await:** Store uses sync `readJson`/`writeJson` for file I/O; route handlers that need async (e.g. `getUserById`) use async/await appropriately.
- **Error handling:** Routes generally use try/catch or check results and return 4xx/5xx with JSON error messages.
- **No foreign keys in DB:** Not applicable for JSON; referential integrity is enforced in application code (e.g. person/vehicle delete checks).

### Errors / Inconsistencies
- **Auth middleware pattern:** `authMiddleware` runs an async IIFE but does not return its promise. It calls `next()` or `res.status(401).json(...)` from inside the async callback. Behavior is correct (next handler runs only after auth completes) but the pattern is fragile and can cause “double response” or ordering issues if refactored. **Recommendation:** Refactor to async middleware and await the async work, then call `next()` (e.g. wrap in a function that returns a promise and use it in the middleware chain).
- **Race conditions:** Multiple concurrent requests that read-modify-write the same JSON file (e.g. same item quantity, same loan) can overwrite each other. No file locking or atomic updates. For low concurrency this may be acceptable; for production under load, consider a proper DB or locking.
- **Unused export:** `requireAdmin` is defined in `rbac.js` but never used (only `requireOverseer` and `requireOverseerOrAdmin` are used).

---

## 10. Final System Stability Test (Simulated)

| Scenario | Expected | Notes |
|----------|----------|--------|
| Create Product Sale (Cash) | Transaction created; stock deducted | Stock deducted only if UI flow completes; API-only skips deduction. |
| Create Service Sale (Credit) | Transaction + SOA + Loan; no stock change | Correct. |
| Partial payment | Loan balance decreases; SOA status Partially Paid | Correct. |
| Full payment | Balance = 0; status Paid; SOA synced | Correct. |
| Return from sales | Quantity validated; restock/defective; logged | Correct. |
| Add expense | Stored; logged; notification | Correct. |
| Overpayment | 400, “Payment cannot exceed remaining balance” | Correct. |
| Over-return | 400, “Return quantity cannot exceed…” | Correct. |
| Duplicate plate | 400, “Plate Number already exists” | Correct. |
| Duplicate person (name+contact) | 400, “same Full Name and Contact Number already exists” | Correct. |
| Unauthorized access (no token) | 401 on protected routes | Correct. |
| Overseer calling POST /api/transactions | 201 (permission leak) | Should be 403 if write is admin-only. |

---

## Summary of Findings

### Errors Found
1. **Permission leak:** Write endpoints (transactions, items, persons, vehicles, expenses, loans, SOA) do not restrict to admin; overseer can perform mutations via API.
2. **Stock deduction only on client:** Backend does not deduct inventory on Product release; direct API use or failed transaction create can leave inventory inconsistent.
3. **No server-side stock validation:** Backend does not reject a Product release when quantity exceeds available stock.

### Logic Inconsistencies
1. **Expense summary labels:** “Total Expenses (Overall)” reflects the currently filtered list when filters are applied, not true all-time overall.
2. **Transaction ID:** Frontend uses short IDs (e.g. 8 chars) for new transactions; backend accepts them. Low collision risk but non-standard.

### Security Risks
1. **Overseer can mutate data via API** (see permission leak).
2. **JWT_SECRET** default `'dev-secret-change-in-production'` in code; production must set env.
3. **CORS** `origin: true` accepts any origin; acceptable for dev, consider restricting in production.

### Performance Concerns
1. **JSON read/write** on every request for affected data; no caching. Acceptable for small data sets; may need caching or DB for scale.
2. **Notification list** builds `sourceDisplayName` with a `getUserById` per notification; N+1 pattern. Consider batching or caching user lookups.

### Database Integrity
1. **Only users in Supabase;** rest in JSON — by design.
2. **No transactional boundaries** across multiple JSON files (e.g. transaction + item update); a failure between two writes can leave partial state.
3. **Orphan records:** Possible if deletes are forced (e.g. direct file edit); normal API flows enforce person/vehicle delete checks.

### Code Cleanup Recommendations
1. Add **requireAdmin** (or equivalent) to all write routes for transactions, items, persons, vehicles, expenses, loans, SOA.
2. **Refactor authMiddleware** to async/await and call `next()` after await so the chain is clear.
3. **Backend stock deduction and validation** for Product RELEASE: in `POST /api/transactions`, when `type === 'RELEASE'` and `itemType === 'Product'` and `itemId` present, validate `quantity <= item.quantity` and then decrement `item.quantity`.
4. **Expense summary:** When filters are applied, either compute overall from full list (separate endpoint or field) or change label to “Total (filtered)”.
5. Remove or start using **requireAdmin** to avoid dead code.

---

## System Readiness: **Needs Minor Fixes**

- **Core behavior:** Sales (Product/Service), returns, SOA, loans, persons, vehicles, expenses, notifications, and activity logs work as designed for normal UI usage.
- **Fixes recommended before production:**  
  - Enforce **admin-only write** on mutation routes.  
  - Move **stock deduction and stock validation** for Product release into the backend.  
  - Optionally harden **auth middleware** and **expense summary** labeling.

After applying the permission and stock-related fixes, the system can be considered **Production Ready** for the current design (Supabase for users, JSON for rest).
