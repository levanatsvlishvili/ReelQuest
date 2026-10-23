import { GitFork, HelpCircle, DollarSign, History, Sparkles, Flame, Swords } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const GAME_MODES = [
  {
    id: 'six-degrees',
    title: 'Beat Otara',
    subtitle: 'Cinema Oracle Duel',
    icon: GitFork,
    status: 'ACTIVE',
    badge: 'LIVE',
    hasStreak: true
  },
  {
    id: '1v1-duel',
    title: '1v1 Duel',
    subtitle: 'Online Multiplayer',
    icon: Swords,
    status: 'ACTIVE',
    badge: 'NEW',
    hasStreak: false
  },
  {
    id: 'custom-path',
    title: 'Path Finder',
    subtitle: 'Custom Stars',
    icon: Sparkles,
    status: 'ACTIVE',
    badge: 'PRO',
    hasStreak: false // Custom Path Finder is a sandbox tool, not a game — no streak
  },
  {
    id: 'plot-guesser',
    title: 'Plot Guesser',
    subtitle: 'Logline Mystery',
    icon: HelpCircle,
    status: 'COMING_SOON',
    badge: 'COMING SOON',
    hasStreak: true,
    description: 'Guess iconic films from mysterious synopsis clues with minimal hints.'
  },
  {
    id: 'box-office',
    title: 'Box Office Clash',
    subtitle: 'Gross Showdown',
    icon: DollarSign,
    status: 'COMING_SOON',
    badge: 'COMING SOON',
    hasStreak: true,
    description: 'Higher or Lower: Pit blockbusters against each other based on worldwide box office earnings.'
  },
  {
    id: 'movie-timeline',
    title: 'Movie Timeline',
    subtitle: 'Chronology',
    icon: History,
    status: 'COMING_SOON',
    badge: 'COMING SOON',
    hasStreak: true,
    description: 'Place cinematic masterpieces in their exact historical release order without breaking the streak.'
  }
];

export function GameModeSelector({ activeMode, onSelectMode }) {
  const { isAuthenticated, stats } = useAuth();
  const currentStreak = stats?.streak ?? 0;

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
                <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider border ${
                  mode.id === 'custom-path'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {mode.badge}
                </span>
              ) : (
                <span className="rounded-full bg-cinema-border/80 px-1.5 py-0.2 text-[9px] font-medium text-cinema-muted">
                  Soon
                </span>
              )}

              {/* Game Streak Badge (Only for authenticated users and actual games — never Path Finder) */}
              {isAuthenticated && mode.hasStreak && mode.status === 'ACTIVE' && (
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold border transition ${
                    currentStreak > 0
                      ? 'border-orange-500/40 bg-orange-500/15 text-orange-400 shadow-sm'
                      : 'border-cinema-border/70 bg-cinema-black/40 text-cinema-muted'
                  }`}
                  title={`${currentStreak} Day Streak in ${mode.title}`}
                >
                  <Flame className={`h-3 w-3 ${currentStreak > 0 ? 'fill-orange-400 text-orange-400 animate-pulse' : 'text-cinema-muted'}`} />
                  <span>{currentStreak}d</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
