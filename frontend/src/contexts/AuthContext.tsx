import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { jwtVerify, JWTPayload } from 'jose';
import { useNavigate } from "react-router-dom";

// Types
export type UserRole = "student" | "teacher" | "admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  refreshSession: () => Promise<boolean>;
  updateUser: (updatedUser: Partial<User>) => void;
  isRefreshing: boolean;
  authErrors: Array<{ timestamp: Date; message: string; type: string }>;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const JWT_SECRET = new TextEncoder().encode(
  import.meta.env.VITE_JWT_SECRET || 'your_secret_key'
);

// Axios instance
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
  timeout: 10000,
});

// JWT Payload Interface
interface JwtPayload extends JWTPayload {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  exp: number;
  iat: number;
  type?: string;
  jti?: string;
}

// Token utilities
const validateTokenStructure = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const parts = token.split('.');
    return parts.length === 3 && 
           parts[0].length > 10 && 
           parts[1].length > 10 && 
           parts[2].length > 10;
  } catch {
    return false;
  }
};

const storeTokens = (accessToken: string, refreshToken: string): void => {
  if (!validateTokenStructure(accessToken)) {
    throw new Error('Invalid access token structure');
  }
  if (!validateTokenStructure(refreshToken)) {
    throw new Error('Invalid refresh token structure');
  }
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};

