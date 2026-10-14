import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Archive, RotateCcw } from 'lucide-react';

export function DailyDateNavigator({
  currentDate,
  isToday,
  onPrevDay,
  onNextDay,
  onOpenArchive,
  onResetToToday
}) {
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return 'Today';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateUtc = Date.UTC(y, m - 1, d);
    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    const diffDays = Math.round((todayUtc - dateUtc) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    return new Date(dateUtc).toLocaleDateString('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-cinema-border/80 bg-cinema-surface/60 px-3.5 py-2 backdrop-blur-sm sm:gap-4">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onPrevDay}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-cinema-border bg-cinema-black/40 text-slate-300 transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
          title="Previous Day's Challenge"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={onOpenArchive}
          className="flex items-center gap-2 rounded-lg border border-cinema-border/70 bg-cinema-black/50 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-gold/50 hover:text-gold"
          title="Browse All Past Challenges"
        >
          <Calendar className="h-3.5 w-3.5 text-gold" />
          <span>{formatDateLabel(currentDate)}</span>
          <span className="text-[10px] text-cinema-muted">({currentDate})</span>
        </button>

        <button
          onClick={onNextDay}
          disabled={isToday}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-cinema-border bg-cinema-black/40 text-slate-300 transition ${
            isToday
              ? 'opacity-40 cursor-not-allowed text-slate-600 border-cinema-border/40'
              : 'hover:border-gold/50 hover:bg-gold/10 hover:text-gold'
          }`}
          title={isToday ? "You are on today's challenge" : "Next Day's Challenge"}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {!isToday && (
          <button
            onClick={onResetToToday}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 transition hover:bg-amber-500/20"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Back to Today</span>
          </button>
        )}

        <button
          onClick={onOpenArchive}
          className="flex items-center gap-1.5 rounded-lg border border-cinema-border bg-cinema-black/40 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-gold/50 hover:text-gold"
        >
          <Archive className="h-3.5 w-3.5 text-gold" />
          <span className="hidden sm:inline">Challenge</span>
          <span>Archive</span>
        </button>
      </div>
    </div>
  );
}
