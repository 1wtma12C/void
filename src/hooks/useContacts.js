/**
 * VOID — useContacts Hook
 * ─────────────────────────────────────────────────────────────
 * Real-time listener on the contacts collection.
 * Provides CRUD operations for contact management.
 *
 * Returns:
 *   contacts      — Contact[] (active only, sorted by name)
 *   allContacts   — Contact[] (includes deleted, for recycle bin)
 *   loading       — boolean
 *   error         — Error | null
 *   addContact    — async (data) => docRef
 *   updateContact — async (id, data) => void
 *   upsertContact — async (data) => string (id)
 *   softDeleteContact — async (id) => void
 *   restoreContact    — async (id) => void
 *   hardDeleteContact — async (id) => void  ⚠ also deletes transactions
 *   getContact    — (id) => Contact | undefined
 *
 * Contact shape:
 *   { id, name, phone?, email?, notes?, createdAt }
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDocs,
  where,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../lib/firebase';

export function useContacts() {
  const [allContacts, setAllContacts] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // Derived active contacts
  const contacts = allContacts.filter((c) => !c.isDeleted && !c.deletedAt);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.CONTACTS),
      orderBy('name', 'asc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllContacts(docs);
        setLoading(false);
      },
      (err) => {
        console.error('[VOID] useContacts error:', err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // ── Write Operations ─────────────────────────────────────────

  /**
   * Add a new contact.
   * @param {{ name: string, phone?: string, email?: string, notes?: string }} data
   * @returns {Promise<DocumentReference>}
   */
  const addContact = useCallback(async (data) => {
    const ref = collection(db, COLLECTIONS.CONTACTS);
    return await addDoc(ref, {
      name:      data.name.trim(),
      phone:     data.phone?.trim()  ?? '',
      email:     data.email?.trim()  ?? '',
      notes:     data.notes?.trim()  ?? '',
      isDeleted: false,
      createdAt: serverTimestamp(),
    });
  }, []);

  /**
   * Update an existing contact by ID.
   * @param {string} id
   * @param {Partial<{ name, phone, email, notes }>} data
   */
  const updateContact = useCallback(async (id, data) => {
    const ref = doc(db, COLLECTIONS.CONTACTS, id);
    const updates = {};
    if (data.name  !== undefined) updates.name  = data.name.trim();
    if (data.phone !== undefined) updates.phone = data.phone.trim();
    if (data.email !== undefined) updates.email = data.email.trim();
    if (data.notes !== undefined) updates.notes = data.notes.trim();
    updates.updatedAt = serverTimestamp();
    await updateDoc(ref, updates);
  }, []);

  /**
   * Upsert a contact by name (case-insensitive).
   * Updates if exists, creates if new. Returns the contact ID.
   * @param {{ name: string, phone?: string, email?: string, notes?: string, upiId?: string }} data
   * @returns {Promise<string>}
   */
  const upsertContact = useCallback(async (data) => {
    console.log('[DEBUG] Inside upsertContact. Checking if contact exists:', data.name);
    const existing = contacts.find((c) => c.name.toLowerCase() === data.name.trim().toLowerCase());
    
    if (existing) {
      console.log('[DEBUG] Contact exists. Updating:', existing.id);
      await updateContact(existing.id, data);
      console.log('[DEBUG] updateContact resolved.');
      return existing.id;
    } else {
      console.log('[DEBUG] Contact is new. Adding...');
      const docRef = await addContact(data);
      console.log('[DEBUG] addContact resolved. New ID:', docRef.id);
      return docRef.id;
    }
  }, [contacts, updateContact, addContact]);

  /**
   * Soft delete a contact (move to recycle bin).
   * @param {string} id
   */
  const softDeleteContact = useCallback(async (id) => {
    const ref = doc(db, COLLECTIONS.CONTACTS, id);
    await updateDoc(ref, { isDeleted: true, deletedAt: serverTimestamp() });
  }, []);

  /**
   * Restore a soft-deleted contact.
   * @param {string} id
   */
  const restoreContact = useCallback(async (id) => {
    const ref = doc(db, COLLECTIONS.CONTACTS, id);
    await updateDoc(ref, { isDeleted: false, deletedAt: null });
  }, []);

  /**
   * Hard Delete a contact and ALL of their transactions (cascade).
   * Uses a batched write to keep it atomic.
   * @param {string} id
   */
  const hardDeleteContact = useCallback(async (id) => {
    const batch = writeBatch(db);

    // Delete all transactions for this contact
    const txQuery = query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      where('contactId', '==', id),
    );
    const txSnap = await getDocs(txQuery);
    txSnap.docs.forEach((d) => batch.delete(d.ref));

    // Delete the contact doc
    batch.delete(doc(db, COLLECTIONS.CONTACTS, id));

    await batch.commit();
  }, []);

  /**
   * Get a single contact by ID (sync, from in-memory state).
   * @param {string} id
   * @returns {Contact | undefined}
   */
  const getContact = useCallback(
    (id) => allContacts.find((c) => c.id === id),
    [allContacts],
  );

  return {
    contacts,
    allContacts,
    loading,
    error,
    addContact,
    updateContact,
    upsertContact,
    softDeleteContact,
    restoreContact,
    hardDeleteContact,
    getContact,
  };
}
