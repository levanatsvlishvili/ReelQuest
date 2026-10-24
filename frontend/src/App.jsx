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
import { UserProfileModal } from './components/UserProfileModal';
import { GameModeSelector } from './components/GameModeSelector';
import { UpcomingGamePreview } from './components/UpcomingGamePreview';
import { DailyDateNavigator } from './components/DailyDateNavigator';
import { DailyArchiveModal } from './components/DailyArchiveModal';
import { CustomPathFinder } from './components/CustomPathFinder';
import { LeaderboardView } from './components/LeaderboardView';
import { OtaraChallengeCard } from './components/OtaraChallengeCard';
import { DuelGameView } from './components/DuelGameView';
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
    openVictoryModal
  } = useGameSession();

  const [currentView, setCurrentView] = useState('game'); // 'game' | 'leaderboard'
  const [activeMode, setActiveMode] = useState('six-degrees');
  const [isDuelMode, setIsDuelMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('duel')) {
      setActiveMode('six-degrees');
      setIsDuelMode(true);
    }
  }, []);

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-cinema-black text-slate-100">
      <Navbar
        onOpenLeaderboard={() => setCurrentView(currentView === 'leaderboard' ? 'game' : 'leaderboard')}
        isLeaderboardActive={currentView === 'leaderboard'}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenPro={() => setIsProModalOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {currentView === 'leaderboard' ? (
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

      <footer className="mt-auto border-t border-cinema-border/50 bg-cinema-surface/50 py-6 text-center text-xs text-cinema-muted">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Film className="h-3.5 w-3.5 text-gold" />
          <span className="font-semibold text-slate-300">ReelQuest</span>
          <span>— The Hollywood Cinema Oracle • Beat Otara</span>
        </div>
        <p className="text-[11px]">
          The ultimate movie connection trivia game. Powered by TMDB.
        </p>
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

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenPro={() => setIsProModalOpen(true)}
      />

      <DailyArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        currentDate={activeDate}
        onSelectDate={(targetDate) => loadDateChallenge(targetDate)}
      />
    </div>
  );
}
