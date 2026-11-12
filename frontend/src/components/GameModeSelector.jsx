import { GitFork, Sparkles, Flame, Film, Camera, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { calculateGameStreak } from '../api/auth';

export const GAME_MODES = [
  {
    id: 'six-degrees',
    path: '/',
    title: 'Beat Otara',
    subtitle: 'Cinema Oracle Duel',
    icon: GitFork,
    status: 'ACTIVE',
    badge: null,
    hasStreak: true
  },
  {
    id: 'spotle',
    path: '/spotle',
    title: 'Spotle',
    subtitle: 'Daily Movie Mystery',
    icon: Film,
    status: 'ACTIVE',
    badge: null,
    hasStreak: true
  },
  {
    id: 'frame-sleuth',
    path: '/frame-sleuth',
    title: 'Frame Sleuth',
    subtitle: '6-Frame Mystery',
    icon: Camera,
    status: 'ACTIVE',
    badge: null,
    hasStreak: true
  },
  {
    id: 'box-office',
    path: '/box-office',
    title: 'Box Office',
    subtitle: 'Higher or Lower',
    icon: TrendingUp,
    status: 'ACTIVE',
    badge: null,
    hasStreak: true
  },
  {
    id: 'custom-path',
    path: '/path-finder',
    title: 'Path Finder',
    subtitle: 'Custom Stars',
    icon: Sparkles,
    status: 'ACTIVE',
    badge: 'PRO',
    hasStreak: false
  }
];

function isModifiedClick(e) {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

export function GameModeSelector({ activeMode, onSelectMode }) {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-center gap-2 border-b border-cinema-border/50 pb-3 min-w-max">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
          Modes:
        </span>

        {GAME_MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          const modeStreak = calculateGameStreak(mode.id, user?.id);

          return (
            <a
              key={mode.id}
              href={mode.path}
              onClick={(e) => {
                if (isModifiedClick(e)) return;
                e.preventDefault();
                onSelectMode(mode.id);
              }}
              className={`group flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                isActive
                  ? 'border border-gold/60 bg-gold/15 text-gold shadow-gold-glow/20'
                  : 'border border-cinema-border/70 bg-cinema-surface/70 text-slate-300 hover:border-slate-500 hover:text-white'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-gold' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <span>{mode.title}</span>

              {mode.badge === 'PRO' && (
                <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-300 border border-amber-500/35 leading-none">
                  PRO
                </span>
              )}

              {isAuthenticated && mode.hasStreak && mode.status === 'ACTIVE' && modeStreak > 0 && (
                <span
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold border border-orange-500/40 bg-orange-500/15 text-orange-400 shadow-sm transition leading-none"
                  title={`${modeStreak} Day Streak in ${mode.title}`}
                >
                  <Flame className="h-3 w-3 fill-orange-400 text-orange-400" />
                  <span>{modeStreak}d</span>
                </span>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
