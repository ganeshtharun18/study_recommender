import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { jwtVerify, JWTPayload } from 'jose';

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
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configuration - Must match your Flask backend's SECRET_KEY exactly
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const JWT_SECRET = new TextEncoder().encode(
  import.meta.env.VITE_JWT_SECRET || 'your_secret_key' // Must match Flask SECRET_KEY
);

// Axios instance
const api = axios.create({
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enhanced token verification
  const verifyToken = useCallback(async (token: string | null): Promise<JwtPayload | null> => {
    if (!token) return null;

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        algorithms: ['HS256'] // Must match backend algorithm
      });

      const decoded = payload as JwtPayload;

      // Validate required fields
      if (!decoded.user_id || !decoded.email || !decoded.role) {
        console.error('Token missing required fields');
        return null;
      }

      // Validate role
      if (!['student', 'teacher', 'admin'].includes(decoded.role)) {
        console.error('Invalid role in token');
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }, []);

  // Handle token refresh
  const handleRefreshToken = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) {
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
        throw new Error('Invalid refreshed token');
      }

      // Validate user data matches token
      if (decoded.user_id !== userData.id || decoded.email !== userData.email) {
        throw new Error('User data mismatch');
      }

      localStorage.setItem("accessToken", newAccessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setAccessToken(newAccessToken);
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error("Refresh token failed:", error);
      await logout();
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshToken, verifyToken]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    return handleRefreshToken();
  }, [handleRefreshToken]);

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      const storedAccessToken = localStorage.getItem("accessToken");
      const storedRefreshToken = localStorage.getItem("refreshToken");
      const storedUser = localStorage.getItem("user");

      if (storedAccessToken) {
        const decoded = await verifyToken(storedAccessToken);
        
        if (!decoded || decoded.type !== 'access') {
          throw new Error('Invalid stored token');
        }

        const userData = storedUser 
          ? JSON.parse(storedUser) 
          : {
              id: decoded.user_id,
              name: decoded.name,
              email: decoded.email,
              role: decoded.role,
            };

        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setUser(userData);
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      await logout(false);
    } finally {
      setLoading(false);
    }
  }, [verifyToken]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Logout function
  const logout = useCallback(async (callApi: boolean = true): Promise<void> => {
    try {
      if (callApi && refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setError(null);
    }
  }, [refreshToken]);

  // Axios request interceptor
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        if (config.url?.startsWith('/auth')) {
          return config;
        }

        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
          return config;
        }

        if (refreshToken && !isRefreshing) {
          const success = await refreshSession();
          if (success && accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [accessToken, refreshToken, isRefreshing, refreshSession]);

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
            if (success && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            await logout();
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, isRefreshing, refreshSession, logout]);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>("/auth/login", { email, password });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: userData } = response.data;
      
      const decoded = await verifyToken(newAccessToken);
      if (!decoded || decoded.type !== 'access') {
        throw new Error('Invalid login token');
      }

      if (decoded.user_id !== userData.id || decoded.email !== userData.email) {
        throw new Error('User data mismatch');
      }

      localStorage.setItem("accessToken", newAccessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      localStorage.setItem("user", JSON.stringify(userData));
      
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setUser(userData);
    } catch (error) {
      const err = error as AxiosError<{ error?: string }>;
      const errorMessage = err.response?.data?.error || err.message || "Login failed";
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
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
      await login(email, password);
    } catch (error) {
      const err = error as AxiosError<{ error?: string }>;
      const errorMessage = err.response?.data?.error || err.message || "Registration failed";
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update user data
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
  
  useEffect(() => {
    if (loading || isRefreshing) return;

    if (!isAuthenticated) {
      window.location.href = redirectPath;
    } else if (requiredRole && user?.role !== requiredRole) {
      window.location.href = "/unauthorized";
    }
  }, [user, isAuthenticated, loading, requiredRole, isRefreshing, redirectPath]);

  return { user, loading: loading || isRefreshing };
};