const getAccessToken = (): string | null => {
  const token = localStorage.getItem("accessToken");
  return validateTokenStructure(token) ? token : null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authErrors, setAuthErrors] = useState<Array<{ timestamp: Date; message: string; type: string }>>([]);
  
  // Navigation will be handled by components, not in the context
  // Removed direct useNavigate from context

  const addAuthError = useCallback((message: string, type: string) => {
    setAuthErrors(prev => [...prev, {
      timestamp: new Date(),
      message,
      type
    }].slice(-20));
  }, []);

  const verifyToken = useCallback(async (token: string | null): Promise<JwtPayload | null> => {
    if (!token) return null;

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        algorithms: ['HS256']
      });

      const decoded = payload as JwtPayload;

      if (!decoded.user_id || !decoded.email || !decoded.role) {
        addAuthError('Token missing required fields', 'token_validation');
        return null;
      }

      if (!['student', 'teacher', 'admin'].includes(decoded.role)) {
        addAuthError('Invalid role in token', 'token_validation');
        return null;
      }

      return decoded;
    } catch (error) {
      addAuthError(`Token verification failed: ${error}`, 'token_validation');
      return null;
    }
  }, [addAuthError]);

  const logout = useCallback(async (callApi: boolean = true): Promise<void> => {
    try {
      if (callApi && refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      addAuthError(`Logout API failed: ${error}`, 'auth_logout');
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setError(null);
      // Removed navigation from context
    }
  }, [refreshToken, addAuthError]);

  const handleRefreshToken = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) {
      addAuthError('No refresh token available', 'token_refresh');
      await logout();
      return false;
    }
    
    try {
      setIsRefreshing(true);
      const response = await api.post<{
        accessToken: string;
        user: User;
      }>("/auth/refresh", { refreshToken });

      const { accessToken: newAccessToken, user: userData } = response.data;

      const decoded = await verifyToken(newAccessToken);
      if (!decoded || decoded.type !== 'access') {
        addAuthError('Invalid refreshed token', 'token_refresh');
        throw new Error('Invalid refreshed token');
      }

      if (decoded.user_id !== userData.id || decoded.email !== userData.email) {
        addAuthError('User data mismatch after refresh', 'token_refresh');
        throw new Error('User data mismatch');
      }

      storeTokens(newAccessToken, refreshToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setAccessToken(newAccessToken);
      setUser(userData);
      
      return true;
    } catch (error) {
      addAuthError(`Refresh failed: ${error}`, 'token_refresh');
      await logout();
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshToken, verifyToken, logout, addAuthError]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    return handleRefreshToken();
  }, [handleRefreshToken]);

  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const storedRefreshToken = localStorage.getItem("refreshToken");
      const storedUser = localStorage.getItem("user");

      if (!token) {
        throw new Error('No access token found');
      }

      const decoded = await verifyToken(token);
      if (!decoded || decoded.type !== 'access') {
        throw new Error('Invalid token payload');
      }

      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        throw new Error('Token expired');
      }

      const userData = storedUser 
        ? JSON.parse(storedUser)
        : {
            id: decoded.user_id,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
          };

      if (userData.id !== decoded.user_id || userData.email !== decoded.email) {
        throw new Error('User data mismatch');
      }

      setAccessToken(token);
      setRefreshToken(storedRefreshToken);
      setUser(userData);
    } catch (error) {
      addAuthError(`Init failed: ${error}`, 'auth_init');
      await logout(false);
    } finally {
      setLoading(false);
    }
  }, [verifyToken, logout, addAuthError]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Axios request interceptor
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        if (config.url?.startsWith('/auth')) {
          return config;
        }

        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return config;
        }

        if (refreshToken && !isRefreshing) {
          const success = await refreshSession();
          if (success) {
            const newToken = getAccessToken();
            if (newToken) {
              config.headers.Authorization = `Bearer ${newToken}`;
            }
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [refreshToken, isRefreshing, refreshSession]);

  // Axios response interceptor
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && 
            originalRequest &&
            !originalRequest.url?.includes("/auth/refresh") &&
            !originalRequest.url?.includes("/auth/login") &&
            !isRefreshing) {
          try {
            const success = await refreshSession();
            if (success) {
              const newToken = getAccessToken();
              if (newToken && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
              }
            }
          } catch (refreshError) {
            addAuthError(`Refresh failed in interceptor: ${refreshError}`, 'token_refresh');
            await logout();
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [isRefreshing, refreshSession, logout, addAuthError]);

  // Token monitoring
  useEffect(() => {
    const checkToken = () => {
      const token = getAccessToken();
      if (!token && user) {
        addAuthError('Token missing while authenticated', 'token_monitor');
        logout();
      }
    };
    
    const interval = setInterval(checkToken, 30000);
    return () => clearInterval(interval);
  }, [user, logout, addAuthError]);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>("/auth/login", { email, password });

      const { accessToken, refreshToken, user: userData } = response.data;
      
      if (!validateTokenStructure(accessToken)) {
        throw new Error('Invalid access token received');
      }
      if (!validateTokenStructure(refreshToken)) {
        throw new Error('Invalid refresh token received');
      }

      const decoded = await verifyToken(accessToken);
      if (!decoded || decoded.type !== 'access') {
        throw new Error('Invalid login token');
      }

      if (decoded.user_id !== userData.id || decoded.email !== userData.email) {
        throw new Error('User data mismatch');
      }

      storeTokens(accessToken, refreshToken);
      localStorage.setItem("user", JSON.stringify(userData));
      
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setUser(userData);
      // Removed navigation from context
      return Promise.resolve();
    } catch (error) {
      const err = error as AxiosError<{ error?: string }>;
      const errorMessage = err.response?.data?.error || err.message || "Login failed";
      setError(errorMessage);
      addAuthError(`Login failed: ${errorMessage}`, 'auth_login');
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = 'student'
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await api.post("/auth/register", { name, email, password, role });
      // Removed automatic login after registration
      return Promise.resolve();
    } catch (error) {
      const err = error as AxiosError<{ error?: string }>;
      const errorMessage = err.response?.data?.error || err.message || "Registration failed";
      setError(errorMessage);
      addAuthError(`Registration failed: ${errorMessage}`, 'auth_register');
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = useCallback((updatedUser: Partial<User>): void => {
    if (!user) return;
    
    const newUser = { ...user, ...updatedUser };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  }, [user]);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user && !!accessToken,
    login,
    register,
    logout,
    loading,
    error,
    refreshSession,
    updateUser,
    isRefreshing,
    authErrors,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useProtectedRoute = (requiredRole?: UserRole, redirectPath = "/login") => {
  const { user, isAuthenticated, loading, isRefreshing } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (loading || isRefreshing) return;

    if (!isAuthenticated) {
      navigate(redirectPath);
    } else if (requiredRole && user?.role !== requiredRole) {
      navigate("/unauthorized");
    }
  }, [user, isAuthenticated, loading, requiredRole, isRefreshing, navigate, redirectPath]);

  return { user, loading: loading || isRefreshing };
};