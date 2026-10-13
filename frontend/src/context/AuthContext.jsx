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
    setStats(getUserStats(loggedUser.id));

    fetchUserProfile(loggedUser.id)
      .then(profile => {
        if (profile && profile.tier === 'PRO') {
          setProStatus(true);
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
