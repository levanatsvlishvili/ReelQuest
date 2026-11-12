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
import { CheckoutSuccessModal } from './components/CheckoutSuccessModal';
import { useAuth } from './context/AuthContext';
import { confirmPaymentOrder } from './api/auth';
import { activateSubscriptionWithCard } from './utils/billingService';

function parseRouteFromLocation() {
  if (typeof window === 'undefined') {
    return { view: 'game', mode: 'six-degrees', duel: false, profileTab: 'overview' };
  }
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const search = new URLSearchParams(window.location.search);

  if (path === '/leaderboard') {
    return { view: 'leaderboard', mode: 'six-degrees', duel: false, profileTab: 'overview' };
  }
  if (path === '/profile') {
    return { view: 'profile', mode: 'six-degrees', duel: false, profileTab: 'overview' };
  }
  if (path === '/billing' || path === '/profile/billing') {
    return { view: 'profile', mode: 'six-degrees', duel: false, profileTab: 'billing' };
  }
  if (path === '/spotle') {
    return { view: 'game', mode: 'spotle', duel: false, profileTab: 'overview' };
  }
  if (path === '/frame-sleuth') {
    return { view: 'game', mode: 'frame-sleuth', duel: false, profileTab: 'overview' };
  }
  if (path === '/box-office') {
    return { view: 'game', mode: 'box-office', duel: false, profileTab: 'overview' };
  }
  if (path === '/path-finder') {
    return { view: 'game', mode: 'custom-path', duel: false, profileTab: 'overview' };
  }
  if (path === '/duel' || search.get('duel')) {
    return { view: 'game', mode: 'six-degrees', duel: true, profileTab: 'overview' };
  }
  return { view: 'game', mode: 'six-degrees', duel: false, profileTab: 'overview' };
}

