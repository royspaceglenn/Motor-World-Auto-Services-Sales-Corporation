# Motor World Auto Services & Sales Corporation — System Overview

**Category:** All-in-One Business & Operations System  
*(Unified system for sales, inventory, customers, transactions, credit, and operations — not labeled as POS.)*

This document lists all current functionalities so they are preserved during any restructure. The system is designed to function as a single, integrated solution for daily operations.

---

## 1. Authentication & Users

- Login (email + password); JWT-based auth
- Roles: **Overseer** (Motor World operations) and **Admin**
- Demo credentials shown on login form; migration for canonical emails (overseer@ecfp.com, admin1@ecfp.com, admin2@ecfp.com)
- Manage Users (Overseer only): list users, create admin, delete admin
- Session expiry handling and logout

---

## 2. Dashboard

- Dashboard overview with stats: Total Inventory Value, Total Items in Stock, Low Stock Alerts, Recent Transactions (7 days)
- Chart: Added vs Released value (last 7 days)
- Recent activity list with transaction type badges (Release, Addition, Return, etc.)
- Filter by transaction type; print-friendly layout

---

## 3. Inventory Management

- List items with search, category filter, sort
- Add New Item (name, brand, category, quantity, unit, unit price, description, min stock level)
- Edit Item and Delete Item (admin only)
- Per-row actions: **Add Stock**, **Release Stock**, **Issue Item**, **Return Item**
- Add Stock modal: quantity, note
- Low stock indication; defective quantity display
- Item photo support (optional)
- Stock deduction on release (backend-validated for Product); refetch after release

---

## 4. Sales / Transactions (Release & Returns)

- **Release Stock:** Product or Service
  - Product: select item, quantity, price, person (customer), vehicle (optional), mode of payment (Cash, Credit, GCash, Bank Transfer, Others)
  - Service: service name, quantity, price, customer (type or select), mode of payment
  - Customer: type-to-search with suggestions; create person on the fly if new name
  - Vehicle: type-to-search for selected customer; create vehicle on the fly if new plate
  - Credit: due days, down payment, interest rate, payment schedule → creates SOA and Loan
- **Return from Sales:** linked to original RELEASE transaction
  - Return button only for Product RELEASE with remaining returnable quantity
  - Responsible person, vehicle, Released by shown in table and modal
  - Return quantity, reason, condition (Restock / Defective); backend validates and updates stock
- **Return Item:** return issued items back to stock (dropdown shows only previously released/issued items)
- **Issue Item:** issue to recipient (no sale); no person/vehicle required
- Transaction history table: type, item, qty, total, mode of payment, actions (Print, SOA for Credit, Return when applicable)
- Print release voucher

---

## 5. History Log

- Transaction history with filters (All, Release, Issue, Addition, Return, Adjustment, Return from Sales)
- Export / print-friendly report by filter
- Display of recipient, responsible person, vehicle, released by for RELEASE rows

---

## 6. Item Details

- Per-item view: current stock, defective, total value, totals added/released (lifetime)
- List of transactions for that item

---

## 7. Loans / Credit

- List loans (from Credit releases); status (unpaid, ongoing, overdue, paid, cash)
- SOA (Statement of Account) per transaction: view, payments, remaining balance
- Loan payments; update balances
- Credit flow: Release with Credit → SOA + Loan created; payments recorded

---

## 8. Accounts (Person & Vehicle)

- **Person (Customer):** list, add, edit, delete; search/filter by name, contact, address, email
- **Vehicle:** list, add, edit, delete; linked to person; plate number unique
- Used in Release (customer + optional vehicle); suggestions from existing + newly typed names/plates

---

## 9. Purchasing (Receive from Supplier → Inventory + Cash/AP)

- **Suppliers:** List, add, edit, delete suppliers (name, contact, address, email). Required before receiving.
- **Receive from Supplier:** Select supplier, add line items (existing inventory items, qty, unit cost). **Payment classification:** **Cash** (paid) or **Accounts Payable** (to be paid). Receipt # and note optional. On submit: items are added to inventory (ADDITION transactions), and a purchase record is created. Cash purchases are marked paid; AP purchases appear in Accounts Payable.
- **Accounts Payable report:** Table of unpaid/partial purchases: date, supplier, receipt #, total, paid, balance. Use to match with supplier billing statements.
- **Record payment:** For an AP entry, record payment (amount, method: cash or cheque, date, reference). Updates balance; when fully paid, status becomes paid.

---

## 10. Expenses

- List expenses; filter by category, date range
- Add expense (title, category, amount, description, date)
- Summary: total (filtered) vs total (all-time) when filters active
- Categories: Utilities, Supplies, Salary, Maintenance, Others

---

## 11. Activity Log (Overseer only)

- List activity events (who did what, when)
- Filter by user; pagination/limit

---

## 12. Notifications (Overseer only)

- Bell icon with count; list notifications
- Mark read / read all
- Created when admin performs key actions (release, add person, etc.)

---

## 13. Backend & Data

- **Auth:** JWT; login, register, /me; optional Supabase (comments in create_users.sql, .env.example)
- **Data storage:** Users in Supabase; transactions, items, persons, vehicles, SOA, loans, expenses, activity, notifications in JSON under `server/data/`
- **Permissions:** GET routes — auth only (Overseer + Admin). Write routes (POST/PATCH/DELETE) — **requireAdmin** (Admin only). Overseer read-only for mutations.
- **Return-from-sales:** Strict validation (RELEASE, Product, not fully returned, qty ≤ remaining); `releasedBy` and `returnProcessedBy` for accountability
- **Stock:** Backend validates and deducts stock on Product release; frontend refetches items after release

---

## Restructure Checklist

When restructuring for a smoother program:

- [ ] Keep all modules above; no removal of features
- [ ] Preserve role rules (Overseer vs Admin) and requireAdmin on writes
- [ ] Keep SOA and Loan logic unchanged
- [ ] Keep return-from-sales linked to original RELEASE and backend validation
- [ ] Keep customer/vehicle type-to-search and find-or-create behavior
- [ ] Continue to categorize the product as an **all-in-one system** (not POS) in branding and docs
