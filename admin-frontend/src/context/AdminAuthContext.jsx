import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminSignIn, adminSignOut, getStoredAdminAuth } from '../api/auth';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const stored = getStoredAdminAuth();
    if (stored?.user) {
      setAdminUser(stored.user);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const user = await adminSignIn(email, password);
      setAdminUser(user);
      return user;
    } catch (err) {
      setAuthError(err.message || 'Failed to authenticate admin');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    adminSignOut();
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAdmin: !!adminUser?.isAdmin,
        loading,
        authError,
        login,
        logout
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
