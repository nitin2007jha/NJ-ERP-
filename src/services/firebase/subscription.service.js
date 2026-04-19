import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COL, PLAN_LIMITS } from '@/config/constants';

/** Fetch subscription for a user. Returns free_trial object if none found. */
export async function fetchSubscription(uid) {
  try {
    const snap = await getDoc(doc(db, COL.subscriptions, uid));
    if (!snap.exists()) return _freeTrial();
    const data = snap.data();
    // Auto-expire check
    if (data.status === 'active' && data.expiresAt) {
      const exp = data.expiresAt.toMillis?.() || 0;
      if (exp > 0 && exp < Date.now()) {
        await updateDoc(doc(db, COL.subscriptions, uid), { status: 'expired' });
        data.status = 'expired';
      }
    }
    return data;
  } catch {
    return _freeTrial();
  }
}

/** Called by a Cloud Function after Razorpay payment verification */
export async function activateSubscription(uid, tier, paymentRef) {
  const now      = new Date();
  const expires  = new Date(now);
  expires.setMonth(expires.getMonth() + 1);

  await setDoc(
    doc(db, COL.subscriptions, uid),
    {
      tier,
      status:     'active',
      startDate:  serverTimestamp(),
      expiresAt:  expires,
      paymentRef,
      features:   PLAN_LIMITS[tier]?.features || {},
      updatedAt:  serverTimestamp(),
    },
    { merge: true }
  );
}

function _freeTrial() {
  return {
    tier:     'free_trial',
    status:   'active',
    features: PLAN_LIMITS.free_trial.features,
  };
}
