import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(rootDir, '.env.local'), override: true });

function readServiceAccount() {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inlineJson) {
    return JSON.parse(inlineJson);
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH?.trim();
  if (!serviceAccountPath) {
    throw new Error(
      'Missing Firebase admin credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_JSON_PATH.'
    );
  }

  return JSON.parse(fs.readFileSync(path.resolve(rootDir, serviceAccountPath), 'utf8'));
}

function getFirebaseAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccount = readServiceAccount();
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
    process.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() ||
    serviceAccount.storageBucket ||
    undefined;

  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket,
  });
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminStorage() {
  return getStorage(getFirebaseAdminApp());
}

export function getFirebaseShopId() {
  return (
    process.env.FIREBASE_SHOP_ID?.trim() ||
    process.env.VITE_FIREBASE_SHOP_ID?.trim() ||
    process.env.VITE_FIREBASE_VIEWER_SHOP_ID?.trim() ||
    'main'
  );
}

export function getRootDir() {
  return rootDir;
}
