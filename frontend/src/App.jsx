import { useState, useEffect } from 'react';
import { useGameSession } from './hooks/useGameSession';
import { Navbar } from './components/Navbar';
import { ChallengeHeader } from './components/ChallengeHeader';
import { VisualGraph } from './components/VisualGraph';
import { ChainBuilder } from './components/ChainBuilder';
import { VictoryModal } from './components/VictoryModal';
import { LeaderboardDrawer } from './components/LeaderboardDrawer';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ProSubscriptionModal } from './components/ProSubscriptionModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileView } from './components/UserProfileView';
import { GameModeSelector } from './components/GameModeSelector';
import { UpcomingGamePreview } from './components/UpcomingGamePreview';
import { DailyDateNavigator } from './components/DailyDateNavigator';
import { DailyArchiveModal } from './components/DailyArchiveModal';
import { CustomPathFinder } from './components/CustomPathFinder';
import { LeaderboardView } from './components/LeaderboardView';
import { OtaraChallengeCard } from './components/OtaraChallengeCard';
import { DuelGameView } from './components/DuelGameView';
import { OtaraHintModal } from './components/OtaraHintModal';
import { SpotleGameView } from './components/SpotleGameView';
import { FrameSleuthGameView } from './components/FrameSleuthGameView';
import { BoxOfficeClashView } from './components/BoxOfficeClashView';
import { Film, Play } from 'lucide-react';

