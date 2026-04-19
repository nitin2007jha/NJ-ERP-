import {
  collection, doc,
  setDoc, updateDoc,
  onSnapshot, query, orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COL } from '@/config/constants';

export async function saveExpense(uid, expense) {
  const ref = expense.id
    ? doc(db, COL.expenses(uid), expense.id)
    : doc(collection(db, COL.expenses(uid)));
  await setDoc(ref, { ...expense, id: ref.id, updatedAt: serverTimestamp() }, { merge: true });
  return ref.id;
}

export async function deleteExpense(uid, id) {
  await updateDoc(doc(db, COL.expenses(uid), id), { isDeleted: true, updatedAt: serverTimestamp() });
}

export function listenExpenses(uid, callback) {
  const q = query(collection(db, COL.expenses(uid)), orderBy('date', 'desc'));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
