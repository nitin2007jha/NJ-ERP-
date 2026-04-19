import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ── Replace with your Firebase project config ───────────────────────────
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCV3G-BMVf2QRpibaS5MnwQybKixC4h9og",
  authDomain: "dev-ayurveda.firebaseapp.com",
  databaseURL: "https://dev-ayurveda-default-rtdb.firebaseio.com",
  projectId: "dev-ayurveda",
  storageBucket: "dev-ayurveda.firebasestorage.app",
  messagingSenderId: "40760282698",
  appId: "1:40760282698:web:20e31100eed712631ca0b3",
  measurementId: "G-THLCJRV6MZ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Offline persistence via modern API (not deprecated enableIndexedDbPersistence)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const storage = getStorage(app);
export default app;