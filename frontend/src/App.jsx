import { useState, useEffect } from 'react';
import { useGameSession } from './hooks/useGameSession';
import { Navbar } from './components/Navbar';
import { ChallengeHeader } from './components/ChallengeHeader';
import { ChainBuilder } from './components/ChainBuilder';
import { VictoryModal } from './components/VictoryModal';
import { LeaderboardDrawer } from './components/LeaderboardDrawer';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ProSubscriptionModal } from './components/ProSubscriptionModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileView } from './components/UserProfileView';
import { DailyHubView } from './components/DailyHubView';
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
import { CheckoutSuccessModal } from './components/CheckoutSuccessModal';
import { useAuth } from './context/AuthContext';
import { confirmPaymentOrder } from './api/auth';
import { syncLocalScoresToBackend } from './api/leaderboardService';
import { activateSubscriptionWithCard } from './utils/billingService';

function parseRouteFromLocation() {
  if (typeof window === 'undefined') {
    return { view: 'hub', mode: 'six-degrees', duel: false, profileTab: 'overview', targetUserId: null };
  }
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const search = new URLSearchParams(window.location.search);

  if (path === '/leaderboard') {
    return { view: 'leaderboard', mode: 'six-degrees', duel: false, profileTab: 'overview', targetUserId: null };
  }
  if (path === '/profile') {
    return { view: 'profile', mode: 'six-degrees', duel: false, profileTab: 'overview', targetUserId: search.get('user') || null };
  }
  if (path === '/billing' || path === '/profile/billing') {
    return { view: 'profile', mode: 'six-degrees', duel: false, profileTab: 'billing', targetUserId: null };
  }
  if (path === '/beat-otara' || path === '/six-degrees') {
    return { view: 'game', mode: 'six-degrees', duel: false, profileTab: 'overview', targetUserId: null };
  }
  if (path === '/spotle') {
    return { view: 'game', mode: 'spotle', duel: false, profileTab: 'overview', targetUserId: null };
  }
  if (path === '/frame-sleuth') {
    return { view: 'game', mode: 'frame-sleuth', duel: false, profileTab: 'overview', targetUserId: null };
  }
  if (path === '/box-office') {
    return { view: 'game', mode: 'box-office', duel: false, profileTab: 'overview', targetUserId: null };
  }
  if (path === '/path-finder') {
    return { view: 'game', mode: 'custom-path', duel: false, profileTab: 'overview', targetUserId: null };
  }
  if (path === '/duel' || search.get('duel')) {
    return { view: 'game', mode: 'six-degrees', duel: true, profileTab: 'overview', targetUserId: null };
  }
  return { view: 'hub', mode: 'six-degrees', duel: false, profileTab: 'overview', targetUserId: null };
}

