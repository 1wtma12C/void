/**
 * VOID — useUserProfile Hook
 * ─────────────────────────────────────────────────────────────
 * Real-time listener on the singleton owner document.
 * Exposes profile data, loading state, and a save function.
 *
 * Returns:
 *   profile      — { id, name, upiId, baseCurrency } | null
 *   loading      — boolean
 *   error        — Error | null
 *   saveProfile  — async (data: { name, upiId, baseCurrency }) => void
 *   profileExists — boolean (false until confirmed from Firestore)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS, OWNER_DOC_ID } from '../lib/firebase';

export function useUserProfile() {
  const cachedExists = localStorage.getItem('void_profile_exists') === 'true';
  const cachedProfile = JSON.parse(localStorage.getItem('void_profile_data') || 'null');

  const [profile, setProfile]             = useState(cachedProfile);
  const [loading, setLoading]             = useState(!cachedExists); // Skip loading if cached
  const [error, setError]                 = useState(null);
  const [profileExists, setProfileExists] = useState(cachedExists);

  useEffect(() => {
    const ref = doc(db, COLLECTIONS.USER_PROFILE, OWNER_DOC_ID);

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setProfile(data);
          setProfileExists(true);
          localStorage.setItem('void_profile_exists', 'true');
          localStorage.setItem('void_profile_data', JSON.stringify(data));
        } else {
          setProfile(null);
          setProfileExists(false);
          localStorage.removeItem('void_profile_exists');
          localStorage.removeItem('void_profile_data');
        }
        setLoading(false);
      },
      (err) => {
        console.error('[VOID] useUserProfile error:', err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  /**
   * Create or update the owner profile document.
   * @param {{ name: string, phone?: string, upiId?: string, baseCurrency?: string, vaultPin?: string }} data
   */
  const saveProfile = useCallback(async (data) => {
    try {
      const ref = doc(db, COLLECTIONS.USER_PROFILE, OWNER_DOC_ID);
      const docData = {
        name:         data.name.trim(),
        phone:        data.phone?.trim() || '',
        upiId:        data.upiId?.trim() || '',
        baseCurrency: data.baseCurrency ?? 'INR',
        vaultPin:     data.vaultPin ?? profile?.vaultPin ?? '0000',
        updatedAt:    serverTimestamp(),
      };
      
      await setDoc(ref, docData, { merge: true });
      
      // Update local cache aggressively so next reload is instantaneous
      localStorage.setItem('void_profile_exists', 'true');
      localStorage.setItem('void_profile_data', JSON.stringify({ id: OWNER_DOC_ID, ...docData, updatedAt: new Date().toISOString() }));
    } catch (err) {
      console.error('[VOID] saveProfile error:', err);
      throw err;
    }
  }, []);

  return { profile, loading, error, profileExists, saveProfile };
}
