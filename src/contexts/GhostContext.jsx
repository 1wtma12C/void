/**
 * VOID — Ghost Mode Context
 * ─────────────────────────────────────────────────────────────
 * Provides a global isGhostMode boolean that, when true, blurs
 * all monetary amounts across the app for privacy.
 *
 * Persists to localStorage so state survives page refreshes.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const GhostContext = createContext(null);

export function GhostProvider({ children }) {
  const [isGhostMode, setIsGhostMode] = useState(() => {
    try {
      return localStorage.getItem('void_ghost') === 'true';
    } catch {
      return false;
    }
  });

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('void_ghost', String(isGhostMode));
    } catch {
      // Ignore storage errors (private browsing etc.)
    }
  }, [isGhostMode]);

  const toggleGhost = useCallback(() => {
    setIsGhostMode((prev) => !prev);
  }, []);

  return (
    <GhostContext.Provider value={{ isGhostMode, toggleGhost }}>
      {children}
    </GhostContext.Provider>
  );
}

/** Access ghost mode state and toggle from any component. */
export function useGhost() {
  const ctx = useContext(GhostContext);
  if (!ctx) throw new Error('useGhost must be used inside <GhostProvider>');
  return ctx;
}
