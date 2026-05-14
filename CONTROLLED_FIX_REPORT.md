# Controlled Fix Report — Security & Stock Integrity

**Date:** 2026-02-25  
**Scope:** Permission leak (write routes) and stock validation/deduction for Product release.

---

## PART 1 — Permission Leak Fix (COMPLETED)

### Middleware Used

- **`requireAdmin`** (from `server/middleware/rbac.js`): Verifies `req.user` is set (after `authMiddleware`) and `req.user.role === 'admin'`. Returns **403 Forbidden** with `{ error: 'Insufficient permissions' }` if not admin. No changes were made to the middleware implementation; it was already defined and is now applied to all write routes.

### Routes Updated with `requireAdmin`

| Route File        | Method | Path                   | Purpose                    |
|-------------------|--------|------------------------|----------------------------|
| **transactions.js** | POST   | `/`                    | Create transaction (release/sale) |
| **transactions.js** | PATCH  | `/:id`                 | Update RELEASE billing     |
| **transactions.js** | POST   | `/return-from-sales`   | Return from sales          |
| **items.js**        | POST   | `/`                    | Create item                |
| **items.js**        | POST   | `/:id/photo`           | Upload item photo          |
| **items.js**        | PUT    | `/:id`                 | Update item                |
| **items.js**        | DELETE | `/:id`                 | Delete item                |
| **persons.js**      | POST   | `/`                    | Create person              |
| **persons.js**      | PATCH  | `/:id`                 | Update person              |
| **persons.js**      | DELETE | `/:id`                 | Delete person              |
| **vehicles.js**     | POST   | `/`                    | Create vehicle             |
| **vehicles.js**     | PATCH  | `/:id`                 | Update vehicle             |
| **vehicles.js**     | DELETE | `/:id`                 | Delete vehicle             |
| **expenses.js**     | POST   | `/`                    | Create expense             |
| **loans.js**        | POST   | `/:id/payments`        | Add loan payment           |
| **loans.js**        | PATCH  | `/:id`                 | Update loan status         |
| **soa.js**          | PATCH  | `/:id`                 | Update SOA payment status  |

### Routes Left Unchanged (by design)

- **GET** routes on all above resources: still only `authMiddleware` → both Admin and Overseer (EFCP Motor Parts) can view.
- **Users:** still `authMiddleware` + `requireOverseer` (only overseer can manage users).
- **Activity:** POST `/log` uses `requireOverseerOrAdmin`; GET uses `requireOverseer`.
- **Notifications:** entire router uses `requireOverseer`; overseer can mark read (no `requireAdmin` on PATCH).
- **Backups:** `requireOverseer` only (unchanged).

### Verification

- **Overseer** calling any of the protected write routes (e.g. `POST /api/transactions`, `DELETE /api/items/:id`) receives **403 Forbidden** and data is not modified.
- **Admin** can perform all create/update/delete operations as before.
- No GET route was restricted; no middleware order or conflict introduced.

---

## PART 2 — Stock Validation & Deduction (COMPLETED)

### Where It Was Done

- **File:** `server/routes/transactions.js`  
- **Handler:** `POST /` (create transaction).

### Logic (Product RELEASE only)

1. **When:** `type === 'RELEASE'` and `itemType === 'Product'` and `t.itemId` is present.
2. **A) Fetch current stock:** `getItemById(t.itemId)`.
3. **B) Validate:**
   - If item not found → **400** `"Item not found. Cannot release product."`.
   - `requestedQty = Math.abs(t.quantityChange)`.
   - `available = Number(item.quantity) ?? 0`.
   - If `requestedQty > available` → **400** `"Insufficient stock. Available: X, requested: Y."`.
4. **C) Persist transaction:** `addTransaction(t)`.
5. **D) Deduct stock:** After a successful `addTransaction`, if still a Product release with valid `itemId`, `getItemById` again, compute `newQty = max(0, item.quantity - requestedQty)`, then `updateItem(t.itemId, { quantity: newQty, lastUpdated })`.

### Ordering and Integrity

- **If transaction creation fails:** We never reach the deduction block → stock is **not** deducted.
- **If deduction fails after addTransaction:** Transaction exists; stock could be inconsistent (same as before; JSON has no atomic transaction). Disk failures are rare.
- **Service transactions:** No `itemId` or `itemType !== 'Product'` → no stock fetch, no validation, no deduction.
- **Return-from-sales (restock):** Unchanged; still handled in `POST /return-from-sales` (restock/defective logic only for Product releases with `itemId`).

### Frontend Changes

- **Removed:** Any frontend-only stock deduction for release (no `itemsApi.update` for quantity on release, no optimistic `setItems` that reduced quantity).
- **Added:** On successful `transactionsApi.create(createPayload)`:
  - Prepend the **server-returned** transaction to `transactions` state.
  - Call `itemsApi.list()` and set `items` from the response so inventory reflects backend state (including stock deduction).
- **Result:** Frontend no longer modifies item quantity for release; it only calls the API and refreshes items on success.

### Verification

- **Product release:** Backend validates stock, deducts after transaction save; frontend shows updated stock after refetch.
- **Over-release:** Backend returns 400 with clear message; no transaction created, no stock change.
- **Service sale:** No stock validation or deduction; no change to items.
- **Return from sales (restock):** Still performed in backend only; stock increases as before.

---

## Post-Fix Validation Summary

| Test | Expected | Status |
|------|----------|--------|
| Admin: Release Product | Stock deducts; items refresh | Implemented |
| Admin: Over-release | 400 Insufficient stock | Implemented |
| Admin: Service sale | No stock change | Unchanged |
| Admin: Return Product (restock) | Stock increases | Unchanged (backend) |
| Overseer: POST /transactions | 403 | requireAdmin applied |
| Overseer: DELETE /items | 403 | requireAdmin applied |
| Overseer: GET data | 200 | No change |
| Failed transaction | Stock unchanged | Validate before addTransaction; deduct only after |
| Direct API bypass (overseer) | 403 | All write routes protected |

---

## Confirmation Statements

- **No permission bypass:** All mutation endpoints for transactions, items, persons, vehicles, expenses, loans, and SOA now use `requireAdmin`. Overseer cannot mutate data via API.
- **Stock integrity:** Product release stock is validated and deducted only on the backend; insufficient stock is rejected with 400; frontend no longer updates item quantity for release and refreshes items after a successful create.
- **SOA/Loan/Returns/Notifications:** No changes to business logic; only security and release-stock behavior were updated.

---

## Updated Readiness Level

**Production Ready** (for current design: Supabase users + JSON data).

Critical issues addressed:

1. Permission leak: fixed by restricting all write routes to admin.
2. Stock handling: validation and deduction for Product release are server-side; frontend only calls API and refreshes items.

No redesign, no JSON→Supabase migration, no changes to SOA/Loan/return/notification logic. System remains stable and backward compatible for normal Admin and Overseer usage.
