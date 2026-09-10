import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types/user';
import { authService, LoginResponse } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<LoginResponse>;
  register: (name: string, email: string, password: string, institution: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  verifyOtp: (challengeId: string, otp: string, tempUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string, role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password, role);
      if (!response.requiresOtp && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, institution: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(name, email, password, institution);
      if (!response.requiresOtp && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (challengeId: string, otp: string, tempUser: User) => {
    setLoading(true);
    setError(null);
    try {
      const verifiedUser = await authService.verifyStudentOtp(challengeId, otp, tempUser);
      setUser(verifiedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP Verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, error, clearError, verifyOtp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
