import React from 'react';
import { ChevronLeft, ChevronRight, Archive, RotateCcw, Sparkles } from 'lucide-react';

export function DailyDateNavigator({
  currentDate,
  onSelectDate,
  onPrevDay,
  onNextDay,
  onOpenArchive,
  onResetToToday,
  compact = false
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = !currentDate || currentDate === todayStr;

  function shiftDateStr(dateStr, days) {
    if (!dateStr || dateStr === 'Custom') return todayStr;
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + days));
    return date.toISOString().slice(0, 10);
  }

  function getDayMeta(dateStr) {
    if (!dateStr || dateStr === 'Custom') {
      return { dateStr: todayStr, relative: 'Today', formatted: 'Today', isToday: true, isFuture: false };
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateUtc = new Date(Date.UTC(y, m - 1, d));
    const [ty, tm, td] = todayStr.split('-').map(Number);
    const todayUtc = new Date(Date.UTC(ty, tm - 1, td));

    const diffDays = Math.round((todayUtc - dateUtc) / (1000 * 60 * 60 * 24));
    const isFuture = diffDays < 0;

    let relative = '';
    if (diffDays === 0) relative = 'Today';
    else if (diffDays === 1) relative = 'Yesterday';
    else if (diffDays === 2) relative = '2 Days Ago';
    else if (isFuture) relative = 'Future';
    else {
      relative = dateUtc.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' });
    }

    const formatted = dateUtc.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric'
    });

    return {
      dateStr,
      relative,
      formatted,
      isToday: diffDays === 0,
      isFuture
    };
  }

  // Generate date slots around currentDate
  // Left: past days [-2, -1]
  // Center: currentDate [0]
  // Right: subsequent days [+1, +2] up to todayStr
  const leftSlots = [
    getDayMeta(shiftDateStr(currentDate, -2)),
    getDayMeta(shiftDateStr(currentDate, -1))
  ];

  const centerSlot = getDayMeta(currentDate);

  // Subsequent days: only include if <= todayStr
  const rightSlots = [];
  const next1Str = shiftDateStr(currentDate, 1);
  if (next1Str <= todayStr) {
    rightSlots.push(getDayMeta(next1Str));
    const next2Str = shiftDateStr(currentDate, 2);
    if (next2Str <= todayStr) {
      rightSlots.push(getDayMeta(next2Str));
    }
  }

  const handleDateClick = (dateStr) => {
    if (dateStr <= todayStr && onSelectDate) {
      onSelectDate(dateStr);
    }
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cinema-border/80 bg-gradient-to-r from-cinema-card via-cinema-surface to-cinema-card p-2.5 sm:p-3 shadow-lg backdrop-blur-md ${compact ? 'w-full' : ''}`}>
      {/* Left controls & Carousel */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-center sm:justify-start overflow-x-auto py-0.5 scrollbar-none">
        {/* Step backward */}
        <button
          onClick={onPrevDay}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cinema-border bg-cinema-black/50 text-slate-300 transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold active:scale-95"
          title="Previous Day's Challenge"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Carousel Ribbon: [ Left Days ] [ ★ CENTER ACTIVE ★ ] [ Right Days ] */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Day - 2 (desktop only) */}
          <button
            onClick={() => handleDateClick(leftSlots[0].dateStr)}
            className="hidden md:flex flex-col items-center justify-center rounded-xl border border-cinema-border/60 bg-cinema-black/40 px-2.5 py-1 text-slate-400 transition hover:border-gold/50 hover:bg-gold/10 hover:text-white active:scale-95"
            title={`Play ${leftSlots[0].relative} (${leftSlots[0].formatted})`}
          >
            <span className="text-[9px] font-semibold uppercase text-cinema-muted">
              {leftSlots[0].relative}
            </span>
            <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
              {leftSlots[0].formatted}
            </span>
          </button>

          {/* Day - 1 */}
          <button
            onClick={() => handleDateClick(leftSlots[1].dateStr)}
            className="flex flex-col items-center justify-center rounded-xl border border-cinema-border/70 bg-cinema-black/50 px-2.5 py-1 text-slate-300 transition hover:border-gold/50 hover:bg-gold/10 hover:text-white active:scale-95"
            title={`Play ${leftSlots[1].relative} (${leftSlots[1].formatted})`}
          >
            <span className="text-[9px] font-semibold uppercase text-cinema-muted">
              {leftSlots[1].relative}
            </span>
            <span className="text-xs font-bold text-slate-200 whitespace-nowrap">
              {leftSlots[1].formatted}
            </span>
          </button>

          {/* ★ CENTER ACTIVE DAY (BOLD & GLOWING) ★ */}
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-gold bg-gradient-to-r from-gold/25 via-amber-400/20 to-gold/25 px-3.5 sm:px-4 py-1.5 text-white shadow-gold-glow ring-2 ring-gold/30 transition-transform scale-105 select-none"
          >
            <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-gold">
              <Sparkles className="h-2.5 w-2.5 fill-gold animate-pulse" />
              {centerSlot.relative || 'PLAYING'}
            </span>
            <span className="text-xs sm:text-sm font-black text-white whitespace-nowrap">
              {centerSlot.formatted}
            </span>
          </div>

          {/* Subsequent Day + 1 (if <= today) */}
          {rightSlots[0] && (
            <button
              onClick={() => handleDateClick(rightSlots[0].dateStr)}
              className="flex flex-col items-center justify-center rounded-xl border border-cinema-border/70 bg-cinema-black/50 px-2.5 py-1 text-slate-300 transition hover:border-gold/50 hover:bg-gold/10 hover:text-white active:scale-95"
              title={`Play ${rightSlots[0].relative} (${rightSlots[0].formatted})`}
            >
              <span className="text-[9px] font-semibold uppercase text-cinema-muted">
                {rightSlots[0].relative}
              </span>
              <span className="text-xs font-bold text-slate-200 whitespace-nowrap">
                {rightSlots[0].formatted}
              </span>
            </button>
          )}

          {/* Subsequent Day + 2 (if <= today, desktop only) */}
          {rightSlots[1] && (
            <button
              onClick={() => handleDateClick(rightSlots[1].dateStr)}
              className="hidden md:flex flex-col items-center justify-center rounded-xl border border-cinema-border/60 bg-cinema-black/40 px-2.5 py-1 text-slate-400 transition hover:border-gold/50 hover:bg-gold/10 hover:text-white active:scale-95"
              title={`Play ${rightSlots[1].relative} (${rightSlots[1].formatted})`}
            >
              <span className="text-[9px] font-semibold uppercase text-cinema-muted">
                {rightSlots[1].relative}
              </span>
              <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
                {rightSlots[1].formatted}
              </span>
            </button>
          )}
        </div>

        {/* Step forward */}
        <button
          onClick={onNextDay}
          disabled={isToday}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cinema-border bg-cinema-black/50 text-slate-300 transition ${
            isToday
              ? 'opacity-25 cursor-not-allowed text-slate-600 border-cinema-border/30'
              : 'hover:border-gold/50 hover:bg-gold/10 hover:text-gold active:scale-95'
          }`}
          title={isToday ? "Future challenges are locked" : "Next Day's Challenge"}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Right controls: "Back to Today" & "Archive" */}
      <div className="flex items-center gap-2 self-center sm:self-auto shrink-0">
        {!isToday && onResetToToday && (
          <button
            onClick={onResetToToday}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 shadow-sm transition hover:bg-amber-500/20 active:scale-95"
            title="Return to today's active challenge"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Today</span>
          </button>
        )}

        {!compact && onOpenArchive && (
          <button
            onClick={onOpenArchive}
            className="flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-gold/50 hover:text-gold active:scale-95"
            title="Browse All Past Challenges in Archive"
          >
            <Archive className="h-3.5 w-3.5 text-gold" />
            <span className="hidden sm:inline">Challenge</span>
            <span>Archive</span>
          </button>
        )}
      </div>
    </div>
  );
}
