import { createContext, useContext, useState, useEffect } from 'react';
import {
  signIn,
  signUp,
  confirmSignUp,
  signOut,
  getStoredAuth,
  getUserStats,
  recordGameResult,
  fetchUserProfile
} from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored?.user) {
      setUser(stored.user);
      setStats(getUserStats(stored.user.id));

      fetchUserProfile(stored.user.id)
        .then(profile => {
          if (profile) {
            const isPro = profile.tier === 'PRO';
            if (isPro !== stored.user.isPro) {
              const updatedUser = { ...stored.user, isPro };
              setUser(updatedUser);
              const authData = getStoredAuth();
              if (authData) {
                authData.user = updatedUser;
                localStorage.setItem('reelquest_auth', JSON.stringify(authData));
              }
            }
            setStats(prev => {
              const localStreak = prev?.streak ?? 0;
              const profileStreak = profile.streak ?? 0;
              return {
                ...prev,
                streak: Math.max(localStreak, profileStreak),
                gamesPlayed: profile.gamesPlayed ?? prev?.gamesPlayed ?? 0,
                gamesWon: profile.gamesWon ?? prev?.gamesWon ?? 0,
                bestHops: profile.bestHops ?? prev?.bestHops ?? 0,
                totalScore: profile.totalScore ?? prev?.totalScore ?? 0
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
    setUser(loggedUser);
    const initialStats = getUserStats(loggedUser.id);
    setStats(initialStats);

    fetchUserProfile(loggedUser.id)
      .then(profile => {
        if (profile) {
          if (profile.tier === 'PRO') {
            setProStatus(true);
          }
          setStats({
            streak: Math.max(initialStats.streak || 0, profile.streak || 0),
            gamesPlayed: typeof profile.gamesPlayed === 'number' ? profile.gamesPlayed : (initialStats.gamesPlayed || 0),
            gamesWon: typeof profile.gamesWon === 'number' ? profile.gamesWon : (initialStats.gamesWon || 0),
            bestHops: typeof profile.bestHops === 'number' ? profile.bestHops : (initialStats.bestHops || 0),
            totalScore: typeof profile.totalScore === 'number' ? profile.totalScore : (initialStats.totalScore || 0),
            dailyWins: initialStats.dailyWins || [],
            history: initialStats.history || []
          });
        }
      })
      .catch(() => {});

    return loggedUser;
  };

  const register = async (email, password, username) => {
    return await signUp(email, password, username);
  };

  const confirm = async (email, code) => {
    return await confirmSignUp(email, code);
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
        setProStatus
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
