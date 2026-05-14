# Firebase Architecture

## Auth and roles

- Admin app authentication uses Firebase Auth email/password.
- Viewer authentication uses Firebase Auth anonymous sign-in.
- Role access is enforced with custom claims and mirrored in `users/{uid}` docs.
- Supported roles:
  - `overseer`
  - `admin`

## Firestore shape

- `users/{uid}`
  - app profile metadata and role mirror
- `shops/{shopId}/items/{itemId}`
- `shops/{shopId}/transactions/{transactionId}`
- `shops/{shopId}/persons/{personId}`
- `shops/{shopId}/vehicles/{vehicleId}`
- `shops/{shopId}/expenses/{expenseId}`
- `shops/{shopId}/suppliers/{supplierId}`
- `shops/{shopId}/purchases/{purchaseId}`
- `shops/{shopId}/soas/{soaId}`
- `shops/{shopId}/soaPayments/{paymentId}`
- `shops/{shopId}/loans/{loanId}`
- `shops/{shopId}/loanPayments/{paymentId}`
- `shops/{shopId}/notifications/{notificationId}`
- `shops/{shopId}/activityLogs/{logId}`

## Direct client writes

- `items`: create, update, delete by staff
- `persons`: create and update by staff
- `vehicles`: create and update by staff
- `expenses`: create and update by staff
- `suppliers`: create and update by staff
- `notifications`: mark read by staff

## Callable Functions

Critical workflows are routed through Firebase Functions:

- `createUserAccount`
- `deleteUserAccount`
- `createTransaction`
- `returnFromSales`
- `createPurchase`
- `addPurchasePayment`
- `getLoanById`
- `getLoanByTransactionId`
- `addLoanPayment`
- `updateLoanStatus`
- `getSoaByTransactionId`
- `getSoaById`
- `updateSoaPaymentStatus`
- `addSoaPayment`
- `deletePerson`
- `deleteVehicle`
- `deleteSupplier`

These functions preserve the previous server-side business rules for stock mutation, purchase receiving, SOA generation, credit/loan balances, and protected deletes.
