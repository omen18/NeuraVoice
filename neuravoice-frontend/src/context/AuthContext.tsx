import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthResponse } from "../types";

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (tokenData: AuthResponse) => void;
  logout: () => void;
  isLoggedIn: boolean;
  loading: boolean;
  getUserStorage?: (key: string) => string | null;
  setUserStorage?: (key: string, value: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("cog_jwt");
      const savedUser = localStorage.getItem("cog_user");

      if (savedToken && savedUser) {
        const parsedUser: User = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Error restoring auth state:", error);
      // Clear corrupted data
      localStorage.removeItem("cog_jwt");
      localStorage.removeItem("cog_user");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (tokenData: AuthResponse) => {
    try {
      if (!tokenData || !tokenData.access_token) {
        throw new Error("Invalid token data");
      }

      const userData: User = {
        id: tokenData.user_id || tokenData.user?.id,
        name: tokenData.name || tokenData.user?.name || "Yash Raj Sharan",
        email: tokenData.email || tokenData.user?.email || "user@neuravoice.app",
        dob: tokenData.user?.dob,
        cognitive_age: tokenData.user?.cognitive_age,
      };

      localStorage.setItem("cog_jwt", tokenData.access_token);
      localStorage.setItem("cog_user", JSON.stringify(userData));
      setToken(tokenData.access_token);
      setUser(userData);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("cog_jwt");
      localStorage.removeItem("cog_user");
      localStorage.removeItem("cog_last_session");
      localStorage.removeItem("cog_last_result_tier");
    } catch (error) {
      console.error("Logout error:", error);
    }
    setToken(null);
    setUser(null);
  };

  const getUserStorage = (key: string): string | null => {
    if (!user?.id) return localStorage.getItem(`cog_${key}`);
    return localStorage.getItem(`cog_${user.id}_${key}`) || localStorage.getItem(`cog_${key}`);
  };

  const setUserStorage = (key: string, value: string) => {
    if (!user?.id) {
      localStorage.setItem(`cog_${key}`, value);
    } else {
      localStorage.setItem(`cog_${user.id}_${key}`, value);
      localStorage.setItem(`cog_${key}`, value);
    }
  };

  const isLoggedIn = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoggedIn,
        loading,
        getUserStorage,
        setUserStorage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export default AuthContext;
