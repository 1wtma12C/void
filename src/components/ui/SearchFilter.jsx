import { useState } from 'react';
import { Search, Sliders, Check, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SearchFilter
 * ─────────────────────────────────────────────────────────────
 * A premium Search + Filter component with a frosted glass dropdown.
 * Supports Search, Type filters, Sorting, and Timeframe filters.
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
  onSortChange,
  timeframeOptions = [],
  activeTimeframe,
  onTimeframeChange,
  customRange = { start: '', end: '' },
  onCustomRangeChange
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterClick = (id) => {
    onFilterChange?.(id);
  };

  const handleSortClick = (id) => {
    onSortChange?.(id);
  };

  const handleTimeframeClick = (id) => {
    onTimeframeChange?.(id);
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
          onFocus={(e) => {
            const target = e.target;
            if (window.visualViewport) {
              const handleResize = () => {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                window.visualViewport.removeEventListener('resize', handleResize);
              };
              window.visualViewport.addEventListener('resize', handleResize);
            } else {
              setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
            }
          }}
          className="w-full bg-white/[0.03] border border-white/10 rounded-full py-3.5 pl-11 pr-12 text-sm text-[#F5F5F7] placeholder:text-[#3A3A3C] outline-none focus:border-white/20 transition-all"
        />
        {/* Filter Trigger Button */}
        <div className="absolute right-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isOpen ? 'bg-white/10 text-white' : 'text-[#8E8E93] hover:bg-white/5'}`}
            aria-label="Filter options"
          >
            <Sliders size={16} />
          </button>

          <AnimatePresence>
            {isOpen && (
              <>
                {/* Full-Screen Blur Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                  onClick={() => setIsOpen(false)}
                >
                {/* The Modal Box */}
                <motion.div
                  initial={{ scale: 0.95, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 10 }}
                  className="w-full max-w-[360px] md:max-w-[420px] max-h-[85vh] overflow-y-auto overscroll-contain bg-[#1C1C1E] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col p-5 text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header with Close Button */}
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5 flex-shrink-0">
                    <h3 className="text-white font-semibold text-lg tracking-wide">Filters</h3>
                    <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 rounded-full text-[#8E8E93] hover:text-white transition-colors cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Filter Controls */}
                  <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
                    {/* Type Filter */}
                    {filterOptions.length > 0 && (
                      <div>
                        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#3A3A3C] mb-1">Filter By</p>
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

                    {/* Timeframe Filter */}
                    {timeframeOptions.length > 0 && (
                      <div className="pt-2 border-t border-white/5">
                        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#3A3A3C] mb-1">Timeframe</p>
                        <div className="flex flex-col gap-0.5">
                          {timeframeOptions.map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => handleTimeframeClick(opt.id)}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTimeframe === opt.id ? 'bg-white/10 text-white' : 'text-[#8E8E93] hover:bg-white/5'}`}
                            >
                              {opt.label}
                              {activeTimeframe === opt.id && <Check size={14} className="text-[#32D74B]" />}
                            </button>
                          ))}
                        </div>

                        {/* Custom Range Inputs */}
                        {activeTimeframe === 'custom' && (
                          <div className="flex flex-col w-full gap-3 mt-3 px-3 py-2 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex flex-col gap-1 w-full">
                              <label className="text-[10px] text-[#8E8E93] uppercase font-bold px-1 tracking-wider">Start Date</label>
                              <input 
                                type="date"
                                value={customRange.start}
                                onChange={(e) => onCustomRangeChange?.({ ...customRange, start: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white color-scheme-dark outline-none focus:border-white/20 transition-all text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-1 w-full">
                              <label className="text-[10px] text-[#8E8E93] uppercase font-bold px-1 tracking-wider">End Date</label>
                              <input 
                                type="date"
                                value={customRange.end}
                                onChange={(e) => onCustomRangeChange?.({ ...customRange, end: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white color-scheme-dark outline-none focus:border-white/20 transition-all text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sort By */}
                    {sortOptions.length > 0 && (
                      <div className="pt-2 border-t border-white/5">
                        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#3A3A3C] mb-1">Sort By</p>
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
                  </div>
                </motion.div>
              </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
