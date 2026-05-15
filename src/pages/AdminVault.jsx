import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Trash2, RefreshCw, User, Delete } from 'lucide-react';

import { useUserProfile } from '../hooks/useUserProfile';
import { useContacts } from '../hooks/useContacts';
import { useTransactions, TX_TYPE } from '../hooks/useTransactions';
import MagnifiedInput from '../components/ui/MagnifiedInput';
import ConfirmModal from '../components/modals/ConfirmModal';

// ── Vault Dashboard ───────────────────────────────────────────────
function VaultDashboard() {
  const [activeTab, setActiveTab] = useState('recycle'); // 'profile' | 'recycle'
  const { profile, saveProfile }  = useUserProfile();
  const { allContacts, restoreContact, hardDeleteContact } = useContacts();
  const { allTransactions, restoreTransaction, hardDeleteTransaction } = useTransactions();

  const deletedTxs = useMemo(() => 
    allTransactions.filter(tx => !!tx.deletedAt), 
    [allTransactions]
  );

  // Profile Form State
  const [name, setName]   = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [upi, setUpi]     = useState(profile?.upiId ?? '');

  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinStep, setPinStep] = useState(1); // 1: Current, 2: New
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Confirm Modal state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmType, setConfirmType] = useState(null); // 'contact' | 'tx'

  const handleSaveProfile = async () => {
    await saveProfile({ name, phone, upiId: upi });
    alert('Profile updated successfully.');
  };

  const handlePinChange = async () => {
    if (pinStep === 1) {
      if (currentPinInput === (profile?.vaultPin || '0000')) {
        setPinStep(2);
        setPinError('');
      } else {
        setPinError('Incorrect current password.');
      }
    } else {
      if (newPinInput.length === 4) {
        await saveProfile({ ...profile, vaultPin: newPinInput });
        alert('Password changed successfully.');
        setIsChangingPin(false);
        setPinStep(1);
        setCurrentPinInput('');
        setNewPinInput('');
      } else {
        setPinError('New password must be 4 digits.');
      }
    }
  };

  const closeConfirm = () => {
    setConfirmDeleteId(null);
    setConfirmType(null);
  };

  const handleHardDelete = async () => {
    if (!confirmDeleteId) return;
    if (confirmType === 'contact') {
      await hardDeleteContact(confirmDeleteId);
    } else {
      await hardDeleteTransaction(confirmDeleteId);
    }
    closeConfirm();
  };

  return (
    <div className="w-full flex flex-col gap-6 px-6 pt-20">
      <div className="flex gap-2 p-1 rounded-full bg-white/[0.04] border border-white/10 w-full max-w-[240px] mx-auto">
        <button
          onClick={() => setActiveTab('recycle')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${activeTab === 'recycle' ? 'bg-white/10 text-white shadow-sm' : 'text-[#8E8E93]'}`}
        >
          Recycle Bin
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${activeTab === 'profile' ? 'bg-white/10 text-white shadow-sm' : 'text-[#8E8E93]'}`}
        >
          Profile
        </button>
      </div>

      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 max-w-sm mx-auto w-full">
          <MagnifiedInput id="v-name" icon={User} label="Your Name" value={name} onChange={setName} />
          <MagnifiedInput id="v-phone" label="Phone" value={phone} onChange={setPhone} />
          <MagnifiedInput id="v-upi" label="UPI ID" value={upi} onChange={setUpi} />
          
          <div className="mt-4 flex flex-col gap-3">
            <button
              onClick={handleSaveProfile}
              className="bg-[#F5F5F7] text-black font-semibold py-3 rounded-glass-sm w-full"
            >
              Update Profile
            </button>

            {!isChangingPin ? (
              <button
                onClick={() => setIsChangingPin(true)}
                className="bg-white/[0.05] border border-white/10 text-[#8E8E93] font-semibold py-3 rounded-glass-sm w-full"
              >
                [ Change Password ]
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]"
              >
                <p className="text-[11px] font-semibold tracking-widest uppercase text-[#8E8E93] text-center">
                  {pinStep === 1 ? 'Enter Current Password' : 'Enter New Password'}
                </p>
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  value={pinStep === 1 ? currentPinInput : newPinInput}
                  onChange={(e) => pinStep === 1 ? setCurrentPinInput(e.target.value) : setNewPinInput(e.target.value)}
                  className="bg-transparent border-b border-white/20 text-center text-2xl font-bold tracking-widest py-2 outline-none"
                  autoFocus
                />
                {pinError && <p className="text-[#FF453A] text-[10px] text-center">{pinError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsChangingPin(false); setPinStep(1); }}
                    className="flex-1 py-2 text-xs font-semibold text-[#8E8E93]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePinChange}
                    className="flex-1 py-2 text-xs font-semibold text-[#32D74B]"
                  >
                    {pinStep === 1 ? 'Next' : 'Save'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'recycle' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8 pb-12">
          {/* Contacts Section */}
          <section>
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#3A3A3C] mb-4 text-center">
              Deleted Contacts
            </p>
            {allContacts.filter(c => c.isDeleted).length === 0 ? (
              <p className="text-center text-[#3A3A3C] text-sm">No deleted contacts.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {allContacts.filter(c => c.isDeleted).map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <div>
                      <p className="text-[#F5F5F7] font-semibold text-sm">{c.name}</p>
                      <p className="text-[#8E8E93] text-[10px]">{c.phone || 'No phone'}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => restoreContact(c.id)} className="text-[#32D74B] p-2 bg-[#32D74B]/10 rounded-full">
                        <RefreshCw size={14} />
                      </button>
                      <button 
                        onClick={() => { setConfirmDeleteId(c.id); setConfirmType('contact'); }} 
                        className="text-[#FF453A] p-2 bg-[#FF453A]/10 rounded-full"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Transactions Section */}
          <section>
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#3A3A3C] mb-4 text-center">
              Deleted Transactions
            </p>
            {deletedTxs.length === 0 ? (
              <p className="text-center text-[#3A3A3C] text-sm">No deleted transactions.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {deletedTxs.map(t => {
                  const contact = allContacts.find(c => c.id === t.contactId);
                  const isLent = t.type === TX_TYPE.LENT;
                  return (
                    <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      <div>
                        <p className={`font-semibold text-sm ${isLent ? 'text-[#FF453A]' : 'text-[#32D74B]'}`}>
                          {isLent ? 'Lent' : 'Received'} ₹{t.amount}
                        </p>
                        <p className="text-[#8E8E93] text-[10px]">with {contact?.name || 'Unknown'}</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => restoreTransaction(t.id)} className="text-[#32D74B] p-2 bg-[#32D74B]/10 rounded-full">
                          <RefreshCw size={14} />
                        </button>
                        <button 
                          onClick={() => { setConfirmDeleteId(t.id); setConfirmType('tx'); }} 
                          className="text-[#FF453A] p-2 bg-[#FF453A]/10 rounded-full"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <ConfirmModal 
            isOpen={!!confirmDeleteId}
            title={confirmType === 'contact' ? "Delete Contact?" : "Wipe Entry?"}
            message={confirmType === 'contact' 
              ? "This will permanently delete the contact and all their transaction history. This cannot be undone."
              : "This will permanently delete this transaction record. This action cannot be undone."
            }
            onConfirm={handleHardDelete}
            onCancel={closeConfirm}
          />

        </motion.div>
      )}
    </div>
  );
}

// ── Admin Vault Page ──────────────────────────────────────────────
export default function AdminVault() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);

  const CORRECT_PIN = profile?.vaultPin || '0000';

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === CORRECT_PIN) {
        setIsAuthenticated(true);
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 500);
      }
    }
  }, [pin, CORRECT_PIN]);

  const handleKeyPress = (num) => {
    if (pin.length < 4) setPin(p => p + num);
  };

  const handleBackspace = () => {
    setPin(p => p.slice(0, -1));
  };

  return (
    <div className="flex flex-col min-h-dvh w-full max-w-md mx-auto relative">
      
      {/* Header */}

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="pin-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center min-h-[100dvh] overflow-hidden px-6"
          >
            <div className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-6">
              <Lock size={20} className="text-[#8E8E93]" />
            </div>
            
            <p className="text-[#F5F5F7] text-lg font-semibold mb-8">Enter Vault PIN</p>
            
            <motion.div 
              animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.3 }}
              className="flex gap-4 mb-12"
            >
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full border ${pin.length > i ? 'bg-white border-white' : 'border-[#3A3A3C]'}`} />
              ))}
            </motion.div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-y-6 gap-x-12 w-full max-w-[280px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num.toString())}
                  className="w-16 h-16 rounded-full text-2xl font-medium text-[#F5F5F7] bg-transparent hover:bg-white/[0.05] active:bg-white/10 transition-colors mx-auto flex items-center justify-center"
                >
                  {num}
                </button>
              ))}
              
              {/* Cancel Button (Left of zero) */}
              <button
                onClick={() => navigate('/')}
                className="w-16 h-16 rounded-full text-[13px] font-semibold text-[#8E8E93] bg-transparent hover:bg-white/[0.05] active:bg-white/10 transition-colors mx-auto flex items-center justify-center"
              >
                Cancel
              </button>

              <button
                onClick={() => handleKeyPress('0')}
                className="w-16 h-16 rounded-full text-2xl font-medium text-[#F5F5F7] bg-transparent hover:bg-white/[0.05] active:bg-white/10 transition-colors mx-auto flex items-center justify-center"
              >
                0
              </button>

              {/* Back button (Right of zero) */}
              <button
                onClick={handleBackspace}
                className="w-16 h-16 rounded-full flex items-center justify-center text-[#8E8E93] bg-transparent hover:bg-white/[0.05] active:bg-white/10 transition-colors mx-auto"
              >
                <Delete size={22} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col w-full"
          >
            <VaultDashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