function isModifiedClick(e) {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

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

  const initialRoute = parseRouteFromLocation();
  const { user, setProStatus } = useAuth();
  const [currentView, setCurrentView] = useState(initialRoute.view);
  const [profileUser, setProfileUser] = useState(null);
  const [profileTabRequest, setProfileTabRequest] = useState({ tab: initialRoute.profileTab, seq: 0 });
  const [activeMode, setActiveMode] = useState(initialRoute.mode);
  const [isDuelMode, setIsDuelMode] = useState(initialRoute.duel);
  const [checkoutSuccessNotice, setCheckoutSuccessNotice] = useState(null);

  useEffect(() => {
    const handlePopState = () => {
      const next = parseRouteFromLocation();
      setCurrentView(next.view);
      setActiveMode(next.mode);
      setIsDuelMode(next.duel);
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
    if (currentView === 'leaderboard') {
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
    }

    const search = new URLSearchParams(window.location.search);
    const duelId = search.get('duel');
    const querySuffix = isDuelMode && duelId ? `?duel=${encodeURIComponent(duelId)}` : '';
    const fullTarget = `${targetPath}${querySuffix}`;
    const currentFull = `${window.location.pathname}${window.location.search}`;

    if (currentFull !== fullTarget && !search.has('session_id') && !search.has('order_id')) {
      window.history.pushState({ view: currentView, mode: activeMode, duel: isDuelMode }, '', fullTarget);
    }
  }, [currentView, activeMode, isDuelMode, profileTabRequest.tab, profileUser]);

  useEffect(() => {
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

  const navigateToMainHome = () => {
    setProfileUser(null);
    setActiveMode('six-degrees');
    setIsDuelMode(false);
    setCurrentView('game');
  };

  return (
    <div className="min-h-screen flex flex-col bg-cinema-black text-slate-100">
      <Navbar
        currentView={currentView}
        onNavigateHome={navigateToMainHome}
        onOpenLeaderboard={() => {
          setProfileUser(null);
          setCurrentView(currentView === 'leaderboard' ? 'game' : 'leaderboard');
        }}
        isLeaderboardActive={currentView === 'leaderboard'}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
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

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-5">
        {currentView === 'profile' ? (
          <UserProfileView
            key={profileUser?.id || 'self'}
            targetUser={profileUser}
            initialTabRequest={profileTabRequest}
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
        ) : (
          <>
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

                {gameStatus === 'READY' ? (
                  <OtaraChallengeCard
                    challenge={challenge}
                    gameStatus={gameStatus}
                    moves={moves}
                    timerSeconds={timerSeconds}
                    onStart={startGame}
                    onOpenDuel={() => setIsDuelMode(true)}
                  />
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

                    {gameStatus !== 'PLAYING' && (
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
                    )}

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

      <footer className="mt-auto border-t border-cinema-border/70 bg-gradient-to-b from-cinema-card/90 via-cinema-surface to-cinema-black pt-10 pb-8 text-xs text-cinema-muted">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <a
                href="/"
                onClick={(e) => {
                  if (isModifiedClick(e)) return;
                  e.preventDefault();
                  navigateToMainHome();
                }}
                className="inline-flex items-center gap-3 cursor-pointer select-none text-left focus:outline-none group"
              >
                <div className="relative">
                  <img
                    src="/favicon.svg"
                    alt="ReelQuest Logo"
                    className="h-10 w-10 rounded-xl shadow-gold-glow transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gold/20 blur-md -z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Reel<span className="text-gold">Quest</span>
                </span>
              </a>
              <p className="text-xs text-cinema-muted leading-relaxed">
                Daily cinema trivia and interactive movie games for film lovers.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Games
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="/"
                    onClick={(e) => {
                      if (isModifiedClick(e)) return;
                      e.preventDefault();
                      setActiveMode('six-degrees');
                      setIsDuelMode(false);
                      setCurrentView('game');
                    }}
                    className="hover:text-gold transition text-left inline-block"
                  >
                    Beat Otara
                  </a>
                </li>
                <li>
                  <a
                    href="/spotle"
                    onClick={(e) => {
                      if (isModifiedClick(e)) return;
                      e.preventDefault();
                      setActiveMode('spotle');
                      setIsDuelMode(false);
                      setCurrentView('game');
                    }}
                    className="hover:text-gold transition text-left inline-block"
                  >
                    Spotle
                  </a>
                </li>
                <li>
                  <a
                    href="/frame-sleuth"
                    onClick={(e) => {
                      if (isModifiedClick(e)) return;
                      e.preventDefault();
                      setActiveMode('frame-sleuth');
                      setIsDuelMode(false);
                      setCurrentView('game');
                    }}
                    className="hover:text-gold transition text-left inline-block"
                  >
                    Frame Sleuth
                  </a>
                </li>
                <li>
                  <a
                    href="/box-office"
                    onClick={(e) => {
                      if (isModifiedClick(e)) return;
                      e.preventDefault();
                      setActiveMode('box-office');
                      setIsDuelMode(false);
                      setCurrentView('game');
                    }}
                    className="hover:text-gold transition text-left inline-block"
                  >
                    Box Office Clash
                  </a>
                </li>
              </ul>
            </div>

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
                  <a
                    href="/leaderboard"
                    onClick={(e) => {
                      if (isModifiedClick(e)) return;
                      e.preventDefault();
                      setCurrentView('leaderboard');
                    }}
                    className="hover:text-gold transition text-left inline-block"
                  >
                    Leaderboard &amp; Rankings
                  </a>
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
                  <a
                    href="/"
                    onClick={(e) => {
                      if (isModifiedClick(e)) return;
                      e.preventDefault();
                      setActiveMode('six-degrees');
                      setIsDuelMode(false);
                      setCurrentView('game');
                      setIsArchiveOpen(true);
                    }}
                    className="hover:text-gold transition text-left inline-block"
                  >
                    Daily Challenge Archive
                  </a>
                </li>
              </ul>
            </div>

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
