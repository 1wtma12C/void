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

import { useMemo, useState }  from 'react';
import { useNavigate }      from 'react-router-dom';
import { motion }           from 'framer-motion';
import { UserPlus, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';

import { useContacts }      from '../hooks/useContacts';
import { useTransactions }  from '../hooks/useTransactions';
import { useInputModal }    from '../contexts/InputModalContext';
import { useGhost }         from '../contexts/GhostContext';
import AmountDisplay, { formatCurrency } from '../components/ui/AmountDisplay';
import { formatRelativeDate, calculateNetBalance } from '../lib/utils';
import { SearchFilter } from '../components/ui';

// ── Constants ────────────────────────────────────────────────────
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const DASHBOARD_FILTERS = [
  { id: 'all',     label: 'All Contacts' },
  { id: 'owe_me',  label: 'Owe Me' },
  { id: 'i_owe',   label: 'I Owe' },
  { id: 'settled', label: 'Settled' },
];

const DASHBOARD_SORTS = [
  { id: 'balance_desc', label: 'Highest Balance' },
  { id: 'balance_asc',  label: 'Lowest Balance' },
];

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

  // Determine the color based on the mathematical balance
  const glowColorClass = isPositive ? 'bg-[#32D74B]' : isNegative ? 'bg-[#FF453A]' : 'bg-white';

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
      <div className="relative flex justify-center items-center">
        {/* The Ambient Light Layer */}
        {!isGhostMode && (
          <div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] ${glowColorClass} blur-[80px] opacity-25 z-0 pointer-events-none rounded-full transition-colors duration-700`} 
            style={{ transform: 'translate(-50%, -50%) translateZ(0)' }}
          />
        )}

        {/* The Foreground Amount Text */}
        <div className="relative z-10">
          <AmountDisplay
            value={globalNetBalance}
            showSign={true}
            colored={true}
            ghostIndex={0}
            className="text-6xl md:text-8xl font-bold tracking-tighter leading-none"
          />
        </div>
      </div>
      
      {/* Subtitle */}
      <p className="text-[#3A3A3C] text-xs mt-3 tracking-tight">
        {isZero
          ? 'All settled up'
          : isPositive
          ? `You are owed this amount`
          : `You owe this amount`
        }
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

// Helper function to extract and capitalize the first name
const formatFirstName = (fullName) => {
  if (!fullName) return '';
  const firstName = fullName.split(' ')[0]; // Grab everything before the first space
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};

// ── Contact Card (Matrix Tile) ────────────────────────────────────
function ContactCard({ contact, balance, lastTxDate, ghostIndex }) {
  const navigate = useNavigate();
  const { isGhostMode } = useGhost();

  const isPositive = balance > 0;
  const isNegative = balance < 0;

  const displayName = formatFirstName(contact.name);

  return (
    <motion.div
      variants={itemVariants}
      onClick={() => navigate(`/contact/${contact.id}`)}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="w-[calc(33.333%-0.5rem)] sm:w-[calc(25%-0.75rem)] md:w-[calc(20%-1rem)] lg:w-[calc(16.666%-1rem)] flex-shrink-0 flex flex-col items-center justify-center text-center p-3 md:p-6 h-full cursor-pointer select-none rounded-2xl relative overflow-hidden group"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      role="button"
      aria-label={`View ledger for ${contact.name}`}
    >
      {/* Subtle glow on hover/active */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
           style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />

      {/* Avatar circle */}
      <div
        className="w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold mb-2 shadow-inner"
        style={{
          background: isPositive
            ? 'rgba(50,215,75,0.12)'
            : isNegative
            ? 'rgba(255,69,58,0.12)'
            : 'rgba(255,255,255,0.06)',
          color: isPositive ? '#32D74B' : isNegative ? '#FF453A' : '#8E8E93',
        }}
      >
        {displayName.charAt(0)}
      </div>

      {/* Name */}
      <span className="text-xs md:text-sm text-gray-400 mb-0.5 font-medium tracking-tight truncate w-full group-hover:text-white transition-colors">
        {displayName}
      </span>

      {/* Balance */}
      <AmountDisplay
        value={balance}
        showSign={true}
        colored={true}
        ghostIndex={ghostIndex}
        className="text-base md:text-xl font-bold truncate w-full text-center leading-none mt-1"
      />
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

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort,   setSort]   = useState('balance_desc');

  const isLoading = contactsLoading || txLoading;

  // ── Bulletproof Math Engine (Defensive Filtering) ─────────────
  const bulletproofGlobalBalance = useMemo(() => {
    // 1. Get IDs of all active contacts (already filtered by useContacts hook)
    const activeContactIds = new Set(contacts.map(c => c.id));
    
    // 2. Filter transactions: must belong to an active contact
    const validTransactions = transactions.filter(t => activeContactIds.has(t.contactId));
    
    // 3. Pass ONLY validTransactions into the calculator
    return calculateNetBalance(validTransactions);
  }, [contacts, transactions]);

  // ── Build the visible contact list ────────────────────────────
  const visibleContacts = useMemo(() => {
    const now = Date.now();

    let list = contacts
      .map((contact) => {
        const balance    = getContactBalance(contact.id);
        const contactTxs = getContactTransactions(contact.id);
        const lastTx     = contactTxs[0]; // already sorted desc

        // Determine if recently created (< 24h ago)
        const createdAt  = contact.createdAt?.toDate?.()?.getTime() ?? 0;
        const isNew      = (now - createdAt) < TWENTY_FOUR_HOURS;

        return { contact, balance, lastTxDate: lastTx?.date ?? null, isNew };
      });

    // 1. Search Filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(item => item.contact.name.toLowerCase().includes(q));
    }

    // 2. Dropdown Filter
    if (filter === 'owe_me')  list = list.filter(item => item.balance > 0);
    if (filter === 'i_owe')   list = list.filter(item => item.balance < 0);
    if (filter === 'settled') list = list.filter(item => item.balance === 0);

    // 3. Sorting
    list.sort((a, b) => {
      if (sort === 'balance_desc') return Math.abs(b.balance) - Math.abs(a.balance);
      if (sort === 'balance_asc')  return Math.abs(a.balance) - Math.abs(b.balance);
      return 0;
    });

    return list;
  }, [contacts, getContactBalance, getContactTransactions, search, filter, sort]);

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
        globalNetBalance={bulletproofGlobalBalance}
        txCount={transactions.length}
      />

      {/* ── Search & Filter ──────────────────────────────────── */}
      {hasContacts && (
        <SearchFilter
          placeholder="Search contacts..."
          value={search}
          onChange={setSearch}
          filterOptions={DASHBOARD_FILTERS}
          activeFilter={filter}
          onFilterChange={setFilter}
          sortOptions={DASHBOARD_SORTS}
          activeSort={sort}
          onSortChange={setSort}
        />
      )}

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
              <div className="flex flex-wrap justify-center content-start gap-2 md:gap-4 w-full px-2">
                {oweYou.map(({ contact, balance, lastTxDate }, index) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    balance={balance}
                    lastTxDate={lastTxDate}
                    ghostIndex={index + 1}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Contacts you owe */}
          {youOwe.length > 0 && (
            <section aria-label="People you owe" className={oweYou.length > 0 ? 'mt-6' : ''}>
              <Divider label={`You owe · ${youOwe.length}`} />
              <div className="flex flex-wrap justify-center content-start gap-2 md:gap-4 w-full px-2">
                {youOwe.map(({ contact, balance, lastTxDate }, index) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    balance={balance}
                    lastTxDate={lastTxDate}
                    ghostIndex={oweYou.length + index + 1}
                  />
                ))}
              </div>
            </section>
          )}

          {/* New contacts with zero balance */}
          {newEmpty.length > 0 && (
            <section aria-label="Recent contacts" className="mt-6">
              <Divider label="Recently Added" />
              <div className="flex flex-wrap justify-center content-start gap-2 md:gap-4 w-full px-2">
                {newEmpty.map(({ contact, balance, lastTxDate }, index) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    balance={balance}
                    lastTxDate={lastTxDate}
                    ghostIndex={oweYou.length + youOwe.length + index + 1}
                  />
                ))}
              </div>
            </section>
          )}
        </motion.div>
      )}

      {/* ── Add Contact shortcut — REMOVED (Redundant with floating dock) ── */}
    </div>
  );
}
