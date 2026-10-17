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

  function getDiffDaysFromToday(dateStr) {
    if (!dateStr || dateStr === 'Custom') return 0;
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateUtc = new Date(Date.UTC(y, m - 1, d));
    const [ty, tm, td] = todayStr.split('-').map(Number);
    const todayUtc = new Date(Date.UTC(ty, tm - 1, td));
    return Math.round((todayUtc - dateUtc) / (1000 * 60 * 60 * 24));
  }

  function getDayMeta(dateStr, offset = 0) {
    if (!dateStr || dateStr === 'Custom') {
      return { dateStr: todayStr, relative: 'Today', formatted: 'Today', isToday: true, isFuture: false, offset };
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
      isFuture,
      offset
    };
  }

  // Dynamic slot generation:
  // Dynamically fills the navigator to eliminate empty space across all breakpoints.
  // When on Today, shows up to 10 past days.
  // When in the past, shows subsequent days up to todayStr, and earlier days to the left.
  const daysFromToday = getDiffDaysFromToday(currentDate);
  const maxRight = Math.min(Math.max(0, daysFromToday), 4);
  const leftCount = Math.max(2, 10 - maxRight);

  const leftSlots = [];
  for (let i = leftCount; i >= 1; i--) {
    leftSlots.push(getDayMeta(shiftDateStr(currentDate, -i), -i));
  }

  const centerSlot = getDayMeta(currentDate, 0);

  const rightSlots = [];
  for (let i = 1; i <= maxRight; i++) {
    const nextStr = shiftDateStr(currentDate, i);
    if (nextStr <= todayStr) {
      rightSlots.push(getDayMeta(nextStr, i));
    }
  }

  function getVisibilityClass(offset) {
    const dist = Math.abs(offset);
    if (dist <= 1) return 'flex';
    if (dist <= 2) return 'hidden sm:flex';
    if (dist <= 4) return 'hidden md:flex';
    if (dist <= 6) return 'hidden lg:flex';
    if (dist <= 8) return 'hidden xl:flex';
    return 'hidden 2xl:flex';
  }

  const handleDateClick = (dateStr) => {
    if (dateStr <= todayStr && onSelectDate) {
      onSelectDate(dateStr);
    }
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cinema-border/80 bg-gradient-to-r from-cinema-card via-cinema-surface to-cinema-card p-2.5 sm:p-3 shadow-lg backdrop-blur-md ${compact ? 'w-full' : ''}`}>
      {/* Left controls & Carousel */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 justify-center sm:justify-start overflow-x-auto py-0.5 scrollbar-none">
        {/* Step backward */}
        <button
          onClick={onPrevDay}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cinema-border bg-cinema-black/50 text-slate-300 transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold active:scale-95"
          title="Previous Day's Challenge"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Carousel Ribbon: [ Left Days ] [ ★ CENTER ACTIVE ★ ] [ Right Days ] */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-1 sm:flex-initial overflow-x-auto scrollbar-none py-0.5">
          {leftSlots.map((slot) => (
            <button
              key={slot.dateStr}
              onClick={() => handleDateClick(slot.dateStr)}
              className={`${getVisibilityClass(slot.offset)} shrink-0 flex-col items-center justify-center rounded-xl border border-cinema-border/70 bg-cinema-black/50 px-2 sm:px-2.5 py-1 text-slate-300 transition hover:border-gold/50 hover:bg-gold/10 hover:text-white active:scale-95`}
              title={`Play ${slot.relative} (${slot.formatted})`}
            >
              <span className="text-[9px] font-semibold uppercase text-cinema-muted">
                {slot.relative}
              </span>
              <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
                {slot.formatted}
              </span>
            </button>
          ))}

          {/* ★ CENTER ACTIVE DAY (BOLD & GLOWING) ★ */}
          <div
            className="flex shrink-0 flex-col items-center justify-center rounded-xl border-2 border-gold bg-gradient-to-r from-gold/25 via-amber-400/20 to-gold/25 px-3 sm:px-4 py-1.5 text-white shadow-gold-glow ring-2 ring-gold/30 transition-transform scale-105 select-none"
          >
            <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-gold">
              <Sparkles className="h-2.5 w-2.5 fill-gold animate-pulse" />
              {centerSlot.relative || 'PLAYING'}
            </span>
            <span className="text-xs sm:text-sm font-black text-white whitespace-nowrap">
              {centerSlot.formatted}
            </span>
          </div>

          {rightSlots.map((slot) => (
            <button
              key={slot.dateStr}
              onClick={() => handleDateClick(slot.dateStr)}
              className={`${getVisibilityClass(slot.offset)} shrink-0 flex-col items-center justify-center rounded-xl border border-cinema-border/70 bg-cinema-black/50 px-2 sm:px-2.5 py-1 text-slate-300 transition hover:border-gold/50 hover:bg-gold/10 hover:text-white active:scale-95`}
              title={`Play ${slot.relative} (${slot.formatted})`}
            >
              <span className="text-[9px] font-semibold uppercase text-cinema-muted">
                {slot.relative}
              </span>
              <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
                {slot.formatted}
              </span>
            </button>
          ))}
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
