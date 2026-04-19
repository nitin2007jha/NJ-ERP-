import { useEffect, useRef } from 'react';
import { useAppStore }          from '@/store';
import { listenInvoices }       from '@/services/firebase/invoice.service';
import { listenProducts, listenServices } from '@/services/firebase/inventory.service';
import { listenClients }        from '@/services/firebase/crm.service';
import { listenExpenses }       from '@/services/firebase/expense.service';
import { fetchSubscription }    from '@/services/firebase/subscription.service';

/**
 * Attaches all Firestore real-time listeners once a uid is available.
 * Cleans up all listeners on uid change or unmount.
 */
export function useRealtimeSync() {
  const uid              = useAppStore((s) => s.user?.uid);
  const isDemo           = useAppStore((s) => s.isDemo);
  const setInvoices      = useAppStore((s) => s.setInvoices);
  const setProducts      = useAppStore((s) => s.setProducts);
  const setServices      = useAppStore((s) => s.setServices);
  const setClients       = useAppStore((s) => s.setClients);
  const setExpenses      = useAppStore((s) => s.setExpenses);
  const setSubscription  = useAppStore((s) => s.setSubscription);

  const unsubs = useRef([]);

  useEffect(() => {
    // Tear down any previous listeners
    unsubs.current.forEach((fn) => fn());
    unsubs.current = [];

    if (!uid || isDemo) return;

    unsubs.current = [
      listenInvoices (uid, setInvoices),
      listenProducts (uid, setProducts),
      listenServices (uid, setServices),
      listenClients  (uid, setClients),
      listenExpenses (uid, setExpenses),
    ];

    // Subscription is fetched once (not real-time — changes only on payment)
    fetchSubscription(uid).then(setSubscription);

    return () => {
      unsubs.current.forEach((fn) => fn());
      unsubs.current = [];
    };
  }, [uid, isDemo]);
}
