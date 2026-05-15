import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Mail, AtSign, Loader2, Trash2 } from 'lucide-react';

import { useContacts } from '../../hooks/useContacts';
import MagnifiedInput from '../ui/MagnifiedInput';
import ConfirmModal from './ConfirmModal';

const overlayV = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.22 } },
};

const sheetV = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 320, damping: 34 } },
  exit:    { y: '100%', opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
};

export default function EditContactModal({ isOpen, contact, onClose, onDelete }) {
  const { updateContact } = useContacts();

  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [upi,   setUpi]   = useState('');
  const [loading,       setLoading]       = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading,     setDeleteLoading]     = useState(false);

  useEffect(() => {
    if (isOpen && contact) {
      setName(contact.name   || '');
      setPhone(contact.phone  || '');
      setEmail(contact.email  || '');
      setUpi(contact.upiId   || '');
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeleteLoading(false);
    }
  }, [isOpen, contact]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await updateContact(contact.id, {
      name:  name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      upiId: upi.trim(),
    });
    setLoading(false);
    onClose();
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    await onDelete();          // parent handles softDelete + navigate
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              variants={overlayV}
              initial="initial" animate="animate" exit="exit"
              onClick={onClose}
              className="fixed inset-0 z-[90]"
              style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            />

            <motion.div
              key="sheet"
              variants={sheetV}
              initial="initial" animate="animate" exit="exit"
              className="fixed bottom-0 left-0 right-0 z-[95] flex flex-col items-center mx-auto max-w-md w-full"
              style={{
                background:    'rgba(14,14,14,0.97)',
                backdropFilter: 'blur(40px)',
                border:        '1px solid rgba(255,255,255,0.08)',
                borderBottom:  'none',
                borderRadius:  '28px 28px 0 0',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
              }}
            >
              {/* Handle + header */}
              <div className="flex flex-col items-center justify-center pt-4 pb-2 w-full flex-shrink-0 relative">
                <div className="w-8 h-0.5 rounded-full bg-white/20 mb-3" />
                <p className="text-[#F5F5F7] text-base font-semibold tracking-tight">Edit Contact</p>
                <motion.button
                  onClick={onClose}
                  whileTap={{ scale: 0.88 }}
                  className="absolute right-5 top-4 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                >
                  <X size={14} strokeWidth={2} className="text-[#8E8E93]" />
                </motion.button>
              </div>

              {/* Fields */}
              <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 w-full flex flex-col items-center gap-6">
                <MagnifiedInput id="e-name"  icon={User}   label="Name"    value={name}  onChange={setName}  required autoFocus />
                <MagnifiedInput id="e-phone" icon={Phone}  label="Mobile"  value={phone} onChange={setPhone} />
                <MagnifiedInput id="e-email" icon={Mail}   label="Email"   value={email} onChange={setEmail} />
                <MagnifiedInput id="e-upi"   icon={AtSign} label="UPI ID"  value={upi}   onChange={setUpi}   onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
              </div>

              {/* Save button */}
              <div className="flex-shrink-0 px-6 pt-4 w-full border-t border-white/[0.04] flex flex-col gap-3">
                <motion.button
                  onClick={handleSave}
                  disabled={!name.trim() || loading}
                  whileTap={name.trim() && !loading ? { scale: 0.97 } : undefined}
                  className="w-full py-4 rounded-glass-sm font-semibold text-[15px] flex items-center justify-center gap-2 cursor-pointer transition-all"
                  style={{
                    background: name.trim() && !loading ? '#F5F5F7' : 'rgba(255,255,255,0.1)',
                    color:      name.trim() && !loading ? '#000'     : '#8E8E93',
                  }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                </motion.button>

                {/* Delete contact */}
                <motion.button
                  onClick={() => setShowDeleteConfirm(true)}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-glass-sm text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  style={{
                    background: 'rgba(255,69,58,0.07)',
                    border:     '1px solid rgba(255,69,58,0.18)',
                    color:      '#FF453A',
                  }}
                >
                  <Trash2 size={14} strokeWidth={2} />
                  Delete Contact
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Contact?"
        message={`This will move ${contact?.name} and all their transactions to the recycle bin.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        loading={deleteLoading}
      />
    </>
  );
}
