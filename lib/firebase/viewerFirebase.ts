import {
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseShopId,
  isFirebaseConfigured,
} from './app';

export function isViewerFirebaseConfigured() {
  return isFirebaseConfigured();
}

export function getViewerFirebaseApp() {
  return getFirebaseApp();
}

export function getViewerAuth() {
  return getFirebaseAuth();
}

export function getViewerFirestore() {
  return getFirebaseFirestore();
}

export function getViewerDefaultShopId() {
  return getFirebaseShopId();
}
