import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Trash2, RefreshCw, User } from 'lucide-react';

import { useUserProfile } from '../hooks/useUserProfile';
import { useContacts } from '../hooks/useContacts';
import { useTransactions, TX_TYPE } from '../hooks/useTransactions';
import MagnifiedInput from '../components/ui/MagnifiedInput';

// ── Vault Dashboard ───────────────────────────────────────────────
function VaultDashboard() {
  const [activeTab, setActiveTab] = useState('recycle'); // 'profile' | 'recycle'
  const { profile, saveProfile }  = useUserProfile();
  const { allContacts, restoreContact, hardDeleteContact } = useContacts();
  const { allTransactions, restoreTransaction, hardDeleteTransaction } = useTransactions();

  // Filter only deleted items
  const deletedContacts = allContacts.filter(c => c.deletedAt);
  const deletedTxs      = allTransactions.filter(t => t.deletedAt);

  // Profile Form State
  const [name, setName]   = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [upi, setUpi]     = useState(profile?.upiId ?? '');

  const handleSaveProfile = async () => {
    await saveProfile({ name, phone, upiId: upi });
    alert('Profile updated successfully.');
  };

  return (
    <div className="w-full flex flex-col gap-6 px-6">
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
          <button
            onClick={handleSaveProfile}
            className="mt-4 bg-[#F5F5F7] text-black font-semibold py-3 rounded-glass-sm w-full"
          >
            Update Profile
          </button>
        </motion.div>
      )}

      {activeTab === 'recycle' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8 w-full text-left">
          
          <section>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[#8E8E93] mb-3 text-center">
              Deleted Contacts
            </p>
            {deletedContacts.length === 0 ? (
              <p className="text-center text-[#3A3A3C] text-sm">No deleted contacts.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {deletedContacts.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <div>
                      <p className="text-[#F5F5F7] font-medium text-sm">{c.name}</p>
                      <p className="text-[#8E8E93] text-[10px]">Deleted: {c.deletedAt?.toDate().toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => restoreContact(c.id)} className="text-[#32D74B] p-2 bg-[#32D74B]/10 rounded-full" aria-label="Restore">
                        <RefreshCw size={14} />
                      </button>
                      <button onClick={() => { if(confirm('Permanently delete?')) hardDeleteContact(c.id) }} className="text-[#FF453A] p-2 bg-[#FF453A]/10 rounded-full" aria-label="Permanent Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[#8E8E93] mb-3 text-center">
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
                        <button onClick={() => { if(confirm('Permanently delete?')) hardDeleteTransaction(t.id) }} className="text-[#FF453A] p-2 bg-[#FF453A]/10 rounded-full">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </motion.div>
      )}
    </div>
  );
}

// ── Admin Vault Page ──────────────────────────────────────────────
export default function AdminVault() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);

  // Hidden feature: hardcoded PIN for now.
  const CORRECT_PIN = '0000';

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
  }, [pin]);

  const handleKeyPress = (num) => {
    if (pin.length < 4) setPin(p => p + num);
  };

  const handleBackspace = () => {
    setPin(p => p.slice(0, -1));
  };

  return (
    <div className="flex flex-col min-h-dvh w-full max-w-md mx-auto pt-8">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 mb-8 relative">
        <button onClick={() => navigate('/')} className="text-[#8E8E93] p-2 -ml-2" aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-semibold tracking-widest uppercase text-[#F5F5F7]">Vault</span>
        <div className="w-8" /> {/* Spacer */}
      </div>

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="pin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col items-center justify-center px-6"
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
              <div />
              <button
                onClick={() => handleKeyPress('0')}
                className="w-16 h-16 rounded-full text-2xl font-medium text-[#F5F5F7] bg-transparent hover:bg-white/[0.05] active:bg-white/10 transition-colors mx-auto flex items-center justify-center"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="w-16 h-16 rounded-full flex items-center justify-center text-[#8E8E93] bg-transparent hover:bg-white/[0.05] active:bg-white/10 transition-colors mx-auto"
              >
                <ArrowLeft size={24} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col w-full"
          >
            <VaultDashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
