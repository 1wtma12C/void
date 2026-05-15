/**
 * VOID — Data Access Layer (barrel export)
 * ─────────────────────────────────────────────────────────────
 * Central import point for all hooks and Firebase utilities.
 *
 * Usage:
 *   import { useUserProfile, useContacts, useTransactions, TX_TYPE } from '../hooks';
 */

export { useUserProfile }           from './useUserProfile';
export { useContacts }              from './useContacts';
export { useTransactions, TX_TYPE } from './useTransactions';
