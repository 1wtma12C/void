import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';

const overlayV = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.22 } },
};

const modalV = {
  initial: { scale: 0.92, opacity: 0, y: 10 },
  animate: { scale: 1, opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } },
  exit:    { scale: 0.96, opacity: 0, y: 10, transition: { duration: 0.2 } },
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        variants={overlayV}
        initial="initial" animate="animate" exit="exit"
        className="fixed inset-0 z-[100] flex items-center justify-center px-6"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
        onClick={onCancel}
      >
        <motion.div
          key="modal"
          variants={modalV}
          initial="initial" animate="animate" exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm p-6 rounded-glass flex flex-col items-center justify-center text-center gap-4 mx-auto"
          style={{ background: 'rgba(20,20,20,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FF453A]/10 border border-[#FF453A]/20">
              <AlertTriangle size={22} strokeWidth={2} className="text-[#FF453A]" />
            </div>
            <p className="text-[#F5F5F7] font-semibold text-lg tracking-tight">{title}</p>
          </div>
          
          <p className="text-[#8E8E93] text-sm leading-relaxed mb-2 px-2">
            {message}
          </p>
          
          <div className="flex w-full gap-3 mt-1">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 rounded-pill text-sm font-semibold text-[#8E8E93] cursor-pointer hover:bg-white/[0.05] transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {cancelText}
            </button>
            <motion.button
              onClick={onConfirm}
              disabled={loading}
              whileTap={!loading ? { scale: 0.97 } : {}}
              className="flex-1 py-3 rounded-pill text-sm font-semibold cursor-pointer flex items-center justify-center gap-2"
              style={{
                background: isDestructive ? 'rgba(255,69,58,0.15)' : 'rgba(50,215,75,0.15)',
                border: `1px solid ${isDestructive ? 'rgba(255,69,58,0.3)' : 'rgba(50,215,75,0.3)'}`,
                color: isDestructive ? '#FF453A' : '#32D74B'
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : confirmText}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
