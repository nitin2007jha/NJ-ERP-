import {
  collection, doc,
  addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, onSnapshot,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COL } from '@/config/constants';

/* ── Products ─────────────────────────────────────────────────────────── */

export async function saveProduct(uid, product) {
  const ref = product.id
    ? doc(db, COL.products(uid), product.id)
    : doc(collection(db, COL.products(uid)));
  await setDoc(ref, { ...product, id: ref.id, updatedAt: serverTimestamp() }, { merge: true });
  return ref.id;
}

export async function updateProduct(uid, id, patch) {
  await updateDoc(doc(db, COL.products(uid), id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteProduct(uid, id) {
  await updateDoc(doc(db, COL.products(uid), id), { isDeleted: true, updatedAt: serverTimestamp() });
}

export function listenProducts(uid, callback) {
  const q = query(collection(db, COL.products(uid)), orderBy('name'));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

/* ── Services ─────────────────────────────────────────────────────────── */

export async function saveService(uid, service) {
  const ref = service.id
    ? doc(db, COL.services(uid), service.id)
    : doc(collection(db, COL.services(uid)));
  await setDoc(ref, { ...service, id: ref.id, updatedAt: serverTimestamp() }, { merge: true });
  return ref.id;
}

export async function deleteService(uid, id) {
  await updateDoc(doc(db, COL.services(uid), id), { isDeleted: true, updatedAt: serverTimestamp() });
}

export function listenServices(uid, callback) {
  const q = query(collection(db, COL.services(uid)), orderBy('name'));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
