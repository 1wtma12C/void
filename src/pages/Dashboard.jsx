/**
 * VOID — Dashboard
 * ─────────────────────────────────────────────────────────────
 * The Base Station. Three sections:
 *
 *   1. HERO — Global net balance (massive typography, semantic glow)
 *   2. ORBIT — Contact list with live per-contact balances
 *   3. EMPTY — Calls-to-action when no contacts exist yet
 *
 * Design rules:
 *   • No hard borders — only glass, space, and typography hierarchy
 *   • Contacts with zero balance are hidden (unless < 24h old)
 *   • Staggered entrance animation for the contact list
 *   • All amounts respect Ghost Mode (blur)
 */

import { useMemo }          from 'react';
import { useNavigate }      from 'react-router-dom';
import { motion }           from 'framer-motion';
import { UserPlus, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';

import { useContacts }      from '../hooks/useContacts';
import { useTransactions }  from '../hooks/useTransactions';
import { useInputModal }    from '../contexts/InputModalContext';
import { useGhost }         from '../contexts/GhostContext';
import AmountDisplay, { formatCurrency } from '../components/ui/AmountDisplay';
import { formatRelativeDate } from '../lib/utils';

// ── Constants ────────────────────────────────────────────────────
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

// ── Animation variants ────────────────────────────────────────────
const containerVariants = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

// ── Hero Balance Section ──────────────────────────────────────────
function HeroBalance({ globalNetBalance, txCount }) {
  const { isGhostMode } = useGhost();

  const isPositive = globalNetBalance > 0;
  const isNegative = globalNetBalance < 0;
  const isZero     = globalNetBalance === 0;

  // Dynamic glow under the number
  const glowColor = isPositive
    ? 'rgba(50, 215, 75, 0.22)'
    : isNegative
    ? 'rgba(255, 69, 58, 0.22)'
    : 'transparent';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="px-6 pt-4 pb-8 text-center select-none"
    >
      {/* Label */}
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#3A3A3C] mb-3">
        Net Outstanding
      </p>

      {/* Giant balance number */}
      <div className="relative inline-block">
        {/* Glow halo behind the number */}
        {!isGhostMode && (
          <div
            className="absolute inset-0 -z-10 blur-3xl scale-150 rounded-full transition-colors duration-500"
            style={{ background: glowColor }}
          />
        )}

        <AmountDisplay
          amount={globalNetBalance}
          showSign={true}
          colored={true}
          className="font-bold tracking-[-0.04em] leading-none"
          style={{
            fontSize: 'clamp(3rem, 14vw, 5.5rem)',
            textShadow: isGhostMode ? 'none'
              : isPositive ? '0 0 60px rgba(50,215,75,0.4)'
              : isNegative ? '0 0 60px rgba(255,69,58,0.4)'
              : 'none',
          }}
        />
      </div>

      {/* Subtitle */}
      <p className="text-[#3A3A3C] text-xs mt-3 tracking-tight">
        {isZero
          ? 'All settled up'
          : isPositive
          ? `You are owed this amount`
          : `You owe this amount`
        }
        {txCount > 0 && (
          <span className="ml-1.5 text-[#2A2A2C]">· {txCount} entries</span>
        )}
      </p>

      {/* Status pill */}
      {!isZero && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
          className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-pill text-[10px] font-semibold tracking-wide uppercase"
          style={{
            background: isPositive ? 'rgba(50,215,75,0.1)' : 'rgba(255,69,58,0.1)',
            color:      isPositive ? '#32D74B' : '#FF453A',
            border:     `1px solid ${isPositive ? 'rgba(50,215,75,0.2)' : 'rgba(255,69,58,0.2)'}`,
          }}
        >
          {isPositive
            ? <TrendingUp  size={10} strokeWidth={2.5} />
            : <TrendingDown size={10} strokeWidth={2.5} />
          }
          {isPositive ? 'Receivable' : 'Payable'}
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Section Divider ───────────────────────────────────────────────
function Divider({ label }) {
  return (
    <div className="flex flex-col items-center justify-center mb-4 mt-2">
      <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#3A3A3C]">
        {label}
      </p>
    </div>
  );
}

// ── Contact Card (Matrix Tile) ────────────────────────────────────
function ContactCard({ contact, balance, lastTxDate }) {
  const navigate = useNavigate();
  const { isGhostMode } = useGhost();

  const isPositive = balance > 0;
  const isNegative = balance < 0;

  return (
    <motion.div
      variants={itemVariants}
      onClick={() => navigate(`/contact/${contact.id}`)}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="flex flex-col items-center justify-center p-3 cursor-pointer select-none rounded-[20px] aspect-square relative overflow-hidden group"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
      role="button"
      aria-label={`View ledger for ${contact.name}`}
    >
      {/* Subtle glow on hover/active */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
           style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />

      {/* Avatar circle */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold mb-2 shadow-inner"
        style={{
          background: isPositive
            ? 'rgba(50,215,75,0.12)'
            : isNegative
            ? 'rgba(255,69,58,0.12)'
            : 'rgba(255,255,255,0.06)',
          color: isPositive ? '#32D74B' : isNegative ? '#FF453A' : '#8E8E93',
        }}
      >
        {contact.name.charAt(0).toUpperCase()}
      </div>

      {/* Name */}
      <div className="text-center w-full px-1 mb-1">
        <p className="text-[#F5F5F7] text-[11px] font-medium tracking-tight truncate leading-tight group-hover:text-white transition-colors">
          {contact.name}
        </p>
      </div>

      {/* Balance */}
      <div className="flex flex-col items-center mt-auto">
        <AmountDisplay
          amount={balance}
          showSign={true}
          colored={true}
          className="text-[13px] font-bold tabular-nums tracking-tight leading-none"
        />
      </div>
    </motion.div>
  );
}

// ── Empty State ────────────────────────────────────────────────────
function EmptyState({ openModal }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 280, damping: 28 }}
      className="flex flex-col items-center justify-center px-8 pt-8 pb-4 text-center gap-5"
    >
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <Zap size={24} strokeWidth={1.5} className="text-[#3A3A3C]" />
      </div>

      <div>
        <p className="text-[#F5F5F7] text-lg font-semibold tracking-tight">
          Your ledger is clean
        </p>
        <p className="text-[#8E8E93] text-sm mt-1.5 leading-relaxed max-w-xs">
          Tap <span className="text-[#FF453A] font-semibold">Lend</span> or{' '}
          <span className="text-[#32D74B] font-semibold">Receive</span> below to record your first transaction.
        </p>
      </div>

      {/* Nudge arrow pointing at dock */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        className="text-[#2A2A2C]"
      >
        <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
          <path d="M10 0 L10 22 M10 22 L4 16 M10 22 L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </motion.div>
  );
}

// ── All Settled State (has contacts, all zero) ─────────────────────
function AllSettledState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="flex flex-col items-center gap-2 px-6 pt-6 pb-2 text-center"
    >
      <p className="text-[#32D74B] text-sm font-medium">✦ All accounts settled</p>
      <p className="text-[#3A3A3C] text-xs">
        No pending balances. Record new transactions below.
      </p>
    </motion.div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────
export default function Dashboard({ profile }) {
  const { contacts,     loading: contactsLoading }     = useContacts();
  const { transactions, globalNetBalance, getContactBalance, getContactTransactions, loading: txLoading } = useTransactions();
  const { openModal } = useInputModal();
  const navigate      = useNavigate();

  const isLoading = contactsLoading || txLoading;

  // ── Build the visible contact list ────────────────────────────
  const visibleContacts = useMemo(() => {
    const now = Date.now();

    return contacts
      .map((contact) => {
        const balance    = getContactBalance(contact.id);
        const contactTxs = getContactTransactions(contact.id);
        const lastTx     = contactTxs[0]; // already sorted desc

        // Determine if recently created (< 24h ago)
        const createdAt  = contact.createdAt?.toDate?.()?.getTime() ?? 0;
        const isNew      = (now - createdAt) < TWENTY_FOUR_HOURS;

        return { contact, balance, lastTxDate: lastTx?.date ?? null, isNew };
      })
      // Show if balance !== 0, OR if contact was created in the last 24h
      .filter(({ balance, isNew }) => balance !== 0 || isNew)
      // Sort: non-zero balances first (by absolute value desc), then new ones
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  }, [contacts, getContactBalance, getContactTransactions]);

  // Segregate by direction
  const oweYou   = visibleContacts.filter(({ balance }) => balance > 0);
  const youOwe   = visibleContacts.filter(({ balance }) => balance < 0);
  const newEmpty = visibleContacts.filter(({ balance }) => balance === 0);

  const hasAnyVisible = visibleContacts.length > 0;
  const hasContacts   = contacts.length > 0;

  // ── Loading skeleton ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="px-6 pt-4 pb-8">
        <div className="text-center mb-10">
          <div className="shimmer-bg h-16 w-48 rounded-xl mx-auto mb-3" />
          <div className="shimmer-bg h-3 w-24 rounded-full mx-auto" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-0 py-3.5">
            <div className="shimmer-bg w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="shimmer-bg h-3.5 w-28 rounded-full mb-2" />
              <div className="shimmer-bg h-2.5 w-16 rounded-full" />
            </div>
            <div className="shimmer-bg h-4 w-20 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-4">

      {/* ── Hero Balance ─────────────────────────────────────── */}
      <HeroBalance
        globalNetBalance={globalNetBalance}
        txCount={transactions.length}
      />

      {/* ── Contact Orbit ─────────────────────────────────────── */}
      {!hasContacts ? (
        <EmptyState openModal={openModal} />
      ) : !hasAnyVisible ? (
        <AllSettledState />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="flex flex-col"
        >
          {/* Contacts who owe you */}
          {oweYou.length > 0 && (
            <section aria-label="People who owe you">
              <Divider label={`Owed to you · ${oweYou.length}`} />
              <div className="grid grid-cols-3 gap-3 px-6">
                {oweYou.map(({ contact, balance, lastTxDate }) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    balance={balance}
                    lastTxDate={lastTxDate}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Contacts you owe */}
          {youOwe.length > 0 && (
            <section aria-label="People you owe" className={oweYou.length > 0 ? 'mt-6' : ''}>
              <Divider label={`You owe · ${youOwe.length}`} />
              <div className="grid grid-cols-3 gap-3 px-6">
                {youOwe.map(({ contact, balance, lastTxDate }) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    balance={balance}
                    lastTxDate={lastTxDate}
                  />
                ))}
              </div>
            </section>
          )}

          {/* New contacts with zero balance */}
          {newEmpty.length > 0 && (
            <section aria-label="Recent contacts" className="mt-6">
              <Divider label="Recently Added" />
              <div className="grid grid-cols-3 gap-3 px-6">
                {newEmpty.map(({ contact, balance, lastTxDate }) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    balance={balance}
                    lastTxDate={lastTxDate}
                  />
                ))}
              </div>
            </section>
          )}
        </motion.div>
      )}
    </div>
  );
}
