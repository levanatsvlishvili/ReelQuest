import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, Globe } from 'lucide-react';
import { SOVEREIGN_COUNTRIES, getCountryByCode } from '../utils/countries';

export function CountrySelect({ value, onChange, label = 'Nationality', required = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedCountry = useMemo(() => getCountryByCode(value), [value]);

  // Filter countries strictly alphabetically matching the query
  const filteredCountries = useMemo(() => {
    if (!search.trim()) return SOVEREIGN_COUNTRIES;
    const q = search.toLowerCase().trim();
    return SOVEREIGN_COUNTRIES.filter(
      c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [search]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const handleSelect = (code) => {
    onChange?.(code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-300 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl border border-cinema-border bg-cinema-surface py-2.5 px-3 text-xs text-white outline-none hover:border-gold/50 focus:border-gold transition text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none shrink-0">{selectedCountry.flag}</span>
          <span className="font-semibold truncate">{selectedCountry.name}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-cinema-muted transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180 text-gold' : ''}`} />
      </button>

      {/* Floating Searchable Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-cinema-border/90 bg-cinema-card/95 p-2 shadow-2xl backdrop-blur-xl animate-fade-in max-h-72 flex flex-col">
          {/* Search Input Box */}
          <div className="relative mb-2 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cinema-muted" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sovereign country (e.g. Georgia, France, Japan)..."
              className="w-full rounded-xl border border-cinema-border/80 bg-cinema-surface py-1.5 pl-8 pr-3 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold transition"
            />
          </div>

          {/* Country List (Alphabetical, 195 sovereign states) */}
          <div className="overflow-y-auto space-y-0.5 flex-1 scrollbar-thin pr-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    type="button"
                    key={c.code}
                    onClick={() => handleSelect(c.code)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition ${
                      isSelected
                        ? 'bg-gold/20 text-gold font-bold border border-gold/30'
                        : 'hover:bg-cinema-surface text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base leading-none shrink-0">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-gold shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-cinema-muted">
                No matching sovereign country found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
