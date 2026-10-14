import { Sparkles, Crown, ArrowLeft, Bell, Film } from 'lucide-react';
import { GAME_MODES } from './GameModeSelector';

export function UpcomingGamePreview({ modeId, onBackToMain, onOpenPro }) {
  const mode = GAME_MODES.find(m => m.id === modeId) || GAME_MODES[1];
  const Icon = mode.icon;

  return (
    <div className="rounded-2xl border border-cinema-border bg-gradient-to-b from-cinema-card to-cinema-surface p-6 sm:p-8 text-center space-y-6 shadow-xl animate-fade-in max-w-2xl mx-auto my-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/15 text-gold border border-gold/30 shadow-gold-glow">
        <Icon className="h-8 w-8" />
      </div>

      <div>
        <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold border border-gold/30">
          In Active Development
        </span>
        <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
          {mode.title}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-cinema-muted max-w-md mx-auto">
          {mode.description}
        </p>
      </div>

      {/* Feature Teasers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        <div className="rounded-xl border border-cinema-border/60 bg-cinema-surface/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Real TMDB Data</span>
          <p className="text-xs text-slate-200">Powered by 30,000+ films and live box office metadata.</p>
        </div>
        <div className="rounded-xl border border-cinema-border/60 bg-cinema-surface/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Global Ranking</span>
          <p className="text-xs text-slate-200">Compete on daily leaderboards and build your win streak.</p>
        </div>
        <div className="rounded-xl border border-cinema-border/60 bg-cinema-surface/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gold">PRO Early Access</span>
          <p className="text-xs text-slate-200">ReelQuest PRO cinephiles receive early beta invitations.</p>
        </div>
      </div>

      {/* Pro early access banner */}
      <div className="flex items-center justify-between rounded-xl border border-gold/40 bg-gold/10 p-3.5 text-xs text-left">
        <div className="flex items-center gap-2.5">
          <Crown className="h-4 w-4 text-gold shrink-0" />
          <div>
            <span className="font-bold text-white block">Want early beta access?</span>
            <span className="text-cinema-muted text-[11px]">PRO subscribers unlock experimental gameplay modes first.</span>
          </div>
        </div>
        <button
          onClick={onOpenPro}
          className="rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-cinema-black hover:opacity-90 shadow-sm shrink-0"
        >
          Learn More
        </button>
      </div>

      <div className="pt-2 flex justify-center">
        <button
          onClick={onBackToMain}
          className="flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-4 py-2 text-xs font-semibold text-slate-200 hover:border-gold hover:text-gold transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Play Six Degrees Daily</span>
        </button>
      </div>
    </div>
  );
}
