/**
 * VOID — Contact Ledger (Profile View)
 * ─────────────────────────────────────────────────────────────
 * Shows one contact's complete transaction timeline.
 * Features: WhatsApp nudge, PDF export, Ghost mode pill,
 *           double-entry timeline, delete transaction.
 */

import { useRef, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence }        from 'framer-motion';
import {
  MessageCircle, FileText, Eye, EyeOff,
  Trash2, AlertCircle, Loader2, Phone, Edit2
} from 'lucide-react';

import { useContacts }               from '../hooks/useContacts';
import { useTransactions, TX_TYPE }  from '../hooks/useTransactions';
import { useUserProfile }            from '../hooks/useUserProfile';
import { useInputModal }             from '../contexts/InputModalContext';
import { useGhost }                  from '../contexts/GhostContext';
import { formatDate, formatRelativeDate, buildWhatsAppUrl } from '../lib/utils';
import MagnifiedInput from '../components/ui/MagnifiedInput';
import EditContactModal from '../components/modals/EditContactModal';
import ConfirmModal from '../components/modals/ConfirmModal';

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
function TimelineEntry({ tx, isGhostMode }) {
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
        className="flex flex-col items-center justify-center px-4 py-0.5 w-full"
      >
        {/* Card */}
        <div
          className="relative w-full max-w-[85%] rounded-glass-sm px-4 py-3 flex flex-col items-center justify-center text-center group"
          style={{
            background:  isLent ? 'rgba(255,69,58,0.09)'  : 'rgba(50,215,75,0.09)',
            border:      `1px solid ${isLent ? 'rgba(255,69,58,0.18)' : 'rgba(50,215,75,0.18)'}`,
          }}
        >
          {/* Amount */}
          <AmountDisplay
            amount={tx.amount}
            type={tx.type}
            showSign={true}
            prefix={isLent ? '−' : '+'}
            colored={true}
            className="text-xl font-bold tabular-nums tracking-tight leading-tight"
          />

          {/* Note */}
          {tx.note && (
            <p className="text-[#8E8E93] text-xs mt-1 leading-snug">{tx.note}</p>
          )}

          {/* Date */}
          <p className="text-[#3A3A3C] text-[10px] mt-1.5">{formatRelativeDate(tx.date)}</p>

          {/* Delete button */}
          <motion.button
            onClick={() => setShowConfirm(true)}
            whileTap={{ scale: 0.88 }}
            disabled={deleting}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer opacity-0 md:group-hover:opacity-100 transition-opacity md:opacity-0 opacity-100"
            style={{ background: 'rgba(40,40,40,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
            aria-label="Delete transaction"
          >
            {deleting
              ? <Loader2 size={10} className="animate-spin text-white" />
              : <Trash2 size={10} className="text-[#8E8E93]" strokeWidth={2} />
            }
          </motion.button>
        </div>
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
  const { getContact, softDeleteContact }   = useContacts();
  const { getContactTransactions, getContactBalance, loading } = useTransactions();
  const { isGhostMode, toggleGhost }        = useGhost();
  const { openModal }                       = useInputModal();

  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [showEditModal,   setShowEditModal]   = useState(false);
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [pdfLoading,      setPdfLoading]      = useState(false);

  const contact      = getContact(id);
  const transactions = getContactTransactions(id);
  const netBalance   = getContactBalance(id);

  // ── Communication ─────────────────────────────────────────────
  const handleWhatsApp = useCallback(() => {
    if (!contact) return;
    if (!contact.phone) { setShowPhonePrompt(true); return; }

    const absAmt  = Math.abs(netBalance).toLocaleString('en-IN');
    const message = netBalance > 0
      ? `Hi ${contact.name}, just a gentle nudge! You have a pending balance of ₹${absAmt} with me. You can settle it via UPI: ${profile?.upiId ?? 'my UPI'}. Thanks! — and hey from manthan via VOID`
      : `Hi ${contact.name}, a quick update — I owe you ₹${absAmt}. I'll settle it soon via UPI: ${profile?.upiId ?? 'my UPI'}. — and hey from manthan via VOID`;

    window.open(buildWhatsAppUrl(contact.phone, message), '_blank');
  }, [contact, netBalance, profile]);

  const handleSMS = useCallback(() => {
    if (!contact) return;
    if (!contact.phone) { setShowPhonePrompt(true); return; }

    const absAmt  = Math.abs(netBalance).toLocaleString('en-IN');
    const message = netBalance > 0
      ? `Hi ${contact.name}, gentle nudge! Pending: ₹${absAmt}. UPI: ${profile?.upiId ?? 'my UPI'}. — and hey from manthan via VOID`
      : `Hi ${contact.name}, I owe you ₹${absAmt}. Settling soon. — and hey from manthan via VOID`;

    const encoded = encodeURIComponent(message);
    // iOS uses &body= while Android uses ?body=. Target iOS as per requirement.
    window.open(`sms:${contact.phone}&body=${encoded}`, '_self');
  }, [contact, netBalance, profile]);

  // After phone prompt saves, re-trigger WhatsApp
  const handlePhoneSaved = useCallback((phone) => {
    setShowPhonePrompt(false);
    const absAmt  = Math.abs(netBalance).toLocaleString('en-IN');
    const message = `Hi ${contact.name}, just a gentle nudge! Pending balance: ₹${absAmt}. Settle via: ${profile?.upiId ?? 'my UPI'}. — and hey from manthan via VOID`;
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

  // ── Group transactions by date ─────────────────────────────────
  const grouped = transactions.reduce((acc, tx) => {
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
      <div className="px-6 pt-2 pb-6 text-center">
        {/* Avatar */}
        <motion.div
          onClick={() => setShowEditModal(true)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3 cursor-pointer"
          style={{
            background: isPositive ? 'rgba(50,215,75,0.12)'  : isNegative ? 'rgba(255,69,58,0.12)' : 'rgba(255,255,255,0.06)',
            border:     `1px solid ${isPositive ? 'rgba(50,215,75,0.25)' : isNegative ? 'rgba(255,69,58,0.25)' : 'rgba(255,255,255,0.1)'}`,
            color:      isPositive ? '#32D74B' : isNegative ? '#FF453A' : '#8E8E93',
          }}
          aria-label="Edit Profile"
        >
          {contact?.name?.charAt(0)?.toUpperCase() ?? '?'}
        </motion.div>

        {/* Name */}
        <motion.h1
          onClick={() => setShowEditModal(true)}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 28 }}
          className="text-2xl font-bold text-[#F5F5F7] tracking-tight cursor-pointer inline-block"
        >
          {contact?.name}
        </motion.h1>

        {/* Net balance */}
        <AmountDisplay
          amount={netBalance}
          showSign={true}
          colored={true}
          className="text-4xl font-bold tabular-nums tracking-[-0.03em] mt-1"
          style={{
            textShadow: isGhostMode ? 'none'
              : isPositive ? '0 0 40px rgba(50,215,75,0.35)'
              : isNegative ? '0 0 40px rgba(255,69,58,0.35)'
              : 'none',
          }}
        />

        <p className="text-[#3A3A3C] text-xs mt-1">
          {isPositive ? 'owes you' : isNegative ? 'you owe' : 'all settled'}
          {transactions.length > 0 && ` · ${transactions.length} entries`}
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-pill text-xs font-semibold cursor-pointer border select-none"
            style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#25D366' }}
            aria-label="Send WhatsApp nudge"
          >
            <MessageCircle size={13} strokeWidth={2} />
            WhatsApp
          </motion.button>

          {/* Messages */}
          <motion.button
            onClick={handleSMS}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-pill text-xs font-semibold cursor-pointer border select-none"
            style={{ background: 'rgba(10,132,255,0.1)', border: '1px solid rgba(10,132,255,0.2)', color: '#0A84FF' }}
            aria-label="Send SMS nudge"
          >
            <MessageCircle size={13} strokeWidth={2} />
            Messages
          </motion.button>

          {/* PDF */}
          <motion.button
            onClick={handlePDF}
            disabled={pdfLoading}
            whileTap={!pdfLoading ? { scale: 0.96 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-pill text-xs font-semibold cursor-pointer border select-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8E8E93' }}
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-pill text-xs font-semibold cursor-pointer border select-none"
            style={{
              background: isGhostMode ? 'rgba(255,69,58,0.1)' : 'rgba(255,255,255,0.05)',
              border:     `1px solid ${isGhostMode ? 'rgba(255,69,58,0.2)' : 'rgba(255,255,255,0.1)'}`,
              color:      isGhostMode ? '#FF453A' : '#8E8E93',
            }}
            aria-label={isGhostMode ? 'Show amounts' : 'Hide amounts (Ghost Mode)'}
          >
            {isGhostMode ? <EyeOff size={13} strokeWidth={2} /> : <Eye size={13} strokeWidth={1.75} />}
            Ghost Mode
          </motion.button>
        </motion.div>
      </div>

      {/* ── Transaction Timeline ──────────────────────────────── */}
      {transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center"
        >
          <p className="text-[#3A3A3C] text-sm">No transactions yet</p>
          <motion.button
            onClick={() => openModal(null, contact ? { id: contact.id, name: contact.name } : null)}
            whileTap={{ scale: 0.96 }}
            className="text-[#32D74B] text-sm font-medium mt-2 cursor-pointer"
          >
            + Record first transaction
          </motion.button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-1 pb-4">
          {/* Date section divider label at top */}
          <div className="px-6 mb-2">
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#3A3A3C]">
              Timeline · newest first
            </p>
          </div>

          <AnimatePresence>
            {Object.entries(grouped).map(([dateLabel, txs]) => (
              <div key={dateLabel} className="flex flex-col gap-2 mb-3">
                {/* Date divider */}
                <div className="flex flex-col items-center justify-center px-4 mt-2 mb-1">
                  <p className="text-[10px] text-[#3A3A3C] font-semibold tracking-[0.14em] uppercase whitespace-nowrap">{dateLabel}</p>
                </div>

                {/* Entries for this date */}
                <div className="flex flex-col gap-2 group">
                  {txs.map((tx) => (
                    <TimelineEntry
                      key={tx.id}
                      tx={tx}
                      isGhostMode={isGhostMode}
                    />
                  ))}
                </div>
              </div>
            ))}
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

      <EditContactModal
        isOpen={showEditModal}
        contact={contact}
        onClose={() => setShowEditModal(false)}
        onDelete={handleDeleteContact}
      />
    </div>
  );
}
