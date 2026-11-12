import { createContext, useContext, useState, useEffect } from 'react';
import {
  signIn,
  signUp,
  confirmSignUp,
  signOut,
  getStoredAuth,
  getUserStats,
  recordGameResult,
  fetchUserProfile,
  syncUserProfile,
  hasActiveLocalPro
} from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored?.user) {
      let fullUser = stored.user;
      try {
        const metaKey = `reelquest_user_meta_${stored.user.id}`;
        const meta = JSON.parse(localStorage.getItem(metaKey) || '{}');
        const initialPro = Boolean(stored.user.isPro || meta.isPro || hasActiveLocalPro(stored.user.id));
        fullUser = { ...stored.user, ...meta, isPro: initialPro };
      } catch {
        fullUser = stored.user;
      }
      setUser(fullUser);
      setStats(getUserStats(stored.user.id));

      fetchUserProfile(stored.user.id)
        .then(profile => {
          if (profile) {
            const remotePro = profile.tier === 'PRO';
            const localPro = Boolean(fullUser.isPro || hasActiveLocalPro(stored.user.id));
            const effectivePro = remotePro || localPro;

            if (effectivePro !== fullUser.isPro) {
              const updatedUser = { ...fullUser, isPro: effectivePro };
              setUser(updatedUser);
              const authData = getStoredAuth();
              if (authData) {
                authData.user = updatedUser;
                localStorage.setItem('reelquest_auth', JSON.stringify(authData));
              }
            }
            if (localPro && !remotePro) {
              syncUserProfile({ ...fullUser, isPro: true });
            }
            setStats(prev => {
              const localStreak = prev?.streak ?? 0;
              let profileStreak = profile.streak ?? 0;
              if (profile.lastCompletedDate) {
                const today = new Date().toISOString().slice(0, 10);
                const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                if (profile.lastCompletedDate !== today && profile.lastCompletedDate !== yesterday) {
                  profileStreak = 0;
                }
              }
              const activeStreak = localStreak > 0 ? localStreak : profileStreak;
              return {
                ...prev,
                streak: activeStreak,
                longestStreak: Math.max(prev?.longestStreak || 0, profile.longestStreak || 0, activeStreak),
                gamesPlayed: Math.max(prev?.gamesPlayed ?? 0, profile.gamesPlayed ?? 0),
                gamesWon: Math.max(prev?.gamesWon ?? 0, profile.gamesWon ?? 0),
                bestHops: profile.bestHops ?? prev?.bestHops ?? 0,
                totalScore: Math.max(prev?.totalScore ?? 0, profile.totalScore ?? 0)
              };
            });
          }
        })
        .catch(() => {});
    } else {
      setStats(getUserStats('guest'));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const loggedUser = await signIn(email, password);
    let fullUser = loggedUser;
    try {
      const confirmedKey = `reelquest_confirmed_meta_${email.toLowerCase()}`;
      const confirmedMeta = JSON.parse(localStorage.getItem(confirmedKey) || '{}');
      const metaKey = `reelquest_user_meta_${loggedUser.id}`;
      const existingMeta = JSON.parse(localStorage.getItem(metaKey) || '{}');
      const mergedMeta = { ...existingMeta, ...confirmedMeta };
      if (Object.keys(mergedMeta).length > 0) {
        localStorage.setItem(metaKey, JSON.stringify(mergedMeta));
      }
      localStorage.removeItem(confirmedKey);
      const effectivePro = Boolean(loggedUser.isPro || mergedMeta.isPro || hasActiveLocalPro(loggedUser.id));
      fullUser = { ...loggedUser, ...mergedMeta, isPro: effectivePro };
    } catch {
      fullUser = loggedUser;
    }
    setUser(fullUser);
    const initialStats = getUserStats(loggedUser.id);
    setStats(initialStats);

    fetchUserProfile(loggedUser.id)
      .then(profile => {
        if (profile) {
          if (profile.tier === 'PRO' || fullUser.isPro || hasActiveLocalPro(loggedUser.id)) {
            setProStatus(true);
          }
          let profileStreak = profile.streak ?? 0;
          if (profile.lastCompletedDate) {
            const today = new Date().toISOString().slice(0, 10);
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            if (profile.lastCompletedDate !== today && profile.lastCompletedDate !== yesterday) {
              profileStreak = 0;
            }
          }
          const activeStreak = (initialStats.streak || 0) > 0 ? initialStats.streak : profileStreak;
          setStats({
            ...initialStats,
            streak: activeStreak,
            longestStreak: Math.max(initialStats.longestStreak || 0, profile.longestStreak || 0, activeStreak),
            gamesPlayed: Math.max(initialStats.gamesPlayed || 0, typeof profile.gamesPlayed === 'number' ? profile.gamesPlayed : 0),
            gamesWon: Math.max(initialStats.gamesWon || 0, typeof profile.gamesWon === 'number' ? profile.gamesWon : 0),
            bestHops: typeof profile.bestHops === 'number' && profile.bestHops > 0 ? profile.bestHops : (initialStats.bestHops || 0),
            totalScore: Math.max(initialStats.totalScore || 0, typeof profile.totalScore === 'number' ? profile.totalScore : 0),
            dailyWins: initialStats.dailyWins || [],
            history: initialStats.history || []
          });
        }
      })
      .catch(() => {});

    return fullUser;
  };

  const register = async (email, password, username, meta = {}) => {
    const res = await signUp(email, password, username);
    try {
      if (meta && Object.keys(meta).length > 0) {
        localStorage.setItem(`reelquest_pending_meta_${email.toLowerCase()}`, JSON.stringify(meta));
      }
    } catch (e) {
      console.error('Failed to stash pending meta:', e);
    }
    return res;
  };

  const confirm = async (email, code) => {
    const res = await confirmSignUp(email, code);
    try {
      const pendingKey = `reelquest_pending_meta_${email.toLowerCase()}`;
      const pendingMeta = JSON.parse(localStorage.getItem(pendingKey) || '{}');
      if (pendingMeta && Object.keys(pendingMeta).length > 0) {
        localStorage.setItem(`reelquest_confirmed_meta_${email.toLowerCase()}`, JSON.stringify(pendingMeta));
        localStorage.removeItem(pendingKey);
      }
    } catch (e) {
      console.error('Failed to move confirmed meta:', e);
    }
    return res;
  };

  const setProStatus = (isPro) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, isPro };
      const authData = getStoredAuth();
      if (authData) {
        authData.user = updated;
        localStorage.setItem('reelquest_auth', JSON.stringify(authData));
      }
      try {
        const metaKey = `reelquest_user_meta_${prev.id}`;
        const existingMeta = JSON.parse(localStorage.getItem(metaKey) || '{}');
        localStorage.setItem(metaKey, JSON.stringify({ ...existingMeta, isPro }));
      } catch {}
      syncUserProfile(updated);
      return updated;
    });
  };

  const updateUserProfile = (updates) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      const authData = getStoredAuth();
      if (authData) {
        authData.user = updated;
        localStorage.setItem('reelquest_auth', JSON.stringify(authData));
      }
      try {
        const metaKey = `reelquest_user_meta_${prev.id}`;
        const existingMeta = JSON.parse(localStorage.getItem(metaKey) || '{}');
        localStorage.setItem(metaKey, JSON.stringify({ ...existingMeta, ...updates }));
      } catch (err) {
        console.error('Failed to persist user profile metadata:', err);
      }
      return updated;
    });
  };

  const logout = () => {
    signOut();
    setUser(null);
    setStats(getUserStats('guest'));
  };

  const recordGame = (result) => {
    const updated = recordGameResult(user?.id, result);
    setStats(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        confirm,
        logout,
        recordGame,
        setProStatus,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
