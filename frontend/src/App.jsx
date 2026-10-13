import { useState } from 'react';
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
import { Film } from 'lucide-react';

export default function App() {
  const {
    challenge,
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
    undoLastMove,
    restartGame,
    giveUp
  } = useGameSession();

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-cinema-black text-slate-100">
      <Navbar
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenPro={() => setIsProModalOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="h-12 w-12 rounded-xl border-2 border-gold/40 border-t-gold animate-spin" />
            <p className="text-sm font-medium text-cinema-muted">Loading Hollywood graph...</p>
          </div>
        ) : (
          <>
            <ChallengeHeader
              challenge={challenge}
              moves={moves}
              timerSeconds={timerSeconds}
              onUndo={undoLastMove}
              onGiveUp={giveUp}
              canUndo={chain.length > 1}
              gameStatus={gameStatus}
            />

            <VisualGraph
              chain={chain}
              targetActor={challenge?.targetActor}
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
            />
          </>
        )}
      </main>

      <footer className="mt-auto border-t border-cinema-border/50 bg-cinema-surface/50 py-6 text-center text-xs text-cinema-muted">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Film className="h-3.5 w-3.5 text-gold" />
          <span className="font-semibold text-slate-300">ReelQuest</span>
          <span>— The Cinematic Six Degrees Engine</span>
        </div>
        <p className="text-[11px]">
          Curated with TMDB dataset. Built with React 18, Tailwind CSS & AWS Serverless.
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
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
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
    </div>
  );
}
