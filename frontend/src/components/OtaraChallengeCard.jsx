import React from 'react';
import { Play, Sparkles, Trophy, Footprints, Clock, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { getTmdbImageUrl } from '../api/client';

export function OtaraChallengeCard({
  challenge,
  gameStatus,
  moves = 0,
  timerSeconds = 0,
  onStart,
  onOpenSummary
}) {
  if (!challenge) return null;

  const optimalHops = challenge.optimalHops || 2;
  const isReady = gameStatus === 'READY';
  const isPlaying = gameStatus === 'PLAYING';
  const isWon = gameStatus === 'WON';
  const isGaveUp = gameStatus === 'GAVE_UP';
  const isFinished = isWon || isGaveUp;
  const matchedOtara = isWon && moves <= optimalHops;

  // Pre-Game Ready Screen
  if (isReady) {
    return (
      <div className="relative overflow-hidden rounded-3xl border-2 border-gold/60 bg-gradient-to-b from-cinema-card via-cinema-surface to-cinema-card p-5 sm:p-8 shadow-2xl animate-fade-in">
        {/* Glow ambient effects */}
        <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gold/15 blur-3xl pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
          {/* Otara Character Animated Art */}
          <div className="relative shrink-0">
            <div className="relative h-48 w-48 sm:h-56 sm:w-56 overflow-hidden rounded-3xl border-2 border-gold/70 bg-gradient-to-t from-cinema-black to-cinema-surface shadow-gold-glow animate-otara-float transition-transform hover:scale-105">
              <img
                src="/assets/otara/otara-challenge.jpg"
                alt="Otara - Cinema Oracle"
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute bottom-2 left-2 right-2 rounded-xl bg-cinema-black/85 backdrop-blur-md px-2.5 py-1 border border-gold/40 text-center shadow-lg">
                <span className="text-[11px] font-black uppercase tracking-wider text-gold flex items-center justify-center gap-1">
                  <Sparkles className="h-3 w-3 fill-gold animate-pulse" />
                  ოთარა • Otara
                </span>
                <span className="text-[9px] text-cinema-muted block">The Cinema Oracle</span>
              </div>
            </div>
          </div>

          {/* Dialog & Challenge Briefing */}
          <div className="flex-1 space-y-4 text-center lg:text-left">
            {/* Speech bubble */}
            <div className="relative rounded-2xl border border-gold/40 bg-cinema-black/60 p-4 sm:p-5 shadow-inner">
              <div className="flex items-center gap-2 mb-1 justify-center lg:justify-start">
                <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-gold border border-gold/40">
                  Otara's Challenge
                </span>
                <span className="text-xs text-cinema-muted">Daily Hollywood Duel</span>
              </div>

              <h2 className="text-base sm:text-xl font-extrabold text-white leading-snug">
                „მე უკვე ვიცი უმოკლესი გზა — ზუსტად <span className="text-gold underline decoration-gold/60 underline-offset-4">{optimalHops} სვლაში</span>!“
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
                შეძლებ ჩემი კინო-ინტელექტის გათანაბრებას? დააკავშირე <strong className="text-white">{challenge.startActor?.name}</strong> და <strong className="text-white">{challenge.targetActor?.name}</strong> მინიმალური ფილმებით.
              </p>
            </div>

            {/* Target Actor Matchup Pill */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
              <div className="flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface/80 px-3 py-1.5 text-xs text-slate-200">
                <span className="text-[10px] uppercase font-bold text-cinema-muted">საწყისი:</span>
                <span className="font-bold text-white">{challenge.startActor?.name}</span>
              </div>

              <ArrowRight className="h-4 w-4 text-gold shrink-0 hidden sm:block" />

              <div className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs text-gold">
                <span className="text-[10px] uppercase font-bold text-gold/80">სამიზნე:</span>
                <span className="font-extrabold text-white">{challenge.targetActor?.name}</span>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span>ოთარას ნიშნული: {optimalHops} სვლა</span>
              </div>
            </div>

            {/* Big Start Button */}
            <div className="pt-2">
              <button
                onClick={onStart}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-gold via-amber-400 to-gold-dark px-8 py-3.5 text-sm sm:text-base font-extrabold text-cinema-black shadow-gold-glow transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Play className="h-5 w-5 fill-cinema-black transition-transform group-hover:scale-110" />
                <span>დაწყება • Start Challenge</span>
              </button>
              <p className="mt-2 text-[11px] text-cinema-muted">
                დრო და ფილმების სია გაიხსნება ღილაკზე დაჭერისთანავე.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Finished State: Otara reacts to user's result (Praise or Encouragement)
  if (isFinished) {
    const isImpressed = matchedOtara;
    const mascotImg = isImpressed ? '/assets/otara/otara-impressed.jpg' : '/assets/otara/otara-encouraging.jpg';

    return (
      <div className={`relative overflow-hidden rounded-2xl border ${isImpressed ? 'border-gold bg-gradient-to-r from-gold/20 via-cinema-card to-cinema-surface' : 'border-cinema-border bg-cinema-card/90'} p-4 sm:p-5 shadow-xl animate-fade-in`}>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-gold/70 bg-cinema-black shadow-md animate-otara-float">
            <img
              src={mascotImg}
              alt="Otara Reaction"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-[10px] font-black uppercase tracking-wider text-gold flex items-center gap-1">
                <Sparkles className="h-3 w-3 fill-gold animate-pulse" />
                {isImpressed ? '🌟 ოთარა აღფრთოვანებულია!' : '🤝 ოთარას შეფასება'}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-extrabold text-white">
              {isImpressed
                ? `„საოცარია! შენ ზუსტად გაიმეორე ჩემი უმოკლესი გზა ${moves} სვლით! ნამდვილი კინომანი ხარ!“`
                : isWon
                  ? `„ყოჩაღ, მიზნამდე მიხვედი ${moves} სვლით! თუმცა მე ${optimalHops} სვლაში ვიპოვე გზა. შემდეგში აუცილებლად დამაბამ!“`
                  : `„არაუშავს, ყველაზე დიდ რეჟისორებსაც ჭირდებათ რამდენიმე დუბლი! აი ჩემი უმოკლესი გზა:“`}
            </h3>

            <p className="text-xs text-cinema-muted">
              შენი სვლები: <strong className="text-white">{moves}</strong> | ოთარას ნიშნული: <strong className="text-gold">{optimalHops} სვლა</strong>
            </p>
          </div>

          {onOpenSummary && (
            <button
              onClick={onOpenSummary}
              className="shrink-0 flex items-center gap-1.5 rounded-xl border border-gold/50 bg-gold/15 px-3.5 py-2 text-xs font-bold text-gold hover:bg-gold hover:text-cinema-black transition active:scale-95 shadow-sm"
            >
              <Trophy className="h-4 w-4" />
              <span>შედეგის ნახვა</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Active Gameplay HUD Banner: Otara is observing the player live
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-cinema-border/70 bg-cinema-surface/60 px-4 py-2.5 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-gold/60 bg-cinema-black animate-otara-glow">
          <img
            src="/assets/otara/otara-avatar.jpg"
            alt="Otara Avatar"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-white">ოთარა გაკვირდება</span>
            <span className="rounded-full bg-gold/15 border border-gold/30 px-1.5 py-0.2 text-[9px] font-bold text-gold">
              ORACLE
            </span>
          </div>
          <p className="text-[11px] text-cinema-muted">
            {moves === 0
              ? `ოთარას უმოკლესი გზა ${optimalHops} სვლაა. აირჩიე პირველი ფილმი!`
              : moves < optimalHops
                ? `შესანიშნავია! ${moves} სვლა გაქვს, ჯერჯერობით ოთარას ტემპში ხარ.`
                : moves === optimalHops
                  ? `შემდეგი სწორი სვლით ოთარას რეკორდს გაუთანაბრდები!`
                  : `ოთარას გზა ${optimalHops} სვლა იყო. მიზნამდე მაინც შეგიძლია მისვლა!`}
          </p>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-center">
          <span className="text-[9px] uppercase tracking-wider text-amber-400 block font-semibold">ოთარას სამიზნე</span>
          <span className="text-xs font-black text-white">{optimalHops} Hops</span>
        </div>
      </div>
    </div>
  );
}
