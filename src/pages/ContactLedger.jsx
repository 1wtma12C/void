/**
 * VOID — Contact Ledger (Profile View)
 * ─────────────────────────────────────────────────────────────
 * Shows one contact's complete transaction timeline.
 * Features: WhatsApp nudge, PDF export, Ghost mode pill,
 *           double-entry timeline, delete transaction,
 *           and reminders.
 */

import { useRef, useCallback, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence }        from 'framer-motion';
import {
  MessageCircle, FileText, Eye, EyeOff,
  Trash2, AlertCircle, Loader2, Phone, Edit2, Bell
} from 'lucide-react';

import { useContacts }               from '../hooks/useContacts';
import { useTransactions, TX_TYPE }  from '../hooks/useTransactions';
import { useUserProfile }            from '../hooks/useUserProfile';
import { useInputModal }             from '../contexts/InputModalContext';
import { useGhost }                  from '../contexts/GhostContext';
import { formatDate, formatRelativeDate, buildWhatsAppUrl } from '../lib/utils';
import { MagnifiedInput, AmountDisplay, SearchFilter } from '../components/ui';
import EditContactModal from '../components/modals/EditContactModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import ReminderModal from '../components/modals/ReminderModal';

// ── Constants ────────────────────────────────────────────────────
const LEDGER_FILTERS = [
  { id: 'all',      label: 'All Activity' },
  { id: 'lent',     label: 'Lent Only' },
  { id: 'received', label: 'Received Only' },
];

const LEDGER_SORTS = [
  { id: 'date_desc',   label: 'Newest First' },
  { id: 'date_asc',    label: 'Oldest First' },
  { id: 'amount_desc', label: 'Amount: High to Low' },
];

const TIME_FILTERS = [
  { id: 'all',      label: 'All Time' },
  { id: 'month',    label: 'This Month' },
  { id: 'days30',   label: 'Last 30 Days' },
  { id: 'custom',   label: 'Custom Range' },
];

