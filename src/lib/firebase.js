/**
 * VOID — Firebase Initialization
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for the Firebase app + Firestore db.
 * All credentials are pulled from Vite env vars (.env.local).
 *
 * Collections:
 *   userProfile  — singleton doc (id: 'owner_doc')
 *   contacts     — one doc per person
 *   transactions — immutable ledger entries
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyApjnWuLgD52JfWtC47ARGZJ1JGgrxTXDI",
  authDomain: "void-848cb.firebaseapp.com",
  projectId: "void-848cb",
  storageBucket: "void-848cb.firebasestorage.app",
  messagingSenderId: "1035829911357",
  appId: "1:1035829911357:web:9482870975ef2d7b556f54"
};

// ── App & Firestore ────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);

// Uncomment to use the local Firestore emulator during development:
// if (import.meta.env.DEV) {
//   connectFirestoreEmulator(db, 'localhost', 8080);
// }

// ── Collection name constants ──────────────────────────────────
export const COLLECTIONS = {
  USER_PROFILE: 'userProfile',
  CONTACTS:     'contacts',
  TRANSACTIONS: 'transactions',
};

/** The singleton document ID for the owner's profile */
export const OWNER_DOC_ID = 'owner_doc';

export default app;
