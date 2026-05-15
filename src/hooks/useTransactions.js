/**
 * VOID — useTransactions Hook
 * ─────────────────────────────────────────────────────────────
 * Real-time listener on the transactions collection (the immutable ledger).
 *
 * This hook is the financial brain of VOID. It:
 *   1. Subscribes to ALL transactions in real-time
 *   2. Calculates the global net balance (LENT - RECEIVED across all contacts)
 *   3. Calculates per-contact net balances on demand
 *   4. Exposes add / delete operations
 *
 * ⚠ CRITICAL DESIGN RULE:
 *   Balances are NEVER stored in Firestore.
 *   They are always derived from this immutable transaction log.
 *   This guarantees data integrity — editing a transaction
 *   automatically fixes every balance that depends on it.
 *
 * Transaction type constants:
 *   TX_TYPE.LENT     = 'LENT'      — money going OUT to a contact
 *   TX_TYPE.RECEIVED = 'RECEIVED'  — money coming IN from a contact
 *
 * Returns:
 *   transactions        — Transaction[] (active only, sorted date desc)
 *   allTransactions     — Transaction[] (includes deleted, for recycle bin)
 *   globalNetBalance    — number (>0 means world owes you; <0 means you owe)
 *   loading             — boolean
 *   error               — Error | null
 *   addTransaction      — async (data) => docRef
 *   softDeleteTransaction — async (id) => void
 *   restoreTransaction  — async (id) => void
 *   hardDeleteTransaction — async (id) => void
 *   getContactBalance   — (contactId) => number
 *   getContactTransactions — (contactId) => Transaction[]
 *   getContactSummary   — (contactId) => { balance, lentTotal, receivedTotal, txCount }
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../lib/firebase';

// ── Transaction type constants ─────────────────────────────────
export const TX_TYPE = Object.freeze({
  LENT:     'LENT',
  RECEIVED: 'RECEIVED',
});

// ── Hook ──────────────────────────────────────────────────────
export function useTransactions() {
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);

  // Derived active transactions
  const transactions = useMemo(() => allTransactions.filter((tx) => !tx.isDeleted && !tx.deletedAt), [allTransactions]);

  // Real-time listener — sorted newest first
  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      orderBy('date', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllTransactions(docs);
        setLoading(false);
      },
      (err) => {
        console.error('[VOID] useTransactions error:', err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // ── Derived: Global Net Balance ────────────────────────────────
  /**
   * Global net balance across ALL contacts.
   * Positive = world owes you money (Aurora Green).
   * Negative = you owe money (Crimson Nebula).
   */
  const globalNetBalance = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.type === TX_TYPE.LENT)     return acc + (tx.amount ?? 0);
      if (tx.type === TX_TYPE.RECEIVED) return acc - (tx.amount ?? 0);
      return acc;
    }, 0);
  }, [transactions]);

  // ── Derived: Per-Contact Balance Map ──────────────────────────
  /**
   * Map<contactId, { balance, lentTotal, receivedTotal }>
   * Computed once on transactions change, O(n) scan.
   */
  const contactBalanceMap = useMemo(() => {
    const map = new Map();

    for (const tx of transactions) {
      const { contactId, type, amount = 0 } = tx;
      if (!contactId) continue;

      if (!map.has(contactId)) {
        map.set(contactId, { balance: 0, lentTotal: 0, receivedTotal: 0 });
      }

      const entry = map.get(contactId);
      if (type === TX_TYPE.LENT) {
        entry.lentTotal += amount;
        entry.balance   += amount;
      } else if (type === TX_TYPE.RECEIVED) {
        entry.receivedTotal += amount;
        entry.balance       -= amount;
      }
    }

    return map;
  }, [transactions]);

  // ── Selectors ──────────────────────────────────────────────────

  /**
   * Net balance for a single contact.
   * Positive = they owe you. Negative = you owe them.
   * @param {string} contactId
   * @returns {number}
   */
  const getContactBalance = useCallback(
    (contactId) => contactBalanceMap.get(contactId)?.balance ?? 0,
    [contactBalanceMap],
  );

  /**
   * All transactions for a single contact, newest first.
   * @param {string} contactId
   * @returns {Transaction[]}
   */
  const getContactTransactions = useCallback(
    (contactId) => transactions.filter((tx) => tx.contactId === contactId),
    [transactions],
  );

  /**
   * Full summary object for a contact.
   * @param {string} contactId
   * @returns {{ balance: number, lentTotal: number, receivedTotal: number, txCount: number }}
   */
  const getContactSummary = useCallback(
    (contactId) => {
      const entry = contactBalanceMap.get(contactId) ?? {
        balance: 0,
        lentTotal: 0,
        receivedTotal: 0,
      };
      return {
        ...entry,
        txCount: transactions.filter((tx) => tx.contactId === contactId).length,
      };
    },
    [contactBalanceMap, transactions],
  );

  // ── Write Operations ───────────────────────────────────────────

  /**
   * Add a new transaction to the immutable ledger.
   *
   * @param {{
   *   contactId: string,
   *   amount:    number,
   *   type:      'LENT' | 'RECEIVED',
   *   note?:     string,
   *   date?:     Date,
   * }} data
   * @returns {Promise<DocumentReference>}
   */
  const addTransaction = useCallback(async (data) => {
    if (!data.contactId) throw new Error('contactId is required');
    if (!data.amount || data.amount <= 0) throw new Error('amount must be > 0');
    if (![TX_TYPE.LENT, TX_TYPE.RECEIVED].includes(data.type)) {
      throw new Error('type must be LENT or RECEIVED');
    }

    const ref = collection(db, COLLECTIONS.TRANSACTIONS);
    return await addDoc(ref, {
      contactId: data.contactId,
      amount:    Math.abs(Number(data.amount)),     // always positive
      type:      data.type,
      note:      data.note?.trim() ?? '',
      isDeleted: false,
      date:      data.date
        ? Timestamp.fromDate(data.date)
        : serverTimestamp(),
    });
  }, []);

  /**
   * Soft delete a transaction.
   * @param {string} id
   */
  const softDeleteTransaction = useCallback(async (id) => {
    await updateDoc(doc(db, COLLECTIONS.TRANSACTIONS, id), { isDeleted: true, deletedAt: serverTimestamp() });
  }, []);

  /**
   * Restore a soft-deleted transaction.
   * @param {string} id
   */
  const restoreTransaction = useCallback(async (id) => {
    await updateDoc(doc(db, COLLECTIONS.TRANSACTIONS, id), { isDeleted: false, deletedAt: null });
  }, []);

  /**
   * Permanently delete a transaction.
   * @param {string} id
   */
  const hardDeleteTransaction = useCallback(async (id) => {
    await deleteDoc(doc(db, COLLECTIONS.TRANSACTIONS, id));
  }, []);

  return {
    transactions,
    allTransactions,
    globalNetBalance,
    loading,
    error,
    addTransaction,
    softDeleteTransaction,
    restoreTransaction,
    hardDeleteTransaction,
    getContactBalance,
    getContactTransactions,
    getContactSummary,
    /** Expose the raw map for advanced use cases */
    contactBalanceMap,
  };
}
