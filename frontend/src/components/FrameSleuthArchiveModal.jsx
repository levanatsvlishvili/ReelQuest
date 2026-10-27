import React, { useState } from 'react';
import { X, Calendar, Search, CheckCircle2, Play, ChevronRight, History, Sparkles, Camera } from 'lucide-react';
import { FRAME_SLEUTH_MOVIES, getFrameSleuthMovieForDate } from '../data/frameSleuthMovies';

export function FrameSleuthArchiveModal({ isOpen, onClose, currentDate, onSelectDate, isPro, onOpenPro }) {
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
    const mystery = getFrameSleuthMovieForDate(dateStr);

    let sessionStatus = 'UNPLAYED';
    let framesUsed = 0;
    try {
      const raw = localStorage.getItem(`reelquest_framesleuth_${dateStr}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.status === 'WON') sessionStatus = 'WON';
        else if (parsed.status === 'LOST') sessionStatus = 'LOST';
        else if (parsed.guesses?.length > 0) sessionStatus = 'IN_PROGRESS';
        framesUsed = parsed.guesses?.length || 0;
      }
    } catch (e) {}

    pastDays.push({
      dateStr,
      isToday: i === 0,
      daysAgo: i,
      mystery,
      sessionStatus,
      framesUsed,
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
      alert('Cannot travel to future challenges!');
      return;
    }
    onSelectDate(customDateInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl border border-violet-500/40 bg-cinema-card p-6 shadow-2xl space-y-5 text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cinema-border/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-400 border border-violet-500/40">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Frame Sleuth Archive
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-extrabold text-violet-300 border border-violet-500/40">
                  Rewind Vault
                </span>
              </h3>
              <p className="text-xs text-cinema-muted">
                Rewind the reels and solve any past daily frame mystery challenge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-cinema-border/60 bg-cinema-surface/60 text-cinema-muted hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Date Travel Form */}
        <form onSubmit={handleCustomDateSubmit} className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400" />
            <input
              type="date"
              max={todayStr}
              value={customDateInput}
              onChange={(e) => setCustomDateInput(e.target.value)}
              className="w-full rounded-xl border border-cinema-border/80 bg-cinema-surface/90 py-2 pl-9 pr-3 text-xs font-semibold text-white focus:border-violet-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-bold text-white transition active:scale-95 shadow-md shrink-0"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span>Load Date</span>
          </button>
        </form>

        {/* Search Bar */}
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cinema-muted" />
          <input
            type="text"
            placeholder="Search dates (e.g. Oct 24, Sunday, 2026-10-20)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-cinema-border/70 bg-cinema-surface/80 py-2.5 pl-9 pr-3 text-xs font-semibold text-white placeholder-cinema-muted focus:border-violet-500 focus:outline-none"
          />
        </div>

        {/* Days List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {filteredDays.map((day) => {
            const isSelected = day.dateStr === currentDate;

            return (
              <div
                key={day.dateStr}
                onClick={() => {
                  onSelectDate(day.dateStr);
                  onClose();
                }}
                className={`group flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'border-violet-500 bg-violet-500/15 shadow-md'
                    : 'border-cinema-border/70 bg-cinema-surface/50 hover:border-violet-400/60 hover:bg-cinema-surface/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-mono text-xs font-black border ${
                      isSelected
                        ? 'bg-violet-600 border-violet-400 text-white'
                        : 'bg-cinema-card border-cinema-border/80 text-cinema-muted group-hover:text-white'
                    }`}
                  >
                    #{day.daysAgo === 0 ? 'NOW' : `-${day.daysAgo}d`}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white">
                        {day.formattedDate}
                      </span>
                      {day.isToday && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.2 text-[9px] font-black text-emerald-400 border border-emerald-500/30">
                          TODAY
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-cinema-muted block">
                      {day.weekday} • Daily Puzzle #{day.dateStr}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {day.sessionStatus === 'WON' ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-black text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Solved ({day.framesUsed}/6)
                    </span>
                  ) : day.sessionStatus === 'LOST' ? (
                    <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-[11px] font-black text-rose-400 border border-rose-500/30">
                      Unsolved
                    </span>
                  ) : day.sessionStatus === 'IN_PROGRESS' ? (
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-black text-amber-400 border border-amber-500/30">
                      In Progress ({day.framesUsed}/6)
                    </span>
                  ) : (
                    <span className="rounded-full bg-cinema-card px-2.5 py-1 text-[11px] font-bold text-cinema-muted border border-cinema-border/60">
                      Unplayed
                    </span>
                  )}

                  <ChevronRight className="h-4 w-4 text-cinema-muted group-hover:text-violet-400 transition" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-cinema-border/60 flex items-center justify-between text-xs text-cinema-muted shrink-0">
          <span className="flex items-center gap-1.5 font-bold">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            Rewind without limit. Every day has a unique set of 6 frames.
          </span>
          <button
            onClick={onClose}
            className="rounded-xl border border-cinema-border bg-cinema-surface px-4 py-1.5 font-bold text-slate-300 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
