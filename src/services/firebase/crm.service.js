import {
  collection, doc,
  setDoc, updateDoc,
  onSnapshot, query, orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COL } from '@/config/constants';

export async function saveClient(uid, client) {
  const ref = client.id
    ? doc(db, COL.clients(uid), client.id)
    : doc(collection(db, COL.clients(uid)));
  await setDoc(ref, { ...client, id: ref.id, updatedAt: serverTimestamp() }, { merge: true });
  return ref.id;
}

export async function updateClient(uid, id, patch) {
  await updateDoc(doc(db, COL.clients(uid), id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteClient(uid, id) {
  await updateDoc(doc(db, COL.clients(uid), id), { isDeleted: true, updatedAt: serverTimestamp() });
}

export function listenClients(uid, callback) {
  const q = query(collection(db, COL.clients(uid)), orderBy('name'));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
