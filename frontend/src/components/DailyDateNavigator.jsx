import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, RotateCcw, Swords, HelpCircle, Sparkles } from 'lucide-react';

function isModifiedClick(e) {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

export function DailyDateNavigator({
  currentDate,
  onSelectDate,
  onPrevDay,
  onNextDay,
  onOpenArchive,
  onResetToToday,
  onOpenDuel,
  onOpenPathFinder,
  onOpenHowToPlay,
  leftExtra = null,
  rightExtra = null,
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
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
        {leftExtra}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 transition hover:border-white/20 hover:text-white active:scale-95"
            title="Previous Day"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenArchive || undefined}
            disabled={!onOpenArchive}
            className={`flex h-7 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition select-none ${
              onOpenArchive ? 'hover:bg-white/[0.05] cursor-pointer' : 'cursor-default'
            }`}
            title={onOpenArchive ? 'Open Challenge Archive' : `${meta.label}, ${meta.formatted}`}
          >
            <span className={meta.isToday ? 'text-white font-bold' : 'text-slate-200 font-bold'}>
              {meta.label}, {meta.formatted}
            </span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isToday}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] transition ${
              isToday
                ? 'opacity-30 cursor-not-allowed text-slate-600'
                : 'text-slate-400 hover:border-white/20 hover:text-white active:scale-95'
            }`}
            title={isToday ? 'Future challenges are locked' : 'Next Day'}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {!isToday && (onResetToToday || onSelectDate) && (
          <button
            type="button"
            onClick={handleResetToday}
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-gold hover:bg-gold/10 transition"
            title="Return to today's active challenge"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Today</span>
          </button>
        )}

        {onOpenArchive && (
          <button
            type="button"
            onClick={onOpenArchive}
            className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-cinema-muted hover:bg-white/[0.05] hover:text-white transition"
            title="Browse Past Challenges Archive"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Archive</span>
          </button>
        )}
      </div>

      {(rightExtra || (!compact && (onOpenDuel || onOpenPathFinder || onOpenHowToPlay)) || (embedded && onOpenHowToPlay)) ? (
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
          {rightExtra}

          {!compact && onOpenDuel && (
            <a
              href="/duel"
              onClick={(e) => {
                if (isModifiedClick(e)) return;
                e.preventDefault();
                onOpenDuel();
              }}
              className="flex h-7 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-cinema-surface px-2.5 text-xs font-semibold text-slate-200 transition hover:border-gold/50 hover:text-gold"
              title="Play 1v1 Online Duel against a friend"
            >
              <Swords className="h-3.5 w-3.5 text-gold" />
              <span>1v1 Duel</span>
            </a>
          )}

          {!compact && onOpenPathFinder && (
            <a
              href="/path-finder"
              onClick={(e) => {
                if (isModifiedClick(e)) return;
                e.preventDefault();
                onOpenPathFinder();
              }}
              className="hidden sm:flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-gold/90 transition hover:bg-gold/10 hover:text-gold"
              title="Custom Star Path Finder (PRO)"
            >
              <Sparkles className="h-3 w-3" />
              <span>Path Finder</span>
            </a>
          )}

          {onOpenHowToPlay && (
            <button
              type="button"
              onClick={onOpenHowToPlay}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-cinema-muted transition hover:border-white/20 hover:text-white"
              title="How to Play"
            >
              <HelpCircle className="h-3.5 w-3.5" />
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
    <div className={`flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3 ${compact ? 'w-full' : ''}`}>
      {content}
    </div>
  );
}
