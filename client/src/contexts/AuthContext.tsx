import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types/index.js';
import { authService } from '../services/auth.service.js';
import { LoginFormValues, RegisterFormValues } from '../schemas/auth.schema.js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDonor: boolean;
  login: (data: LoginFormValues) => Promise<User>;
  register: (data: RegisterFormValues) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch {
      try {
        localStorage.removeItem('auth_token');
      } catch {
        // Ignore
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (data: LoginFormValues): Promise<User> => {
    setIsLoading(true);
    try {
      const authResult = await authService.login(data);
      if (authResult.token) {
        try {
          localStorage.setItem('auth_token', authResult.token);
        } catch {
          // Ignore
        }
      }

      // Fetch fresh full user profile with eligibility
      let fullUser = authResult.user;
      try {
        fullUser = await authService.getMe();
      } catch {
        // Use user object from login payload if getMe has transient delay
      }

      setUser(fullUser);
      return fullUser;
    } catch (error) {
      try {
        localStorage.removeItem('auth_token');
      } catch {
        // Ignore
      }
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterFormValues): Promise<User> => {
    setIsLoading(true);
    try {
      const authResult = await authService.register(data);
      if (authResult.token) {
        try {
          localStorage.setItem('auth_token', authResult.token);
        } catch {
          // Ignore
        }
      }

      let fullUser = authResult.user;
      try {
        fullUser = await authService.getMe();
      } catch {
        // Use user object from register payload
      }

      setUser(fullUser);
      return fullUser;
    } catch (error) {
      try {
        localStorage.removeItem('auth_token');
      } catch {
        // Ignore
      }
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      try {
        localStorage.removeItem('auth_token');
      } catch {
        // Ignore
      }
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isDonor: user?.role === 'DONOR',
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
