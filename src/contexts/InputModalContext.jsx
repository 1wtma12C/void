/**
 * VOID — Input Modal Context
 * ─────────────────────────────────────────────────────────────
 * Controls the global Fluid Input System (the transaction entry modal).
 * Any component can trigger it — the dock buttons, Cmd+K, or a contact action.
 *
 * State:
 *   isOpen         — boolean
 *   prefillType    — 'LENT' | 'RECEIVED' | null
 *   prefillContact — { id, name } | null  (pre-selects a contact)
 *
 * API:
 *   openModal(type?, contact?)  — opens with optional pre-fills
 *   closeModal()                — dismisses
 */

import { createContext, useContext, useState, useCallback } from 'react';

const InputModalContext = createContext(null);

export function InputModalProvider({ children }) {
  const [isOpen,         setIsOpen]         = useState(false);
  const [prefillType,    setPrefillType]    = useState(null);
  const [prefillContact, setPrefillContact] = useState(null);

  /**
   * Open the input modal.
   * @param {'LENT'|'RECEIVED'|null}        type    — pre-select transaction type
   * @param {{ id: string, name: string }|null} contact — pre-select a contact
   */
  const openModal = useCallback((type = null, contact = null) => {
    setPrefillType(type);
    setPrefillContact(contact);
    setIsOpen(true);
    // Prevent body scroll while modal is open
    document.body.classList.add('no-scroll');
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Small delay so exit animation can play before resetting state
    setTimeout(() => {
      setPrefillType(null);
      setPrefillContact(null);
      document.body.classList.remove('no-scroll');
    }, 300);
  }, []);

  return (
    <InputModalContext.Provider
      value={{ isOpen, prefillType, prefillContact, openModal, closeModal }}
    >
      {children}
    </InputModalContext.Provider>
  );
}

/** Access the input modal controls from any component. */
export function useInputModal() {
  const ctx = useContext(InputModalContext);
  if (!ctx) throw new Error('useInputModal must be used inside <InputModalProvider>');
  return ctx;
}