function isModifiedClick(e) {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

export default function App() {
  const {
    challenge,
    activeDate,
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

  const initialRoute = parseRouteFromLocation();
  const { user, setProStatus } = useAuth();
  const [currentView, setCurrentView] = useState(initialRoute.view);
  const [profileUser, setProfileUser] = useState(() =>
    initialRoute.targetUserId ? { id: initialRoute.targetUserId } : null
  );
  const [profileTabRequest, setProfileTabRequest] = useState({ tab: initialRoute.profileTab, seq: 0 });
  const [activeMode, setActiveMode] = useState(initialRoute.mode);
  const [isDuelMode, setIsDuelMode] = useState(initialRoute.duel);
  const [checkoutSuccessNotice, setCheckoutSuccessNotice] = useState(null);

  useEffect(() => {
    if (user?.id) {
      syncLocalScoresToBackend(user);
    }
  }, [user?.id]);

  useEffect(() => {
    const handlePopState = () => {
      const next = parseRouteFromLocation();
      setCurrentView(next.view);
      setActiveMode(next.mode);
      setIsDuelMode(next.duel);
      setProfileUser(next.targetUserId ? { id: next.targetUserId } : null);
      if (next.view === 'profile') {
        setProfileTabRequest((prev) => ({ tab: next.profileTab, seq: prev.seq + 1 }));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const rawPath = window.location.pathname.toLowerCase();
    if (rawPath === '/admin' || rawPath === '/admin/') {
      return;
    }

    let targetPath = '/';
    if (currentView === 'hub') {
      targetPath = '/';
    } else if (currentView === 'leaderboard') {
      targetPath = '/leaderboard';
    } else if (currentView === 'profile') {
      targetPath = profileTabRequest.tab === 'billing' && !profileUser ? '/billing' : '/profile';
    } else if (isDuelMode) {
      targetPath = '/duel';
    } else if (activeMode === 'spotle') {
      targetPath = '/spotle';
    } else if (activeMode === 'frame-sleuth') {
      targetPath = '/frame-sleuth';
    } else if (activeMode === 'box-office') {
      targetPath = '/box-office';
    } else if (activeMode === 'custom-path') {
      targetPath = '/path-finder';
    } else {
      targetPath = '/beat-otara';
    }

    const search = new URLSearchParams(window.location.search);
    const duelId = search.get('duel');
    let querySuffix = '';
    if (isDuelMode && duelId) {
      querySuffix = `?duel=${encodeURIComponent(duelId)}`;
    } else if (currentView === 'profile' && profileUser?.id && profileUser.id !== user?.id) {
      querySuffix = `?user=${encodeURIComponent(profileUser.id)}`;
    }
    const fullTarget = `${targetPath}${querySuffix}`;
    const currentFull = `${window.location.pathname}${window.location.search}`;

    if (currentFull !== fullTarget && !search.has('session_id') && !search.has('order_id')) {
      window.history.pushState(
        { view: currentView, mode: activeMode, duel: isDuelMode, targetUserId: profileUser?.id || null },
        '',
        fullTarget
      );
    }
  }, [currentView, activeMode, isDuelMode, profileTabRequest.tab, profileUser, user?.id]);

  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    const search = new URLSearchParams(window.location.search);
    if (path === '/admin' || path === '/admin/' || search.has('admin')) {
      window.location.replace('/admin/index.html');
      return;
    }

    if (search.get('duel')) {
      setCurrentView('game');
      setActiveMode('six-degrees');
      setIsDuelMode(true);
    }

    const sessionId = search.get('session_id');
    const orderId = search.get('order_id');

    if (sessionId && orderId) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      confirmPaymentOrder(orderId, true)
        .catch(() => {})
        .finally(() => {
          setProStatus(true);
          const userId = user?.id || 'lnats17';
          const userEmail = user?.email || 'lnats17@freeuni.edu.ge';
          activateSubscriptionWithCard(userId, userEmail, {
            brand: 'Visa',
            last4: '4242',
            number: '4242424242424242',
            cardholderName: user?.username || 'Cinephile Member',
            expMonth: 12,
            expYear: 2028,
            isDefault: true
          });
          setCheckoutSuccessNotice({
            orderId,
            sessionId,
            userEmail
          });
        });
    }
  }, [user?.id]);

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isHintOpen, setIsHintOpen] = useState(false);

  const navigateToHub = () => {
    setProfileUser(null);
    setIsDuelMode(false);
    setCurrentView('hub');
  };

  const navigateToGame = (modeId) => {
    setProfileUser(null);
    setActiveMode(modeId);
    setIsDuelMode(false);
    setCurrentView('game');
  };

  const openLeaderboardView = () => {
    setProfileUser(null);
    setCurrentView('leaderboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-cinema-black text-slate-100">
      <Navbar
        currentView={currentView}
        activeMode={activeMode}
        onNavigateHome={navigateToHub}
        onSelectGame={navigateToGame}
        onOpenLeaderboard={() => {
          setProfileUser(null);
          setCurrentView(currentView === 'leaderboard' ? 'hub' : 'leaderboard');
        }}
        isLeaderboardActive={currentView === 'leaderboard'}
        onOpenPro={() => setIsProModalOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => {
          setProfileTabRequest((prev) => ({ tab: 'overview', seq: prev.seq + 1 }));
          setProfileUser(null);
          setCurrentView('profile');
        }}
        onOpenBilling={() => {
          setProfileTabRequest((prev) => ({ tab: 'billing', seq: prev.seq + 1 }));
          setProfileUser(null);
          setCurrentView('profile');
        }}
        isProfileActive={currentView === 'profile' && !profileUser}
      />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 space-y-4">
        {currentView === 'hub' ? (
          <DailyHubView
            challenge={challenge}
            onSelectGame={navigateToGame}
            onOpenDuel={() => {
              setActiveMode('six-degrees');
              setIsDuelMode(true);
              setCurrentView('game');
            }}
            onOpenPathFinder={() => navigateToGame('custom-path')}
            onOpenLeaderboard={openLeaderboardView}
          />
        ) : currentView === 'profile' ? (
          <UserProfileView
            key={profileUser?.id || 'self'}
            targetUser={profileUser}
            initialTabRequest={profileTabRequest}
            onBack={() => {
              const fromLeaderboard = Boolean(profileUser);
              setProfileUser(null);
              setCurrentView(fromLeaderboard ? 'leaderboard' : 'hub');
            }}
            onOpenPro={() => setIsProModalOpen(true)}
          />
        ) : currentView === 'leaderboard' ? (
          <LeaderboardView
            onBackToGame={navigateToHub}
            activeChallenge={challenge}
            activeDate={activeDate}
            onSelectDate={(d) => loadDateChallenge(d)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onPlayChallenge={(d, mode) => {
              if (mode && ['six-degrees', 'spotle', 'frame-sleuth', 'box-office'].includes(mode)) {
                setActiveMode(mode);
                setIsDuelMode(false);
              }
              loadDateChallenge(d);
              setCurrentView('game');
            }}
            onViewUserProfile={(target) => {
              setProfileUser(target);
              setCurrentView('profile');
            }}
          />
        ) : activeMode === 'custom-path' ? (
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
            onSelectGame={navigateToGame}
            onOpenLeaderboard={openLeaderboardView}
          />
        ) : activeMode === 'frame-sleuth' ? (
          <FrameSleuthGameView
            onOpenPro={() => setIsProModalOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onSelectGame={navigateToGame}
            onOpenLeaderboard={openLeaderboardView}
          />
        ) : activeMode === 'box-office' ? (
          <BoxOfficeClashView
            onOpenPro={() => setIsProModalOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onSelectGame={navigateToGame}
            onOpenLeaderboard={openLeaderboardView}
          />
        ) : activeMode !== 'six-degrees' ? (
          <UpcomingGamePreview
            modeId={activeMode}
            onBackToMain={() => navigateToGame('six-degrees')}
            onOpenPro={() => setIsProModalOpen(true)}
          />
        ) : isDuelMode ? (
          <DuelGameView
            onBackToMain={() => setIsDuelMode(false)}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="h-10 w-10 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
            <p className="text-xs font-medium text-cinema-muted">Loading Hollywood graph...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {!isCustom ? (
              <DailyDateNavigator
                currentDate={activeDate}
                onSelectDate={loadDateChallenge}
                onPrevDay={goToPrevDay}
                onNextDay={goToNextDay}
                onOpenArchive={() => setIsArchiveOpen(true)}
                onResetToToday={() => loadDateChallenge(new Date().toISOString().slice(0, 10))}
                onOpenDuel={() => setIsDuelMode(true)}
                onOpenPathFinder={() => navigateToGame('custom-path')}
                onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
              />
            ) : (
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs">
                <span className="font-semibold text-gold">Custom Path Challenge</span>
                <button
                  type="button"
                  onClick={() => loadDateChallenge(new Date().toISOString().slice(0, 10))}
                  className="rounded-lg border border-white/10 bg-cinema-surface px-2.5 py-1 text-slate-200 hover:border-gold/50 hover:text-gold transition"
                >
                  Return to Daily
                </button>
              </div>
            )}

            {gameStatus === 'READY' ? (
              <OtaraChallengeCard
                challenge={challenge}
                gameStatus={gameStatus}
                moves={moves}
                onStart={startGame}
                onOpenDuel={() => setIsDuelMode(true)}
                onSelectGame={navigateToGame}
                onOpenLeaderboard={openLeaderboardView}
              />
            ) : (
              <>
                <ChallengeHeader
                  challenge={challenge}
                  chain={chain}
                  moves={moves}
                  timerSeconds={timerSeconds}
                  onUndo={undoLastMove}
                  onStepClick={undoToStep}
                  onGiveUp={giveUp}
                  canUndo={canUndo}
                  gameStatus={gameStatus}
                  onViewSummary={openVictoryModal}
                  onOpenHint={() => setIsHintOpen(true)}
                />

                {gameStatus !== 'PLAYING' && (
                  <OtaraChallengeCard
                    challenge={challenge}
                    gameStatus={gameStatus}
                    moves={moves}
                    onStart={startGame}
                    onOpenSummary={openVictoryModal}
                    onOpenDuel={() => setIsDuelMode(true)}
                    onSelectGame={navigateToGame}
                    onOpenLeaderboard={openLeaderboardView}
                  />
                )}

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
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-white/[0.06] bg-cinema-black py-4 text-[11px] text-slate-500">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span>© 2026 ReelQuest</span>
            <span>•</span>
            <span>Created by <strong className="text-slate-300 font-semibold">Levan Natsvlishvili</strong></span>
            <span>•</span>
            <span>Data by TMDB</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => setIsHowToPlayOpen(true)}
              className="hover:text-slate-200 transition"
            >
              How to Play
            </button>
            <a
              href="/leaderboard"
              onClick={(e) => {
                if (isModifiedClick(e)) return;
                e.preventDefault();
                openLeaderboardView();
              }}
              className="hover:text-slate-200 transition"
            >
              Leaderboard
            </a>
            <button
              type="button"
              onClick={() => setIsProModalOpen(true)}
              className="hover:text-gold transition"
            >
              PRO ($3/mo)
            </button>
            <span>Daily refresh 00:00 UTC</span>
          </div>
        </div>
      </footer>

      <VictoryModal
        isOpen={showVictory}
        onClose={() => setShowVictory(false)}
        gameStatus={gameStatus}
        challenge={challenge}
        moves={moves}
        timerSeconds={timerSeconds}
        optimalPath={optimalPath}
        onRestart={restartGame}
        onOpenLeaderboard={openLeaderboardView}
        onSelectGame={navigateToGame}
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

      <CheckoutSuccessModal
        isOpen={Boolean(checkoutSuccessNotice)}
        onClose={() => setCheckoutSuccessNotice(null)}
        details={checkoutSuccessNotice}
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
