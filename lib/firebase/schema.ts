import { collection, doc, type Firestore } from 'firebase/firestore';
import { getFirebaseShopId } from './app';

export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  shops: 'shops',
  items: 'items',
  transactions: 'transactions',
  persons: 'persons',
  vehicles: 'vehicles',
  expenses: 'expenses',
  suppliers: 'suppliers',
  purchases: 'purchases',
  soas: 'soas',
  soaPayments: 'soaPayments',
  loans: 'loans',
  loanPayments: 'loanPayments',
  notifications: 'notifications',
  activityLogs: 'activityLogs',
} as const;

export function getShopCollection(db: Firestore, collectionName: string) {
  return collection(db, FIRESTORE_COLLECTIONS.shops, getFirebaseShopId(), collectionName);
}

export function getShopDoc(db: Firestore, collectionName: string, id: string) {
  return doc(db, FIRESTORE_COLLECTIONS.shops, getFirebaseShopId(), collectionName, id);
}

export function getUserDoc(db: Firestore, uid: string) {
  return doc(db, FIRESTORE_COLLECTIONS.users, uid);
}
