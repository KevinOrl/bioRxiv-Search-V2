// This file defines the authentication context for the React application.
import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);


export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

// These features will be fully implemented when connected to Firebase
  const login = async (email, password) => {
    const { data } = await services.auth.login({ email, password });
    localStorage.setItem('token', data.token);
    setCurrentUser(data.user);
  };

  const register = async (email, password, displayName) => {
    const { data } = await services.auth.register({ email, password, displayName });
    localStorage.setItem('token', data.token);
    setCurrentUser(data.user);
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const verifyToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await services.auth.verify();
      setCurrentUser(data.user);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyToken();
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};