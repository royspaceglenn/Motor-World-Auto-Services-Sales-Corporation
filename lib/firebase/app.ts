import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

type FirebaseEnvConfig = {
  apiKey: string;
  appId: string;
  authDomain: string;
  messagingSenderId: string;
  projectId: string;
  storageBucket: string;
};

function readFirebaseEnv(): FirebaseEnvConfig {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || '';
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim() || '';
  const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim() || '';
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || '';
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || '';
  const authDomain =
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || (projectId ? `${projectId}.firebaseapp.com` : '');

  return {
    projectId,
    apiKey,
    appId,
    messagingSenderId,
    storageBucket,
    authDomain,
  };
}

export function isFirebaseConfigured() {
  const cfg = readFirebaseEnv();
  return Boolean(cfg.projectId && cfg.apiKey && cfg.appId && cfg.messagingSenderId);
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (getApps().length > 0) return getApp();

  const cfg = readFirebaseEnv();
  return initializeApp({
    apiKey: cfg.apiKey,
    appId: cfg.appId,
    authDomain: cfg.authDomain || undefined,
    messagingSenderId: cfg.messagingSenderId,
    projectId: cfg.projectId,
    storageBucket: cfg.storageBucket || undefined,
  });
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

let firestoreSingleton: Firestore | null | undefined;

export function getFirebaseFirestore(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (firestoreSingleton !== undefined) return firestoreSingleton;
  try {
    firestoreSingleton = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    firestoreSingleton = getFirestore(app);
  }
  return firestoreSingleton;
}

export function getFirebaseFunctions() {
  const app = getFirebaseApp();
  const region = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION?.trim() || 'us-central1';
  return app ? getFunctions(app, region) : null;
}

export function getFirebaseStorage() {
  const app = getFirebaseApp();
  return app ? getStorage(app) : null;
}

export function getFirebaseShopId() {
  return (
    import.meta.env.VITE_FIREBASE_SHOP_ID?.trim() ||
    import.meta.env.VITE_FIREBASE_VIEWER_SHOP_ID?.trim() ||
    'main'
  );
}
