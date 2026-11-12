import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, RotateCcw, Sparkles, Swords, HelpCircle } from 'lucide-react';

export function DailyDateNavigator({
  currentDate,
  onSelectDate,
  onPrevDay,
  onNextDay,
  onOpenArchive,
  onResetToToday,
  onOpenDuel,
  onOpenHowToPlay,
  compact = false,
  embedded = false
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = !currentDate || currentDate === todayStr;

  function shiftDateStr(dateStr, days) {
    if (!dateStr || dateStr === 'Custom') return todayStr;
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + days));
    return date.toISOString().slice(0, 10);
  }

  function formatDateMeta(dateStr) {
    if (!dateStr || dateStr === 'Custom') {
      return { label: 'Today', formatted: 'Today', isToday: true };
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateUtc = new Date(Date.UTC(y, m - 1, d));
    const [ty, tm, td] = todayStr.split('-').map(Number);
    const todayUtc = new Date(Date.UTC(ty, tm - 1, td));

    const diffDays = Math.round((todayUtc - dateUtc) / (1000 * 60 * 60 * 24));
    let label = '';
    if (diffDays === 0) label = 'Today';
    else if (diffDays === 1) label = 'Yesterday';
    else label = dateUtc.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' });

    const formatted = dateUtc.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric'
    });

    return { label, formatted, isToday: diffDays === 0 };
  }

  const meta = formatDateMeta(currentDate);

  const handlePrev = () => {
    if (onPrevDay) {
      onPrevDay();
    } else if (onSelectDate) {
      onSelectDate(shiftDateStr(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (isToday) return;
    const nextStr = shiftDateStr(currentDate, 1);
    if (nextStr > todayStr) return;
    if (onNextDay) {
      onNextDay();
    } else if (onSelectDate) {
      onSelectDate(nextStr);
    }
  };

  const handleResetToday = () => {
    if (onResetToToday) {
      onResetToToday();
    } else if (onSelectDate) {
      onSelectDate(todayStr);
    }
  };

  const content = (
    <>
      <div className="flex items-center gap-1.5 min-w-0">
        <button
          type="button"
          onClick={handlePrev}
          className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border border-cinema-border bg-cinema-black/60 text-slate-300 transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold active:scale-95"
          title="Previous Day"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onOpenArchive || undefined}
          disabled={!onOpenArchive}
          className={`flex h-8 sm:h-9 shrink-0 items-center gap-2 rounded-xl border px-3 transition select-none ${
            meta.isToday
              ? 'border-gold/60 bg-gold/15 text-white shadow-gold-glow/20'
              : 'border-cinema-border bg-cinema-black/70 text-white'
          } ${onOpenArchive ? 'hover:border-gold cursor-pointer' : 'cursor-default'}`}
          title={onOpenArchive ? 'Open Challenge Archive' : `${meta.label} • ${meta.formatted}`}
        >
          <span className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-gold">
            {meta.isToday && <Sparkles className="h-3 w-3 fill-gold" />}
            <span>{meta.label}</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-xs font-bold text-slate-100 whitespace-nowrap">
            {meta.formatted}
          </span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isToday}
          className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border border-cinema-border bg-cinema-black/60 text-slate-300 transition ${
            isToday
              ? 'opacity-30 cursor-not-allowed text-slate-600 border-cinema-border/40'
              : 'hover:border-gold/50 hover:bg-gold/10 hover:text-gold active:scale-95'
          }`}
          title={isToday ? 'Future challenges are locked' : 'Next Day'}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {!isToday && (onResetToToday || onSelectDate) && (
          <button
            type="button"
            onClick={handleResetToday}
            className="flex h-8 sm:h-9 items-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/10 px-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20 active:scale-95"
            title="Return to today's active challenge"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Today</span>
          </button>
        )}

        {onOpenArchive && (
          <button
            type="button"
            onClick={onOpenArchive}
            className="flex h-8 sm:h-9 items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-2.5 sm:px-3 text-xs font-semibold text-slate-200 transition hover:border-gold/50 hover:text-gold active:scale-95"
            title="Browse Past Challenges Archive"
          >
            <Calendar className="h-3.5 w-3.5 text-gold" />
            <span className="hidden sm:inline">Archive</span>
          </button>
        )}
      </div>

      {(!compact && (onOpenDuel || onOpenHowToPlay)) || (embedded && onOpenHowToPlay) ? (
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!compact && onOpenDuel && (
            <a
              href="/duel"
              onClick={(e) => {
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                onOpenDuel();
              }}
              className="flex h-8 sm:h-9 items-center gap-1.5 rounded-xl border border-gold/50 bg-gold/15 px-3 text-xs font-extrabold text-gold shadow-gold-glow/20 transition hover:bg-gold hover:text-cinema-black active:scale-95"
              title="Play 1v1 Online Duel against a friend"
            >
              <Swords className="h-3.5 w-3.5" />
              <span>1v1 Duel</span>
            </a>
          )}

          {onOpenHowToPlay && (
            <button
              type="button"
              onClick={onOpenHowToPlay}
              className="flex h-8 w-8 sm:h-9 sm:w-auto sm:px-3 items-center justify-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface text-xs font-semibold text-slate-300 transition hover:border-gold/50 hover:text-gold active:scale-95"
              title="How to Play"
            >
              <HelpCircle className="h-4 w-4 text-gold" />
              {!compact && !embedded && <span className="hidden sm:inline">How to Play</span>}
            </button>
          )}
        </div>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {content}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-cinema-border/80 bg-gradient-to-r from-cinema-card via-cinema-surface to-cinema-card px-3 sm:px-4 py-2.5 shadow-lg backdrop-blur-md ${compact ? 'w-full' : ''}`}>
      {content}
    </div>
  );
}
