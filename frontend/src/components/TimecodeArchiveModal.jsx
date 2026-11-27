import React, { useState } from 'react';
import { X, Calendar, Search, CheckCircle2, Play, ChevronRight, Sparkles, Clock } from 'lucide-react';
import { getTimecodeMovieForDate } from '../data/timecodeMovies';

export function TimecodeArchiveModal({ isOpen, onClose, currentDate, onSelectDate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customDateInput, setCustomDateInput] = useState('');

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().slice(0, 10);

  const pastDays = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const mystery = getTimecodeMovieForDate(dateStr);

    let sessionStatus = 'UNPLAYED';
    let probesUsed = 0;
    let pureWin = false;
    try {
      const raw = localStorage.getItem(`reelquest_timecode_${dateStr}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.status === 'WON') sessionStatus = 'WON';
        else if (parsed.status === 'LOST') sessionStatus = 'LOST';
        else if ((parsed.probes?.length || 0) > 0 || (parsed.guesses?.length || 0) > 0) {
          sessionStatus = 'IN_PROGRESS';
        }
        probesUsed = Math.max(parsed.guesses?.length || 0, parsed.probes?.length || 0);
        pureWin = parsed.status === 'WON' && !parsed.everRevealedNames;
      }
    } catch {}

    pastDays.push({
      dateStr,
      isToday: i === 0,
      daysAgo: i,
      mystery,
      sessionStatus,
      probesUsed,
      pureWin,
      formattedDate: d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      weekday: d.toLocaleDateString('en-US', { weekday: 'long' })
    });
  }

  const filteredDays = pastDays.filter((day) => {
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
    if (customDateInput > todayStr) return;
    onSelectDate(customDateInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl border border-amber-500/35 bg-cinema-card p-6 shadow-2xl space-y-5 text-white max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-cinema-border/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-gold border border-gold/35">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Timecode Archive
                <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-extrabold text-gold border border-gold/35">
                  Script Vault
                </span>
              </h3>
              <p className="text-xs text-cinema-muted">
                Dial into any past daily screenplay timeline challenge
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

        <form onSubmit={handleCustomDateSubmit} className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
            <input
              type="date"
              max={todayStr}
              value={customDateInput}
              onChange={(e) => setCustomDateInput(e.target.value)}
              className="w-full rounded-xl border border-cinema-border/80 bg-cinema-surface/90 py-2 pl-9 pr-3 text-xs font-semibold text-white focus:border-gold focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-gold hover:bg-amber-300 px-4 py-2 text-xs font-extrabold text-cinema-black transition active:scale-95 shrink-0"
          >
            <Play className="h-3.5 w-3.5 fill-cinema-black" />
            <span>Load Date</span>
          </button>
        </form>

        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cinema-muted" />
          <input
            type="text"
            placeholder="Search dates (e.g. Nov 20, Friday, 2026-11-20)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-cinema-border/70 bg-cinema-surface/80 py-2.5 pl-9 pr-3 text-xs font-semibold text-white placeholder-cinema-muted focus:border-gold focus:outline-none"
          />
        </div>

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
                    ? 'border-gold bg-gold/10 shadow-md'
                    : 'border-cinema-border/70 bg-cinema-surface/50 hover:border-gold/50 hover:bg-cinema-surface/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-mono text-xs font-black border ${
                      isSelected
                        ? 'bg-gold border-amber-300 text-cinema-black'
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
                      {day.weekday} • Daily Timecode #{day.dateStr}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {day.sessionStatus === 'WON' ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-black text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Solved ({day.probesUsed}/6){day.pureWin ? ' • Pure' : ''}
                    </span>
                  ) : day.sessionStatus === 'LOST' ? (
                    <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-[11px] font-black text-rose-400 border border-rose-500/30">
                      Unsolved
                    </span>
                  ) : day.sessionStatus === 'IN_PROGRESS' ? (
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-black text-amber-400 border border-amber-500/30">
                      In Progress ({day.probesUsed}/6)
                    </span>
                  ) : (
                    <span className="rounded-full bg-cinema-card px-2.5 py-1 text-[11px] font-bold text-cinema-muted border border-cinema-border/60">
                      Unplayed
                    </span>
                  )}

                  <ChevronRight className="h-4 w-4 text-cinema-muted group-hover:text-gold transition" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-cinema-border/60 flex items-center justify-between text-xs text-cinema-muted shrink-0">
          <span className="flex items-center gap-1.5 font-bold">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            Scrub to any timestamp across classic cinema scripts.
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
