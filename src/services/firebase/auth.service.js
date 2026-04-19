import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { COL } from '@/config/constants';

/** Sign in owner with email + password */
export async function signInOwner(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/** Create new owner account */
export async function signUpOwner(email, password, businessName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: businessName });

  // Create user document in Firestore
  await setDoc(doc(db, COL.users, cred.user.uid), {
    email,
    displayName:  businessName,
    businessName,
    createdAt:    serverTimestamp(),
    plan:         'free_trial',
  });

  // Seed default settings
  await setDoc(doc(db, `${COL.businesses}/${cred.user.uid}`), {
    businessName,
    email,
    createdAt: serverTimestamp(),
    settings: {
      template:    'modern',
      currency:    'INR',
      features:    {},
    },
  });

  return cred.user;
}

/** Sign out current user */
export async function signOut() {
  await fbSignOut(auth);
}

/** Send password reset email */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/** Fetch business settings doc for a UID */
export async function fetchUserSettings(uid) {
  const snap = await getDoc(doc(db, COL.businesses, uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * Subscribe to auth state changes.
 * @param {Function} callback  - receives Firebase user | null
 * @returns unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
