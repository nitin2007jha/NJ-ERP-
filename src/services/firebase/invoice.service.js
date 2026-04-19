import {
  collection, doc,
  addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, onSnapshot,
  query, orderBy, limit, where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COL } from '@/config/constants';

/** Save a new finalized invoice */
export async function saveInvoice(uid, invoice) {
  const col = collection(db, COL.invoices(uid));
  const ref = doc(col, invoice.id);          // use our own ID as doc ID
  await setDoc(ref, {
    ...invoice,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return invoice.id;
}

/** Update specific fields on an existing invoice */
export async function updateInvoice(uid, id, patch) {
  const ref = doc(db, COL.invoices(uid), id);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

/** Soft-delete (move to trash) */
export async function trashInvoice(uid, id) {
  await updateDoc(doc(db, COL.invoices(uid), id), {
    isDeleted: true,
    deletedAt: serverTimestamp(),
  });
}

/** Permanently delete */
export async function deleteInvoice(uid, id) {
  await deleteDoc(doc(db, COL.invoices(uid), id));
}

/** One-time fetch all invoices */
export async function fetchInvoices(uid) {
  const q    = query(collection(db, COL.invoices(uid)), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Real-time listener for invoices.
 * @returns unsubscribe function
 */
export function listenInvoices(uid, callback) {
  const q = query(
    collection(db, COL.invoices(uid)),
    orderBy('createdAt', 'desc'),
    limit(500)
  );
  return onSnapshot(q, (snap) => {
    const invoices = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(invoices);
  });
}