// ── PDF generator (lazy import to avoid bundling html2pdf eagerly) ──
async function generatePDF(contact, transactions, profile) {
  const html2pdf = (await import('html2pdf.js')).default;

  // Calculate running balance
  let running = 0;
  const rows = [...transactions].reverse().map((tx) => {
    const isLent = tx.type === TX_TYPE.LENT;
    running += isLent ? tx.amount : -tx.amount;
    return { ...tx, runningBalance: running };
  }).reverse();

  const netBalance = transactions.reduce((acc, tx) =>
    tx.type === TX_TYPE.LENT ? acc + tx.amount : acc - tx.amount, 0);

  const el = document.createElement('div');
  el.style.cssText = 'font-family: Arial, sans-serif; padding: 40px; color: #111; background: #fff; max-width: 750px; margin: 0 auto;';
  el.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; border-bottom:2px solid #111; padding-bottom:16px;">
      <div>
        <h1 style="font-size:28px; font-weight:700; margin:0; letter-spacing:-0.03em;">VOID</h1>
        <p style="color:#666; font-size:12px; margin:4px 0 0;">Personal Finance Ledger</p>
      </div>
      <div style="text-align:right;">
        <p style="font-size:13px; color:#333; margin:0;">Ledger for</p>
        <h2 style="font-size:20px; font-weight:700; margin:4px 0 0;">${contact.name}</h2>
        ${contact.phone ? `<p style="font-size:12px; color:#666; margin:4px 0 0;">${contact.phone}</p>` : ''}
      </div>
    </div>

    <div style="display:flex; gap:32px; margin-bottom:32px;">
      <div style="background:${netBalance >= 0 ? '#f0fff4' : '#fff0f0'}; border:1px solid ${netBalance >= 0 ? '#86efac' : '#fca5a5'}; border-radius:8px; padding:16px 24px; flex:1;">
        <p style="font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#666; margin:0 0 6px;">Net Balance</p>
        <p style="font-size:26px; font-weight:700; margin:0; color:${netBalance >= 0 ? '#15803d' : '#dc2626'};">
          ${netBalance >= 0 ? '+' : '-'}₹${Math.abs(netBalance).toLocaleString('en-IN')}
        </p>
        <p style="font-size:11px; color:#666; margin:6px 0 0;">
          ${netBalance > 0 ? `${contact.name} owes you` : netBalance < 0 ? `You owe ${contact.name}` : 'All settled'}
        </p>
      </div>
      ${profile?.upiId ? `
      <div style="background:#f8f8f8; border:1px solid #e5e5e5; border-radius:8px; padding:16px 24px; flex:1;">
        <p style="font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#666; margin:0 0 6px;">UPI ID (Owner)</p>
        <p style="font-size:14px; font-weight:600; margin:0;">${profile.upiId}</p>
        <p style="font-size:11px; color:#666; margin:6px 0 0;">Share for settlement</p>
      </div>` : ''}
    </div>

    <table style="width:100%; border-collapse:collapse; font-size:13px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="text-align:left; padding:10px 12px; border-bottom:1px solid #ddd; font-weight:600;">Date</th>
          <th style="text-align:left; padding:10px 12px; border-bottom:1px solid #ddd; font-weight:600;">Note</th>
          <th style="text-align:right; padding:10px 12px; border-bottom:1px solid #ddd; font-weight:600; color:#dc2626;">Lent (−)</th>
          <th style="text-align:right; padding:10px 12px; border-bottom:1px solid #ddd; font-weight:600; color:#15803d;">Received (+)</th>
          <th style="text-align:right; padding:10px 12px; border-bottom:1px solid #ddd; font-weight:600;">Balance</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((tx, i) => {
          const isLent = tx.type === TX_TYPE.LENT;
          const bal    = tx.runningBalance;
          return `
          <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'};">
            <td style="padding:9px 12px; border-bottom:1px solid #f0f0f0; color:#555;">${formatDate(tx.date)}</td>
            <td style="padding:9px 12px; border-bottom:1px solid #f0f0f0;">${tx.note || '—'}</td>
            <td style="padding:9px 12px; border-bottom:1px solid #f0f0f0; text-align:right; color:#dc2626;">
              ${isLent ? `₹${tx.amount.toLocaleString('en-IN')}` : ''}
            </td>
            <td style="padding:9px 12px; border-bottom:1px solid #f0f0f0; text-align:right; color:#15803d;">
              ${!isLent ? `₹${tx.amount.toLocaleString('en-IN')}` : ''}
            </td>
            <td style="padding:9px 12px; border-bottom:1px solid #f0f0f0; text-align:right; font-weight:600; color:${bal >= 0 ? '#15803d' : '#dc2626'};">
              ${bal >= 0 ? '+' : '−'}₹${Math.abs(bal).toLocaleString('en-IN')}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <div style="margin-top:32px; padding-top:16px; border-top:1px solid #e5e5e5; display:flex; justify-content:space-between; align-items:center;">
      <p style="font-size:11px; color:#999; margin:0;">Generated by VOID · ${new Date().toLocaleString('en-IN')}</p>
      <p style="font-size:11px; color:#999; margin:0;">${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}</p>
    </div>
  `;

  document.body.appendChild(el);
  await html2pdf()
    .set({
      margin:      [10, 10, 10, 10],
      filename:    `VOID_${contact.name.replace(/\s+/g, '_')}_ledger.pdf`,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#ffffff' },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(el)
    .save();
  document.body.removeChild(el);
}

// ── Timeline entry ──────────────────────────────────────────────
function TimelineEntry({ tx, ghostIndex }) {
  const isLent     = tx.type === TX_TYPE.LENT;
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { softDeleteTransaction } = useTransactions();

  async function handleDeleteConfirm() {
    setDeleting(true);
    await softDeleteTransaction(tx.id);
    setShowConfirm(false);
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{    opacity: 0, y: -8, transition: { duration: 0.15 } }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="relative w-full rounded-2xl mb-2 overflow-hidden bg-black"
        style={{ transform: 'translateZ(0)' }}
      >
        {/* Background (Trash Layer) - Strictly Right Anchored with inset */}
        <div 
          className="absolute right-[1px] inset-y-0 w-24 bg-[#FF453A] flex justify-center items-center z-0 cursor-pointer rounded-2xl"
          onClick={() => setShowConfirm(true)}
        >
          <Trash2 size={20} className="text-white" />
        </div>

        {/* Foreground (Solid Apple Surface with Black Gasket) */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -80, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, info) => {
            if (info.offset.x < -60) {
              setShowConfirm(true);
            }
          }}
          className="relative z-10 w-full p-4 rounded-2xl bg-[#1C1C1E] border-2 border-black shadow-lg flex flex-row justify-between items-center cursor-grab active:cursor-grabbing"
        >
          {/* Left Side: Metadata (Date & Note) - Strictly Space Gray / Off-white */}
          <div className="flex flex-col items-start gap-1 max-w-[70%]">
            <p className="text-[#8E8E93] text-[10px] uppercase tracking-[0.14em] font-bold">
              {formatRelativeDate(tx.date)}
            </p>
            {tx.note ? (
              <p className="text-[#F5F5F7] text-base font-medium leading-tight truncate w-full">
                {tx.note}
              </p>
            ) : (
              <p className="text-[#3A3A3C] text-base italic font-medium leading-tight">
                No note
              </p>
            )}
          </div>

          {/* Right Side: Hero Amount - Semantic Red/Green */}
          <div className="flex flex-col items-end text-right ml-4">
            <AmountDisplay
              value={isLent ? -tx.amount : tx.amount}
              showSign={true}
              colored={true}
              ghostIndex={ghostIndex}
              className="text-xl md:text-2xl font-bold tracking-tight leading-none"
            />
          </div>
        </motion.div>
      </motion.div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Transaction?"
        message="This entry will be moved to the recycle bin and the ledger balance will update."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirm(false)}
        loading={deleting}
      />
    </>
  );
}

// ── Phone prompt modal ──────────────────────────────────────────
function PhonePrompt({ contact, onClose, onSave }) {
  const { updateContact } = useContacts();
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!phone.trim()) return;
    setLoading(true);
    await updateContact(contact.id, { phone: phone.trim() });
    onSave(phone.trim());
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm p-6 rounded-glass flex flex-col items-center justify-center text-center gap-4 mx-auto"
        style={{ background: 'rgba(20,20,20,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex flex-col items-center gap-2">
          <Phone size={20} strokeWidth={1.75} className="text-[#32D74B]" />
          <p className="text-[#F5F5F7] font-semibold text-base">Add phone number</p>
        </div>
        <p className="text-[#8E8E93] text-sm leading-relaxed mb-1">
          Add {contact.name}'s phone number to send them a WhatsApp nudge.
        </p>
        <MagnifiedInput
          autoFocus
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={setPhone}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="+91 98765 43210"
        />
        <div className="flex w-full gap-3 mt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-pill text-sm text-[#8E8E93] cursor-pointer"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            Cancel
          </button>
          <motion.button
            onClick={handleSave} disabled={!phone.trim() || loading}
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-2.5 rounded-pill text-sm font-semibold text-black cursor-pointer"
            style={{ background: phone.trim() ? '#32D74B' : 'rgba(50,215,75,0.3)' }}
          >
            {loading ? 'Saving…' : 'Save & Send'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ContactLedger({ profile }) {
  const { id }                              = useParams();
  const navigate                            = useNavigate();
  const { getContact, softDeleteContact, updateContact }   = useContacts();
  const { getContactTransactions, getContactBalance, loading } = useTransactions();
  const { isGhostMode, toggleGhost }        = useGhost();
  const { openModal }                       = useInputModal();

  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [showEditModal,   setShowEditModal]   = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [pdfLoading,      setPdfLoading]      = useState(false);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort,   setSort]   = useState('date_desc');
  const [timeframe, setTimeframe] = useState('all');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const contact      = getContact(id);
  const transactions = getContactTransactions(id);
  const netBalance   = getContactBalance(id);

  // ── Build filtered transaction list ──────────────────────────
  const filteredTxs = useMemo(() => {
    let list = [...transactions];

    // 1. Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(tx => 
        tx.note?.toLowerCase().includes(q) || 
        tx.amount.toString().includes(q)
      );
    }

    // 2. Type Filter
    if (filter === 'lent')     list = list.filter(tx => tx.type === TX_TYPE.LENT);
    if (filter === 'received') list = list.filter(tx => tx.type === TX_TYPE.RECEIVED);

    // 3. Timeframe Filter
    if (timeframe !== 'all') {
      const now = new Date();
      if (timeframe === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        list = list.filter(tx => tx.date?.toDate?.() >= startOfMonth);
      } else if (timeframe === 'days30') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        list = list.filter(tx => tx.date?.toDate?.() >= thirtyDaysAgo);
      } else if (timeframe === 'custom' && customRange.start && customRange.end) {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        end.setHours(23, 59, 59, 999);
        list = list.filter(tx => {
          const d = tx.date?.toDate?.();
          return d >= start && d <= end;
        });
      }
    }

    // 4. Sort
    list.sort((a, b) => {
      if (sort === 'date_desc') return b.date?.toDate?.() - a.date?.toDate?.();
      if (sort === 'date_asc')  return a.date?.toDate?.() - b.date?.toDate?.();
      if (sort === 'amount_desc') return b.amount - a.amount;
      return 0;
    });

    return list;
  }, [transactions, search, filter, sort, timeframe, customRange]);

  // ── WhatsApp nudge ─────────────────────────────────────────────
  const handleWhatsApp = useCallback(() => {
    if (!contact) return;
    if (!contact.phone) { setShowPhonePrompt(true); return; }

    const absAmt  = Math.abs(netBalance).toLocaleString('en-IN');
    const signature = 'and hey from Manthan';
    
    // Scenario A: They owe you (netBalance > 0)
    // Scenario B: You owe them (netBalance < 0)
    const message = netBalance > 0
      ? `Hey ${contact.name}, just keeping our records synced. Your current pending balance is ₹${absAmt}. You can settle it via my UPI here: ${profile?.upiId ?? 'my UPI'}. ${signature}`
      : `Hey ${contact.name}, just keeping our records synced. My ledger shows I currently owe you ₹${absAmt}. I will settle this soon! ${signature}`;

    window.open(buildWhatsAppUrl(contact.phone, message), '_blank');
  }, [contact, netBalance, profile]);

  // Messages (SMS) nudge
  const handleSMS = useCallback(() => {
    if (!contact) return;
    if (!contact.phone) { setShowPhonePrompt(true); return; }

    const absAmt  = Math.abs(netBalance).toLocaleString('en-IN');
    const signature = 'and hey from Manthan';
    const message = netBalance > 0
      ? `Hey ${contact.name}, just keeping our records synced. Your current pending balance is ₹${absAmt}. You can settle it via my UPI here: ${profile?.upiId ?? 'my UPI'}. ${signature}`
      : `Hey ${contact.name}, just keeping our records synced. My ledger shows I currently owe you ₹${absAmt}. I will settle this soon! ${signature}`;
    
    window.open(`sms:${contact.phone}&body=${encodeURIComponent(message)}`, '_self');
  }, [contact, netBalance, profile]);

  // After phone prompt saves, re-trigger WhatsApp
  const handlePhoneSaved = useCallback((phone) => {
    setShowPhonePrompt(false);
    const absAmt  = Math.abs(netBalance).toLocaleString('en-IN');
    const signature = 'and hey from Manthan';
    const message = netBalance > 0
      ? `Hey ${contact.name}, just keeping our records synced. Your current pending balance is ₹${absAmt}. You can settle it via my UPI here: ${profile?.upiId ?? 'my UPI'}. ${signature}`
      : `Hey ${contact.name}, just keeping our records synced. My ledger shows I currently owe you ₹${absAmt}. I will settle this soon! ${signature}`;
    window.open(buildWhatsAppUrl(phone, message), '_blank');
  }, [contact, netBalance, profile]);

  // ── PDF export ─────────────────────────────────────────────────
  const handlePDF = useCallback(async () => {
    if (!contact || pdfLoading) return;
    setPdfLoading(true);
    try { await generatePDF(contact, transactions, profile); }
    catch (err) { console.error('[VOID] PDF error:', err); }
    finally { setPdfLoading(false); }
  }, [contact, transactions, profile, pdfLoading]);

  // ── Soft Delete Contact (called by EditContactModal's onDelete) ─────────
  const handleDeleteContact = useCallback(async () => {
    setDeleteLoading(true);
    await softDeleteContact(contact.id);
    navigate('/');
  }, [contact, softDeleteContact, navigate]);

  // ── Save Reminder ──────────────────────────────────────────────
  const handleSaveReminder = useCallback(async (timestamp) => {
    if (!contact) return;
    await updateContact(contact.id, { reminderDate: timestamp });
    // Trigger permission request if needed
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, [contact, updateContact]);

  // ── Group transactions by date ─────────────────────────────────
  const grouped = filteredTxs.reduce((acc, tx) => {
    const key = formatDate(tx.date) || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});

  if (!contact && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-3 px-6 text-center">
        <AlertCircle size={28} strokeWidth={1.5} className="text-[#FF453A]" />
        <p className="text-[#F5F5F7] font-semibold">Contact not found</p>
        <p className="text-[#8E8E93] text-sm">This contact may have been deleted.</p>
      </div>
    );
  }

  const isPositive = netBalance > 0;
  const isNegative = netBalance < 0;

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-6 pt-2 pb-6 flex flex-col items-center justify-center text-center gap-2">
        {/* Avatar */}
        <motion.div
          onClick={() => setShowEditModal(true)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto cursor-pointer"
          style={{
            background: isPositive ? 'rgba(50,215,75,0.12)'  : isNegative ? 'rgba(255,69,58,0.12)' : 'rgba(255,255,255,0.06)',
            border:     `1px solid ${isPositive ? 'rgba(50,215,75,0.25)' : isNegative ? 'rgba(255,69,58,0.25)' : 'rgba(255,255,255,0.1)'}`,
            color:      isPositive ? '#32D74B' : isNegative ? '#FF453A' : '#8E8E93',
          }}
          aria-label="Edit Profile"
        >
          {contact?.name?.charAt(0)?.toUpperCase() ?? '?'}
        </motion.div>

        {/* Vertical Hierarchy: Name Top, Amount Bottom */}
        <div className="flex flex-col items-center gap-1">
          <motion.h1
            onClick={() => setShowEditModal(true)}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 28 }}
            className="text-xl text-[#8E8E93] font-medium tracking-wide cursor-pointer"
          >
            {contact?.name}
          </motion.h1>

          {/* Dynamic Ambient Glow Wrapper */}
          <div className="relative flex justify-center items-center">
            {/* The Ambient Light Layer */}
            {!isGhostMode && (
              <div 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] ${isPositive ? 'bg-[#32D74B]' : isNegative ? 'bg-[#FF453A]' : 'bg-white'} blur-[80px] opacity-25 z-0 pointer-events-none rounded-full transition-colors duration-700`} 
                style={{ transform: 'translate(-50%, -50%) translateZ(0)' }}
              />
            )}

            {/* The Foreground Amount Text */}
            <div className="relative z-10">
              <AmountDisplay
                value={netBalance}
                showSign={true}
                colored={true}
                ghostIndex={0}
                className="text-5xl md:text-6xl font-bold tracking-tight"
              />
            </div>
          </div>
        </div>

        <p className="text-[#3A3A3C] text-xs mt-0.5">
          {isPositive ? 'owes you' : isNegative ? 'you owe' : 'all settled'}
        </p>

        {/* ── Action pills ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 28 }}
          className="flex items-center justify-center gap-2 mt-5 flex-wrap"
        >
          {/* WhatsApp */}
          <motion.button
            onClick={handleWhatsApp}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer border border-green-500/20 bg-green-500/10 text-green-500 select-none"
            aria-label="Send WhatsApp nudge"
          >
            <MessageCircle size={13} strokeWidth={2} />
            WhatsApp
          </motion.button>

          {/* Messages (SMS) */}
          <motion.button
            onClick={handleSMS}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer border border-blue-500/20 bg-blue-500/10 text-blue-500 select-none"
            aria-label="Send SMS nudge"
          >
            <Phone size={13} strokeWidth={2} />
            Messages
          </motion.button>

          {/* Reminder */}
          <motion.button
            onClick={() => setShowReminderModal(true)}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer border border-white/20 bg-white/10 text-white select-none"
            aria-label="Set Reminder"
          >
            <Bell size={13} strokeWidth={2} />
            Reminder
          </motion.button>

          {/* PDF */}
          <motion.button
            onClick={handlePDF}
            disabled={pdfLoading}
            whileTap={!pdfLoading ? { scale: 0.96 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer border border-yellow-500/20 bg-yellow-500/10 text-yellow-500 select-none"
            aria-label="Export PDF dossier"
          >
            {pdfLoading
              ? <Loader2 size={13} strokeWidth={2} className="animate-spin" />
              : <FileText size={13} strokeWidth={1.75} />
            }
            {pdfLoading ? 'Generating…' : 'Export PDF'}
          </motion.button>

          {/* Ghost toggle */}
          <motion.button
            onClick={toggleGhost}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer border border-gray-400/20 bg-gray-400/10 text-gray-400 select-none"
            aria-label={isGhostMode ? 'Show amounts' : 'Hide amounts (Ghost Mode)'}
          >
            {isGhostMode ? <EyeOff size={13} strokeWidth={2} /> : <Eye size={13} strokeWidth={1.75} />}
            Ghost Mode
          </motion.button>
        </motion.div>
      </div>

      {/* ── Search & Filter ──────────────────────────────────── */}
      {transactions.length > 0 && (
        <SearchFilter
          placeholder="Search ledger..."
          value={search}
          onChange={setSearch}
          filterOptions={LEDGER_FILTERS}
          activeFilter={filter}
          onFilterChange={setFilter}
          sortOptions={LEDGER_SORTS}
          activeSort={sort}
          onSortChange={setSort}
          timeframeOptions={TIME_FILTERS}
          activeTimeframe={timeframe}
          onTimeframeChange={setTimeframe}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
      )}

      {/* ── Transaction Timeline ──────────────────────────────── */}
      {filteredTxs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center"
        >
          <p className="text-[#3A3A3C] text-sm">No matches found</p>
          {(search || filter !== 'all' || timeframe !== 'all') && (
            <button 
              onClick={() => { setSearch(''); setFilter('all'); setTimeframe('all'); }}
              className="text-[#32D74B] text-xs font-medium mt-1 cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </motion.div>
      ) : (
        <div className="flex flex-col pb-4 gap-2">
          {/* Date section divider label at top */}
          <div className="px-6 mb-2">
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3A3A3C]">
              Timeline · ${sort === 'date_desc' ? 'newest first' : sort === 'date_asc' ? 'oldest first' : 'by amount'}
            </p>
          </div>

          <AnimatePresence>
            {(() => {
              let txIndex = 1;
              return Object.entries(grouped).map(([dateLabel, txs]) => (
                <div key={dateLabel} className="flex flex-col mb-3 gap-2">
                  {/* Date divider */}
                  <div className="flex flex-col items-center justify-center px-4 mt-2 mb-1">
                    <p className="text-[10px] text-[#3A3A3C] font-semibold tracking-[0.14em] uppercase whitespace-nowrap">{dateLabel}</p>
                  </div>

                  {/* Entries for this date */}
                  <div className="flex flex-col group gap-2">
                    {txs.map((tx) => (
                      <TimelineEntry
                        key={tx.id}
                        tx={tx}
                        ghostIndex={txIndex++}
                      />
                    ))}
                  </div>
                </div>
              ));
            })()}
          </AnimatePresence>
        </div>
      )}

      {/* Phone prompt overlay */}
      <AnimatePresence>
        {showPhonePrompt && contact && (
          <PhonePrompt
            contact={contact}
            onClose={() => setShowPhonePrompt(false)}
            onSave={handlePhoneSaved}
          />
        )}
      </AnimatePresence>

      <ReminderModal
        isOpen={showReminderModal}
        contactName={contact?.name}
        onClose={() => setShowReminderModal(false)}
        onSave={handleSaveReminder}
      />

      <EditContactModal
        isOpen={showEditModal}
        contact={contact}
        onClose={() => setShowEditModal(false)}
        onDelete={handleDeleteContact}
      />
    </div>
  );
}
