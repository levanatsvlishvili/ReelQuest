import React, { useState } from 'react';
import { X, Calendar, Search, CheckCircle2, Play, ChevronRight, History, Sparkles } from 'lucide-react';
import { getSpotleMovieForDate } from '../data/spotleMovies';

export function SpotleArchiveModal({ isOpen, onClose, currentDate, onSelectDate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customDateInput, setCustomDateInput] = useState('');

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().slice(0, 10);

  // Generate last 30 days archive
  const pastDays = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const mystery = getSpotleMovieForDate(dateStr);

    let sessionStatus = 'UNPLAYED';
    let guessesCount = 0;
    try {
      const raw = localStorage.getItem(`reelquest_spotle_${dateStr}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.status === 'WON') sessionStatus = 'WON';
        else if (parsed.status === 'LOST') sessionStatus = 'LOST';
        else if (parsed.guesses?.length > 0) sessionStatus = 'IN_PROGRESS';
        guessesCount = parsed.guesses?.length || 0;
      }
    } catch (e) {}

    pastDays.push({
      dateStr,
      isToday: i === 0,
      daysAgo: i,
      mystery,
      sessionStatus,
      guessesCount,
      formattedDate: d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      weekday: d.toLocaleDateString('en-US', { weekday: 'long' })
    });
  }

  const filteredDays = pastDays.filter(day => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      day.dateStr.includes(q) ||
      day.formattedDate.toLowerCase().includes(q) ||
      day.weekday.toLowerCase().includes(q)
    );
  });

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (!customDateInput) return;
    if (customDateInput > todayStr) {
      alert("You cannot time-travel into future movie challenges!");
      return;
    }
    onSelectDate(customDateInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-b from-cinema-card via-cinema-surface to-cinema-black shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cinema-border/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30 shadow-gold-glow">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Spotle Mystery Archive</h3>
              <p className="text-xs text-cinema-muted">Rewind days and guess previous daily mystery films</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-cinema-muted hover:bg-cinema-border hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Custom Date Picker */}
        <div className="border-b border-cinema-border/60 bg-cinema-black/40 p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cinema-muted" />
            <input
              type="text"
              placeholder="Search by date (e.g. Oct 24, 2026)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-2 pl-9 pr-4 text-xs text-white placeholder-cinema-muted focus:border-gold focus:outline-none"
            />
          </div>

          <form onSubmit={handleCustomDateSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
              <input
                type="date"
                max={todayStr}
                value={customDateInput}
                onChange={(e) => setCustomDateInput(e.target.value)}
                className="w-full rounded-xl border border-cinema-border bg-cinema-surface py-1.5 pl-9 pr-3 text-xs text-white focus:border-gold focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!customDateInput}
              className="rounded-xl bg-gold px-4 py-1.5 text-xs font-extrabold text-cinema-black hover:bg-gold-light disabled:opacity-40 transition shadow-sm"
            >
              Jump to Date
            </button>
          </form>
        </div>

        {/* Archive List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredDays.map((day) => {
            const isSelected = day.dateStr === currentDate;
            const isWon = day.sessionStatus === 'WON';
            const isLost = day.sessionStatus === 'LOST';
            const isInProgress = day.sessionStatus === 'IN_PROGRESS';

            return (
              <div
                key={day.dateStr}
                onClick={() => {
                  onSelectDate(day.dateStr);
                  onClose();
                }}
                className={`group flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'border-gold bg-gold/15 shadow-gold-glow/20'
                    : 'border-cinema-border/70 bg-cinema-card/70 hover:border-gold/50 hover:bg-cinema-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-black ${
                    isWon
                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
                      : isLost
                        ? 'border-rose-500/50 bg-rose-500/20 text-rose-400'
                        : isInProgress
                          ? 'border-amber-500/50 bg-amber-500/20 text-amber-300'
                          : 'border-cinema-border bg-cinema-surface text-cinema-muted'
                  }`}>
                    {isWon ? '✓' : isLost ? '✗' : isInProgress ? `${day.guessesCount}/10` : '—'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-gold transition">
                        {day.formattedDate}
                      </span>
                      {day.isToday && (
                        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[9px] font-extrabold text-gold border border-gold/30">
                          TODAY
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-cinema-muted block">
                      {day.weekday} • {isWon ? `Solved in ${day.guessesCount} guesses!` : isLost ? 'Unsolved (10/10)' : isInProgress ? `In Progress (${day.guessesCount}/10)` : 'Not played yet'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-3 py-1.5 text-xs font-bold text-slate-200 group-hover:border-gold/60 group-hover:bg-gold group-hover:text-cinema-black transition">
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>{isSelected ? 'Playing' : 'Play'}</span>
                  </button>
                  <ChevronRight className="h-4 w-4 text-cinema-muted group-hover:text-gold transition" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
