import { useState } from 'react';
import { Bell, X, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ReminderModal
 * ─────────────────────────────────────────────────────────────
 * A premium frosted glass modal for scheduling follow-ups.
 * Styled with semantic Aurora Green and Crimson Nebula.
 */
export default function ReminderModal({ isOpen, onClose, onSave, contactName }) {
  const [datePart, setDatePart] = useState('');
  const [timePart, setTimePart] = useState('');

  const handleSave = () => {
    if (!datePart || !timePart) return;
    const dt = new Date(`${datePart}T${timePart}`);
    onSave(dt.getTime());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm p-6 rounded-3xl backdrop-blur-2xl bg-[#1C1C1E]/90 border border-white/10 shadow-2xl flex flex-col items-center gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-1">
                <Bell size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Set Reminder</h2>
              <p className="text-[#8E8E93] text-sm text-center">
                Schedule a follow-up for <span className="text-white font-medium">{contactName}</span>
              </p>
            </div>

            <div className="w-full flex flex-col gap-4">
              {/* Date Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-[#3A3A3C] uppercase font-bold px-1 tracking-widest">Follow-up Date</label>
                <div className="relative group bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 color-scheme-dark">
                  <Calendar size={18} className="text-[#32D74B]" />
                  <input
                    type="date"
                    value={datePart}
                    onChange={(e) => setDatePart(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-[#32D74B] font-semibold outline-none transition-all"
                  />
                </div>
              </div>

              {/* Time Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-[#3A3A3C] uppercase font-bold px-1 tracking-widest">Follow-up Time</label>
                <div className="relative group bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 color-scheme-dark">
                  <Clock size={18} className="text-[#FF453A]" />
                  <input
                    type="time"
                    value={timePart}
                    onChange={(e) => setTimePart(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-[#FF453A] font-semibold outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex w-full gap-3 mt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-[#8E8E93] bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!datePart || !timePart}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-black bg-white hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Set Reminder
              </button>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[#3A3A3C] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
