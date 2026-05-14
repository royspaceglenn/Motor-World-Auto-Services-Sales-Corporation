import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from './app';

export type FirebaseAppUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'overseer' | 'admin';
};

export async function readFirebaseAppUser(user: User | null): Promise<FirebaseAppUser | null> {
  if (!user || user.isAnonymous) return null;

  const authResult = await user.getIdTokenResult();
  const claimRole = authResult.claims.role;
  const db = getFirebaseFirestore();
  if (!db) throw new Error('Firebase is not configured.');

  const profileSnap = await getDoc(doc(db, 'users', user.uid));
  const profile = (profileSnap.data() ?? {}) as Record<string, unknown>;
  const role = (claimRole || profile.role || 'admin') as 'overseer' | 'admin';

  return {
    id: user.uid,
    email: user.email || String(profile.email || ''),
    displayName: String(profile.displayName || user.displayName || user.email || 'User'),
    role,
  };
}

export function observeFirebaseAuth(
  callback: (payload: { firebaseUser: User | null; appUser: FirebaseAppUser | null }) => void
) {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback({ firebaseUser: null, appUser: null });
    return () => {};
  }

  return onAuthStateChanged(auth, async (user) => {
    try {
      const appUser = await readFirebaseAppUser(user);
      callback({ firebaseUser: user, appUser });
    } catch (_error) {
      callback({ firebaseUser: user, appUser: null });
    }
  });
}

export async function signInWithFirebaseEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured.');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInToFirebaseAnonymously() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase is not configured.');
  return signInAnonymously(auth);
}

export async function signOutFromFirebase() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export async function readCurrentFirebaseAppUser() {
  const auth = getFirebaseAuth();
  const currentUser = auth?.currentUser ?? null;
  return readFirebaseAppUser(currentUser);
}

export async function readCurrentFirebaseRawUser() {
  const auth = getFirebaseAuth();
  return auth?.currentUser ?? null;
}
