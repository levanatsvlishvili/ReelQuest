import React, { useState } from 'react';
import {
  X,
  Film,
  Users,
  Target,
  Zap,
  Trophy,
  Flame,
  Search,
  Image,
  TrendingUp,
  Award,
  Crown,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

export function HowToPlayModal({ isOpen, onClose, initialTab = 'overview' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'About & Games', icon: Info },
    { id: 'beat-otara', label: 'Beat Otara', icon: Zap },
    { id: 'spotle', label: 'Spotle', icon: Search },
    { id: 'frame-sleuth', label: 'Frame Sleuth', icon: Image },
    { id: 'box-office', label: 'Box Office Clash', icon: TrendingUp },
    { id: 'progression', label: 'XP & Streaks', icon: Award }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gold/40 bg-gradient-to-b from-cinema-card via-cinema-surface to-cinema-black p-5 sm:p-7 shadow-2xl scrollbar-thin flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-cinema-muted transition hover:bg-cinema-border hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-cinema-border/70 pb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold/20 text-gold border border-gold/40 shadow-gold-glow">
            <Film className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                Reel<span className="text-gold">Quest</span> Guide
              </h3>
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold border border-gold/30">
                Rulebook
              </span>
            </div>
            <p className="text-xs text-cinema-muted">
              Platform overview, game rules, and progression guide
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-cinema-border/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition shrink-0 ${
                  isActive
                    ? 'bg-gold/20 text-gold border border-gold/40 shadow-gold-glow'
                    : 'text-cinema-muted hover:text-white hover:bg-cinema-surface border border-transparent'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="my-5 space-y-4 text-xs">
          {/* ========================================================= */}
          {/* TAB 1: ABOUT & ALL GAMES OVERVIEW                         */}
          {/* ========================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* About Banner */}
              <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4 leading-relaxed text-slate-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="h-4 w-4 text-gold" />
                  <strong className="text-white font-bold text-sm">Welcome to ReelQuest</strong>
                </div>
                <p className="text-xs text-cinema-muted">
                  ReelQuest is the daily Hollywood cinema gaming platform where movie buffs, trivia lovers, and film enthusiasts test their knowledge across multiple daily game modes, build streaks, level up their Hollywood ranks, and climb the global leaderboards.
                </p>
              </div>

              {/* Game Cards Grid */}
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 pt-1">
                Daily Game Modes
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Game 1: Beat Otara */}
                <div
                  onClick={() => setActiveTab('beat-otara')}
                  className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3.5 space-y-2 cursor-pointer hover:border-gold/50 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/20 text-gold border border-gold/30">
                        <Zap className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-white group-hover:text-gold transition">Beat Otara</span>
                    </div>
                    <span className="rounded bg-cinema-card px-2 py-0.5 text-[10px] text-cinema-muted font-mono">
                      Six Degrees
                    </span>
                  </div>
                  <p className="text-[11px] text-cinema-muted leading-relaxed">
                    Connect two Hollywood actors through shared movies and co-stars in the fewest hops. Match Otara the Cinema Oracle's par path.
                  </p>
                  <span className="text-[10px] font-bold text-gold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Read detailed rules</span>
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>

                {/* Game 2: Spotle */}
                <div
                  onClick={() => setActiveTab('spotle')}
                  className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3.5 space-y-2 cursor-pointer hover:border-gold/50 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        <Search className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-white group-hover:text-cyan-300 transition">Spotle</span>
                    </div>
                    <span className="rounded bg-cinema-card px-2 py-0.5 text-[10px] text-cinema-muted font-mono">
                      Mystery Film
                    </span>
                  </div>
                  <p className="text-[11px] text-cinema-muted leading-relaxed">
                    Deduce the mystery movie in up to 10 guesses. Every guess reveals clues: year, director, genre, cast overlap, and box office.
                  </p>
                  <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Read detailed rules</span>
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>

                {/* Game 3: Frame Sleuth */}
                <div
                  onClick={() => setActiveTab('frame-sleuth')}
                  className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3.5 space-y-2 cursor-pointer hover:border-gold/50 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Image className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-white group-hover:text-emerald-300 transition">Frame Sleuth</span>
                    </div>
                    <span className="rounded bg-cinema-card px-2 py-0.5 text-[10px] text-cinema-muted font-mono">
                      6 Stills
                    </span>
                  </div>
                  <p className="text-[11px] text-cinema-muted leading-relaxed">
                    Identify the movie from cinematic scene stills. Starts with a difficult shot; each wrong guess or skip reveals a clearer frame.
                  </p>
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Read detailed rules</span>
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>

                {/* Game 4: Box Office Clash */}
                <div
                  onClick={() => setActiveTab('box-office')}
                  className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3.5 space-y-2 cursor-pointer hover:border-gold/50 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-white group-hover:text-purple-300 transition">Box Office Clash</span>
                    </div>
                    <span className="rounded bg-cinema-card px-2 py-0.5 text-[10px] text-cinema-muted font-mono">
                      Higher / Lower
                    </span>
                  </div>
                  <p className="text-[11px] text-cinema-muted leading-relaxed">
                    Compare two iconic movies and guess which earned more at the worldwide box office. Play the 5-round Daily Challenge or Endless Streak!
                  </p>
                  <span className="text-[10px] font-bold text-purple-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Read detailed rules</span>
                    <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>

              {/* Daily Schedule Notice */}
              <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/40 p-3 flex items-center justify-between text-[11px] text-cinema-muted">
                <span>⏰ All daily puzzles reset automatically every day at <strong>00:00 UTC</strong>.</span>
                <span className="text-gold font-bold">1 Challenge Per Game / Day</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: BEAT OTARA RULES                                   */}
          {/* ========================================================= */}
          {activeTab === 'beat-otara' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4">
                <strong className="text-gold font-bold uppercase tracking-wider block mb-1">
                  🎯 Objective: Connect the Stars
                </strong>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Navigate the Hollywood filmography graph to connect the <strong>Start Star</strong> to the <strong>Target Star</strong> using shared films and co-stars in the fewest possible hops.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3.5 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-gold text-[11px]">1</span>
                    <span>Pick a Movie</span>
                  </div>
                  <p className="text-xs text-cinema-muted pl-7">
                    From the current actor, choose any credited film from their career filmography.
                  </p>
                </div>

                <div className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3.5 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-gold text-[11px]">2</span>
                    <span>Pick a Co-Star</span>
                  </div>
                  <p className="text-xs text-cinema-muted pl-7">
                    Select any co-star who appeared in that same movie to continue the chain.
                  </p>
                </div>

                <div className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3.5 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-gold text-[11px]">3</span>
                    <span>Reach the Destination Star</span>
                  </div>
                  <p className="text-xs text-cinema-muted pl-7">
                    When one of your co-stars matches the destination star, your path is complete!
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span>Otara's Par Benchmark</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Otara calculates the mathematical shortest path (typically 2 to 3 hops). Matching Otara's Par gives you the highest XP bonus and victory prestige!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: SPOTLE RULES                                       */}
          {/* ========================================================= */}
          {activeTab === 'spotle' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                <strong className="text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                  🔍 Objective: Deduce the Mystery Film
                </strong>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Guess the hidden movie in <strong>10 attempts or fewer</strong>. Each guess gives you strategic attribute comparisons.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3 space-y-1">
                  <strong className="text-white block font-semibold">Comparison Clues:</strong>
                  <ul className="space-y-1 text-cinema-muted pl-4 list-disc text-[11px]">
                    <li><strong className="text-slate-200">Release Year:</strong> Shows exact match (green) or indicates if mystery film was released earlier (↓) or later (↑).</li>
                    <li><strong className="text-slate-200">Director:</strong> Green if direct match, red if different director.</li>
                    <li><strong className="text-slate-200">Genres:</strong> Green for shared genres, gray for unmatched genres.</li>
                    <li><strong className="text-slate-200">Cast Members:</strong> Highlights any actors appearing in both movies.</li>
                    <li><strong className="text-slate-200">Box Office:</strong> Compares worldwide commercial performance (higher/lower).</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3 text-xs text-slate-300">
                  <strong className="text-gold block mb-1">Mystery Clues:</strong>
                  Clues (e.g. lead actor initials, key plot trivia) unlock after a certain number of guesses to assist your deduction.
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: FRAME SLEUTH RULES                                 */}
          {/* ========================================================= */}
          {activeTab === 'frame-sleuth' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <strong className="text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                  🖼️ Objective: Visual Scene Guessing
                </strong>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Identify today's movie from <strong>6 chronological cinematic frame stills</strong>.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3 space-y-1 text-xs">
                  <strong className="text-white block font-semibold">How It Works:</strong>
                  <ul className="space-y-1.5 text-cinema-muted pl-4 list-disc text-[11px]">
                    <li><strong className="text-slate-200">Frame 1 (Challenging):</strong> An atmospheric, wide, or subtle scene with no titles or actor face giveaways.</li>
                    <li><strong className="text-slate-200">Frames 2–5 (Progressive):</strong> Each incorrect guess or skip unlocks the next, easier scene still.</li>
                    <li><strong className="text-slate-200">Frame 6 (Iconic):</strong> The most recognizable shot from the film.</li>
                    <li><strong className="text-slate-200">Scoring:</strong> Guessing on Frame 1 awards 100 XP (Master Sleuth); each subsequent frame awards proportionally less.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: BOX OFFICE CLASH RULES                             */}
          {/* ========================================================= */}
          {activeTab === 'box-office' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
                <strong className="text-purple-400 font-bold uppercase tracking-wider block mb-1">
                  💰 Objective: Higher or Lower Gross
                </strong>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Two iconic films are placed side by side. Guess whether Movie B grossed <strong>HIGHER</strong> or <strong>LOWER</strong> than Movie A at the worldwide box office.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3 space-y-1.5 text-xs">
                  <strong className="text-white block font-semibold">Game Modes:</strong>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="rounded-lg bg-cinema-black/60 p-2.5 border border-cinema-border/60">
                      <strong className="text-gold block text-xs">Daily Challenge</strong>
                      <span className="text-[11px] text-cinema-muted">
                        5 curated rounds every day. Strive for a perfect 5/5 score to max out daily XP!
                      </span>
                    </div>
                    <div className="rounded-lg bg-cinema-black/60 p-2.5 border border-cinema-border/60">
                      <strong className="text-purple-400 block text-xs">Endless Streak</strong>
                      <span className="text-[11px] text-cinema-muted">
                        Survive as many correct rounds as possible. One wrong answer ends your run!
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: PROGRESSION, XP & STREAKS                          */}
          {/* ========================================================= */}
          {activeTab === 'progression' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4">
                <strong className="text-gold font-bold uppercase tracking-wider block mb-1">
                  🏆 Hollywood Progression System
                </strong>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Every match you play contributes to your permanent Cinephile profile, level titles, and activity heatmap.
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span>Daily Streaks & XP Bonanza</span>
                  </div>
                  <p className="text-[11px] text-cinema-muted leading-relaxed">
                    Play consecutive days to build your Daily Streak. A 3+ day streak activates a <strong>1.5x XP Bonanza Multiplier</strong> on all match rewards.
                  </p>
                </div>

                <div className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Award className="h-4 w-4 text-purple-400" />
                    <span>Cinema Levels & Titles</span>
                  </div>
                  <p className="text-[11px] text-cinema-muted leading-relaxed">
                    Progress through 50 Hollywood ranks from <em>Ticket Taker</em> (Lvl 1) $\to$ <em>Film Critic</em> (Lvl 10) $\to$ <em>Legendary Auteur</em> (Lvl 50).
                  </p>
                </div>

                <div className="rounded-xl border border-cinema-border bg-cinema-surface/60 p-3 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Crown className="h-4 w-4 text-gold" />
                    <span>ReelQuest PRO VIP</span>
                  </div>
                  <p className="text-[11px] text-cinema-muted leading-relaxed">
                    Unlock infinite custom actor-to-actor challenges, access the entire 30,000+ TMDB filmography graph, and sport a golden crown badge on the global leaderboards.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Button */}
        <div className="mt-auto pt-4 border-t border-cinema-border/70">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold-dark py-2.5 text-xs font-black text-cinema-black shadow-gold-glow transition hover:opacity-90 active:scale-95"
          >
            Start Playing ReelQuest
          </button>
        </div>
      </div>
    </div>
  );
}
