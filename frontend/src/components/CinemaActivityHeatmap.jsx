import React, { useState, useMemo } from 'react';
import { Calendar, Flame, Trophy, Film } from 'lucide-react';
import { buildActivityHeatmapData } from '../utils/cinemaLevels';

export function CinemaActivityHeatmap({ matchHistory = [] }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const { weeks, totalMatchesYear, activeDaysCount } = useMemo(() => {
    return buildActivityHeatmapData(matchHistory);
  }, [matchHistory]);

  // Color intensities matching GitHub/Cinema dark theme
  const getLevelClasses = (level) => {
    switch (level) {
      case 1:
        return 'bg-emerald-900/80 border-emerald-700/60 hover:border-emerald-400';
      case 2:
        return 'bg-emerald-600 border-emerald-500/70 hover:border-emerald-300';
      case 3:
        return 'bg-emerald-400 border-emerald-300 hover:border-white shadow-sm';
      case 4:
        return 'bg-emerald-300 border-white shadow-[0_0_8px_rgba(52,211,153,0.8)]';
      default:
        return 'bg-cinema-surface/70 border-cinema-border/50 hover:border-slate-500';
    }
  };

  // Extract month labels for the top axis
  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIdx) => {
      const firstDay = week[0];
      if (firstDay) {
        const month = firstDay.date.getMonth();
        if (month !== lastMonth && weekIdx < weeks.length - 2) {
          labels.push({
            name: firstDay.date.toLocaleDateString('en-US', { month: 'short' }),
            weekIdx
          });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [weeks]);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card/90 p-5 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cinema-border/60 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-extrabold text-white tracking-wide">
              Cinema Activity Heatmap
            </h3>
          </div>
          <p className="text-xs text-cinema-muted mt-0.5">
            Daily challenges, Beat Otara, Spotle, Frame Sleuth, and Box Office runs over the past 365 days.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300">
            <Film className="h-3.5 w-3.5 text-emerald-400" />
            <span>{totalMatchesYear} matches this year</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-gold/15 border border-gold/30 px-3 py-1 text-xs font-bold text-gold">
            <Flame className="h-3.5 w-3.5" />
            <span>{activeDaysCount} active days</span>
          </span>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="overflow-x-auto pb-3 scrollbar-thin">
        <div className="inline-block min-w-[720px]">
          {/* Month labels along the top */}
          <div className="flex text-[10px] font-bold text-cinema-muted mb-1.5 pl-8 relative h-4">
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                className="absolute"
                style={{ left: `${m.weekIdx * 14 + 32}px` }}
              >
                {m.name}
              </span>
            ))}
          </div>

          <div className="flex gap-1.5">
            {/* Weekday indicators (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between text-[9px] font-bold text-cinema-muted/80 pr-1 py-0.5 select-none w-7 text-right">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Weeks columns */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, dIdx) => (
                    <button
                      key={dIdx}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      onClick={() => setHoveredDay(day)}
                      title={`${day.formatted}: ${day.count} matches (${day.wins} wins)`}
                      className={`h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-[3px] border transition-transform duration-150 hover:scale-125 focus:outline-none ${getLevelClasses(day.level)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Legend / Tooltip Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-cinema-border/50 text-xs">
        {/* Dynamic Tooltip info when hovering a square */}
        <div className="text-cinema-muted text-xs min-h-[20px] flex items-center gap-2">
          {hoveredDay ? (
            <div className="flex items-center gap-2 animate-fade-in font-medium text-slate-200">
              <span className="font-bold text-white">{hoveredDay.formatted}:</span>
              {hoveredDay.count === 0 ? (
                <span className="text-cinema-muted">No cinema matches logged.</span>
              ) : (
                <span className="text-emerald-400 font-bold">
                  {hoveredDay.count} {hoveredDay.count === 1 ? 'match' : 'matches'} played
                  {hoveredDay.wins > 0 && ` (${hoveredDay.wins} ${hoveredDay.wins === 1 ? 'win' : 'wins'})`}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-cinema-muted">Hover or tap on any square to inspect day performance</span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[11px] text-cinema-muted shrink-0">
          <span>Less</span>
          <div className="h-3 w-3 rounded-[2px] border bg-cinema-surface/70 border-cinema-border/50" />
          <div className="h-3 w-3 rounded-[2px] border bg-emerald-900/80 border-emerald-700/60" />
          <div className="h-3 w-3 rounded-[2px] border bg-emerald-600 border-emerald-500/70" />
          <div className="h-3 w-3 rounded-[2px] border bg-emerald-400 border-emerald-300" />
          <div className="h-3 w-3 rounded-[2px] border bg-emerald-300 border-white shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
