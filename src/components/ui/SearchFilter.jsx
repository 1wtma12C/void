import { useState } from 'react';
import { Search, Sliders, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SearchFilter
 * ─────────────────────────────────────────────────────────────
 * A premium Search + Filter component with a frosted glass dropdown.
 */
export default function SearchFilter({ 
  placeholder = "Search...", 
  value, 
  onChange, 
  filterOptions = [], 
  activeFilter, 
  onFilterChange,
  sortOptions = [],
  activeSort,
  onSortChange
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterClick = (id) => {
    onFilterChange(id);
    // Keep open for better UX when toggling multiple things? 
    // Actually, usually users want it to close after one selection in these menus.
    // But let's keep it open so they can see the checkmark change.
  };

  const handleSortClick = (id) => {
    onSortChange(id);
  };

  return (
    <div className="w-full px-6 mb-6 relative">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-[#3A3A3C]">
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/10 rounded-full py-3.5 pl-11 pr-12 text-sm text-[#F5F5F7] placeholder:text-[#3A3A3C] outline-none focus:border-white/20 transition-all"
        />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute right-3 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isOpen ? 'bg-white/10 text-white' : 'text-[#8E8E93] hover:bg-white/5'}`}
        >
          <Sliders size={16} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-6 top-full mt-2 w-56 p-2 rounded-2xl backdrop-blur-xl bg-[#1C1C1E]/80 border border-white/10 shadow-2xl z-50 overflow-hidden"
              style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
            >
              {filterOptions.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#3A3A3C]">Filter By</p>
                  <div className="flex flex-col gap-0.5">
                    {filterOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => handleFilterClick(opt.id)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeFilter === opt.id ? 'bg-white/10 text-white' : 'text-[#8E8E93] hover:bg-white/5'}`}
                      >
                        {opt.label}
                        {activeFilter === opt.id && <Check size={14} className="text-[#32D74B]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sortOptions.length > 0 && (
                <div className="mt-1 pt-1 border-t border-white/5">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#3A3A3C]">Sort By</p>
                  <div className="flex flex-col gap-0.5">
                    {sortOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => handleSortClick(opt.id)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeSort === opt.id ? 'bg-white/10 text-white' : 'text-[#8E8E93] hover:bg-white/5'}`}
                      >
                        {opt.label}
                        {activeSort === opt.id && <Check size={14} className="text-[#32D74B]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
