import { GitFork, HelpCircle, DollarSign, History, Sparkles } from 'lucide-react';

export const GAME_MODES = [
  {
    id: 'six-degrees',
    title: 'Beat Otara',
    subtitle: 'Cinema Oracle Duel',
    icon: GitFork,
    status: 'ACTIVE',
    badge: 'LIVE'
  },
  {
    id: 'custom-path',
    title: 'Path Finder',
    subtitle: 'Custom Stars',
    icon: Sparkles,
    status: 'ACTIVE',
    badge: 'PRO'
  },
  {
    id: 'plot-guesser',
    title: 'Plot Guesser',
    subtitle: 'Logline Mystery',
    icon: HelpCircle,
    status: 'COMING_SOON',
    badge: 'COMING SOON',
    description: 'Guess iconic films from mysterious synopsis clues with minimal hints.'
  },
  {
    id: 'box-office',
    title: 'Box Office Clash',
    subtitle: 'Gross Showdown',
    icon: DollarSign,
    status: 'COMING_SOON',
    badge: 'COMING SOON',
    description: 'Higher or Lower: Pit blockbusters against each other based on worldwide box office earnings.'
  },
  {
    id: 'movie-timeline',
    title: 'Movie Timeline',
    subtitle: 'Chronology',
    icon: History,
    status: 'COMING_SOON',
    badge: 'COMING SOON',
    description: 'Place cinematic masterpieces in their exact historical release order without breaking the streak.'
  }
];

export function GameModeSelector({ activeMode, onSelectMode }) {
  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-center gap-2 border-b border-cinema-border/50 pb-3 min-w-max">
        <span className="text-[11px] font-bold uppercase tracking-wider text-cinema-muted mr-1 hidden sm:inline">
          Game Modes:
        </span>

        {GAME_MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`group flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'border border-gold/50 bg-gold/15 text-gold shadow-gold-glow/20'
                  : 'border border-cinema-border/60 bg-cinema-surface/60 text-slate-300 hover:border-cinema-muted hover:text-white'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-gold' : 'text-cinema-muted group-hover:text-slate-200'}`} />
              <span>{mode.title}</span>

              {mode.status === 'ACTIVE' ? (
                <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                  {mode.badge}
                </span>
              ) : (
                <span className="rounded-full bg-cinema-border/80 px-1.5 py-0.2 text-[9px] font-medium text-cinema-muted">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
