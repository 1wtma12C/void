/**
 * VOID — App Root
 * ─────────────────────────────────────────────────────────────
 * • HashRouter (required for GitHub Pages — no server routing)
 * • All context providers stacked at the root
 * • Onboarding gate: traps user in full-screen modal until
 *   userProfile is created in Firestore
 * • Route definitions: / (Dashboard) and /contact/:id (Ledger)
 * • Global InputModal rendered here so it overlays all routes
 */

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion }              from 'framer-motion';
import { Loader2 }                             from 'lucide-react';

import { GhostProvider }                       from './contexts/GhostContext';
import { InputModalProvider }                  from './contexts/InputModalContext';
import { useUserProfile }                      from './hooks/useUserProfile';
import Layout                                  from './Layout';

// Lazy-load pages (code-split for performance)
import { lazy, Suspense } from 'react';
const Dashboard       = lazy(() => import('./pages/Dashboard'));
const ContactLedger   = lazy(() => import('./pages/ContactLedger'));
const AdminVault      = lazy(() => import('./pages/AdminVault'));
const OnboardingModal = lazy(() => import('./components/modals/OnboardingModal'));
const InputModal      = lazy(() => import('./components/modals/InputModal'));

// ── Page loading skeleton ───────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-dvh bg-black">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      >
        <Loader2 size={24} strokeWidth={1.5} className="text-[#3A3A3C]" />
      </motion.div>
    </div>
  );
}

// ── Boot splash while Firebase resolves ────────────────────────
function BootSplash() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-black gap-3">
      <motion.p
        className="text-3xl font-bold tracking-[-0.04em] text-[#F5F5F7]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        VOID
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Loader2
          size={18}
          strokeWidth={1.5}
          className="text-[#3A3A3C] animate-spin"
        />
      </motion.div>
    </div>
  );
}

// ── Inner app — needs router context for Layout ─────────────────
function AppInner() {
  const { profile, loading, profileExists, saveProfile } = useUserProfile();

  // While Firebase is resolving the first onSnapshot — show boot splash
  if (loading) return <BootSplash />;

  return (
    <>
      {/* Onboarding gate — full-screen modal trap */}
      <AnimatePresence>
        {!profileExists && (
          <Suspense fallback={null}>
            <OnboardingModal onSave={saveProfile} />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Main app shell — only rendered once profile exists */}
      {profileExists && (
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"             element={<Dashboard profile={profile} />} />
              <Route path="/contact/:id"  element={<ContactLedger profile={profile} />} />
              <Route path="/vault"        element={<AdminVault />} />
              <Route path="*"             element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      )}

      {/* Global input modal — outside Layout so it overlays everything */}
      <Suspense fallback={null}>
        <InputModal />
      </Suspense>
    </>
  );
}

// ── Root export ─────────────────────────────────────────────────
export default function App() {
  return (
    <HashRouter>
      <GhostProvider>
        <InputModalProvider>
          <AppInner />
        </InputModalProvider>
      </GhostProvider>
    </HashRouter>
  );
}