export default function App() {
  const {
    challenge,
    activeDate,
    isToday,
    isCustom,
    loading,
    currentActor,
    selectedMovie,
    chain,
    moves,
    timerSeconds,
    gameStatus,
    optimalPath,
    availableMovies,
    availableCast,
    moviesLoading,
    castLoading,
    showVictory,
    setShowVictory,
    selectMovie,
    clearSelectedMovie,
    selectActor,
    canUndo,
    undoLastMove,
    undoToStep,
    restartGame,
    giveUp,
    loadDateChallenge,
    loadCustomChallenge,
    goToPrevDay,
    goToNextDay,
    startGame,
    markHintUsed,
    openVictoryModal
  } = useGameSession();

  const [currentView, setCurrentView] = useState('game'); // 'game' | 'leaderboard' | 'profile'
  const [profileUser, setProfileUser] = useState(null); // null = own profile
  const [activeMode, setActiveMode] = useState('six-degrees');
  const [isDuelMode, setIsDuelMode] = useState(false);

  useEffect(() => {
    // Seamless routing to dedicated Admin Portal if /admin or ?admin is accessed
    const path = window.location.pathname.toLowerCase();
    const search = new URLSearchParams(window.location.search);
    if (path === '/admin' || path === '/admin/' || search.has('admin')) {
      window.location.replace('/admin/index.html');
      return;
    }

    if (search.get('duel')) {
      setActiveMode('six-degrees');
      setIsDuelMode(true);
    }
  }, []);

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isHintOpen, setIsHintOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-cinema-black text-slate-100">
      <Navbar
        onOpenLeaderboard={() => {
          setProfileUser(null);
          setCurrentView(currentView === 'leaderboard' ? 'game' : 'leaderboard');
        }}
        isLeaderboardActive={currentView === 'leaderboard'}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenPro={() => setIsProModalOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => {
          if (currentView === 'profile' && !profileUser) {
            setCurrentView('game');
          } else {
            setProfileUser(null);
            setCurrentView('profile');
          }
        }}
        isProfileActive={currentView === 'profile' && !profileUser}
      />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {currentView === 'profile' ? (
          <UserProfileView
            targetUser={profileUser}
            onBack={() => {
              const fromLeaderboard = Boolean(profileUser);
              setProfileUser(null);
              setCurrentView(fromLeaderboard ? 'leaderboard' : 'game');
            }}
            onOpenPro={() => setIsProModalOpen(true)}
          />
        ) : currentView === 'leaderboard' ? (
          <LeaderboardView
            onBackToGame={() => setCurrentView('game')}
            activeChallenge={challenge}
            activeDate={activeDate}
            onSelectDate={(d) => loadDateChallenge(d)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onPlayChallenge={(d) => {
              loadDateChallenge(d);
              setCurrentView('game');
            }}
            onViewUserProfile={(target) => {
              setProfileUser(target);
              setCurrentView('profile');
            }}
          />
        ) : (
          <>
            {/* Game Mode Navigation Tabs */}
            <GameModeSelector
              activeMode={activeMode}
              onSelectMode={(mode) => {
                setActiveMode(mode);
                setIsDuelMode(false);
              }}
            />

            {activeMode === 'custom-path' ? (
              <CustomPathFinder
                onOpenPro={() => setIsProModalOpen(true)}
                onPlayCustomChallenge={(customData) => {
                  loadCustomChallenge(customData);
                  setActiveMode('six-degrees');
                  setIsDuelMode(false);
                }}
              />
            ) : activeMode === 'spotle' ? (
              <SpotleGameView
                onOpenPro={() => setIsProModalOpen(true)}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            ) : activeMode === 'frame-sleuth' ? (
              <FrameSleuthGameView
                onOpenPro={() => setIsProModalOpen(true)}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            ) : activeMode === 'box-office' ? (
              <BoxOfficeClashView
                onOpenPro={() => setIsProModalOpen(true)}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            ) : activeMode !== 'six-degrees' ? (
              <UpcomingGamePreview
                modeId={activeMode}
                onBackToMain={() => setActiveMode('six-degrees')}
                onOpenPro={() => setIsProModalOpen(true)}
              />
            ) : isDuelMode ? (
              <DuelGameView
                onBackToMain={() => setIsDuelMode(false)}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="h-12 w-12 rounded-xl border-2 border-gold/40 border-t-gold animate-spin" />
                <p className="text-sm font-medium text-cinema-muted">Loading Hollywood graph...</p>
              </div>
            ) : (
              <>
                {/* Daily Date & Archive Navigator */}
                {!isCustom && (
                  <DailyDateNavigator
                    currentDate={activeDate}
                    onSelectDate={loadDateChallenge}
                    onPrevDay={goToPrevDay}
                    onNextDay={goToNextDay}
                    onOpenArchive={() => setIsArchiveOpen(true)}
                    onResetToToday={() => loadDateChallenge(new Date().toISOString().slice(0, 10))}
                    onOpenDuel={() => setIsDuelMode(true)}
                    onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
                  />
                )}

                {isCustom && (
                  <div className="flex items-center justify-between rounded-xl border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold">
                    <span>🎮 Custom Challenge Mode</span>
                    <button
                      onClick={() => loadDateChallenge(new Date().toISOString().slice(0, 10))}
                      className="rounded-lg bg-cinema-card border border-cinema-border px-2.5 py-1 text-slate-200 hover:text-gold transition"
                    >
                      Return to Daily Challenge
                    </button>
                  </div>
                )}

                {/* Pre-Game READY State: Otara's Briefing & Start Challenge Button */}
                {gameStatus === 'READY' ? (
                  <div className="space-y-6">
                    <OtaraChallengeCard
                      challenge={challenge}
                      gameStatus={gameStatus}
                      moves={moves}
                      timerSeconds={timerSeconds}
                      onStart={startGame}
                      onOpenDuel={() => setIsDuelMode(true)}
                    />

                    {/* Locked Filmography Teaser */}
                    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-cinema-border/60 bg-cinema-surface/40 backdrop-blur-sm space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold border border-gold/30">
                        <Film className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          Filmography Locked
                        </h3>
                        <p className="mt-1 text-xs text-cinema-muted max-w-md mx-auto">
                          Click "Start Challenge" above to start the timer and reveal {challenge.startActor?.name}'s filmography.
                        </p>
                      </div>
                      <button
                        onClick={startGame}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 px-6 py-2.5 text-xs font-extrabold text-cinema-black shadow-gold-glow hover:opacity-90 transition active:scale-95"
                      >
                        <Play className="h-4 w-4 fill-cinema-black" />
                        <span>Start Challenge</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <ChallengeHeader
                      challenge={challenge}
                      moves={moves}
                      timerSeconds={timerSeconds}
                      onUndo={undoLastMove}
                      onGiveUp={giveUp}
                      canUndo={canUndo}
                      gameStatus={gameStatus}
                      onViewSummary={openVictoryModal}
                      onOpenHint={() => setIsHintOpen(true)}
                    />

                    {/* Otara's Live Coaching / Post-game Reaction */}
                    <OtaraChallengeCard
                      challenge={challenge}
                      gameStatus={gameStatus}
                      moves={moves}
                      timerSeconds={timerSeconds}
                      onStart={startGame}
                      onOpenSummary={openVictoryModal}
                      onOpenDuel={() => setIsDuelMode(true)}
                      onOpenHint={() => setIsHintOpen(true)}
                    />

                    <VisualGraph
                      chain={chain}
                      targetActor={challenge?.targetActor}
                      onStepClick={undoToStep}
                    />

                    <ChainBuilder
                      currentActor={currentActor}
                      selectedMovie={selectedMovie}
                      availableMovies={availableMovies}
                      availableCast={availableCast}
                      moviesLoading={moviesLoading}
                      castLoading={castLoading}
                      targetActor={challenge?.targetActor}
                      onSelectMovie={selectMovie}
                      onClearMovie={clearSelectedMovie}
                      onSelectActor={selectActor}
                      onUndo={undoLastMove}
                      canUndo={canUndo}
                      previousActor={chain.length > 1 ? chain[chain.length - 2].actor : null}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Production-Grade Clean Cinema Footer */}
      <footer className="mt-auto border-t border-cinema-border/70 bg-gradient-to-b from-cinema-card/90 via-cinema-surface to-cinema-black pt-10 pb-8 text-xs text-cinema-muted">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Main Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: Brand & Creator */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/40 shadow-gold-glow">
                  <Film className="h-5 w-5" />
                </div>
                <span className="text-lg font-black tracking-tight text-white">
                  Reel<span className="text-gold">Quest</span>
                </span>
              </div>
              <p className="text-xs text-cinema-muted leading-relaxed">
                Daily cinema trivia and interactive movie games for film lovers.
              </p>
              <div className="pt-1 text-xs text-slate-300">
                Created by <strong className="text-white font-semibold">Levan Natsvlishvili</strong>
              </div>
            </div>

            {/* Column 2: Game Modes */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Games
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => {
                      setActiveMode('six-degrees');
                      setIsDuelMode(false);
                      setCurrentView('game');
                    }}
                    className="hover:text-gold transition text-left"
                  >
                    Beat Otara
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveMode('spotle');
                      setCurrentView('game');
                    }}
                    className="hover:text-gold transition text-left"
                  >
                    Spotle
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveMode('frame-sleuth');
                      setCurrentView('game');
                    }}
                    className="hover:text-gold transition text-left"
                  >
                    Frame Sleuth
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveMode('box-office');
                      setCurrentView('game');
                    }}
                    className="hover:text-gold transition text-left"
                  >
                    Box Office Clash
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Platform Features */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Features
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => setIsHowToPlayOpen(true)}
                    className="hover:text-gold transition text-left"
                  >
                    How to Play
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentView('leaderboard')}
                    className="hover:text-gold transition text-left"
                  >
                    Leaderboard & Rankings
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsProModalOpen(true)}
                    className="hover:text-gold transition text-left"
                  >
                    ReelQuest PRO ($3/mo)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveMode('six-degrees');
                      setIsDuelMode(false);
                      setCurrentView('game');
                      setIsArchiveOpen(true);
                    }}
                    className="hover:text-gold transition text-left"
                  >
                    Daily Challenge Archive
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Cinema Data */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Cinema Data
              </h4>
              <p className="text-[11px] text-cinema-muted leading-relaxed">
                Movie metadata, cast filmographies, and high-resolution stills provided by <strong className="text-slate-200">The Movie Database (TMDB)</strong>.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                <span>Daily challenges refresh at 00:00 UTC</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-cinema-border/60 pt-5 text-[11px]">
            <p className="text-cinema-muted text-center sm:text-left">
              © 2026 ReelQuest. All rights reserved.
            </p>
            <p className="text-slate-300">
              Created by <strong className="text-white">Levan Natsvlishvili</strong>
            </p>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <VictoryModal
        isOpen={showVictory}
        onClose={() => setShowVictory(false)}
        gameStatus={gameStatus}
        challenge={challenge}
        moves={moves}
        timerSeconds={timerSeconds}
        optimalPath={optimalPath}
        onRestart={restartGame}
        onOpenLeaderboard={() => setCurrentView('leaderboard')}
      />

      <LeaderboardDrawer
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        challengeId={challenge?.challengeId}
        onViewUserProfile={(target) => {
          setProfileUser(target);
          setCurrentView('profile');
        }}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      <ProSubscriptionModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <DailyArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        currentDate={activeDate}
        onSelectDate={(targetDate) => loadDateChallenge(targetDate)}
      />

      <OtaraHintModal
        isOpen={isHintOpen}
        onClose={() => setIsHintOpen(false)}
        currentActor={currentActor}
        targetActor={challenge?.targetActor}
        onSelectHintMovie={(hintMovie) => {
          markHintUsed?.();
          selectMovie(hintMovie);
        }}
        onOpenPro={() => setIsProModalOpen(true)}
      />
    </div>
  );
}
