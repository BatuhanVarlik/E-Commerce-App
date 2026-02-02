"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cookieStorage } from "@/lib/cookieStorage";

interface User {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roles?: string[];
  userId?: string;
  profilePhotoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Cookie'den kullanici bilgilerini yukle
    const storedUser = cookieStorage.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    // Token'i cookie'ye kaydet (7 gun gecerli)
    cookieStorage.setToken(userData.token, 7);
    // Kullanici bilgilerini cookie'ye kaydet
    cookieStorage.setUser(userData, 7);
  };

  const logout = () => {
    setUser(null);
    // Tum auth cookie'lerini temizle
    cookieStorage.clearAuth();
    router.push("/login");
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      cookieStorage.setUser(updatedUser, 7);
    }
  };

  const isAuthenticated = !!user;
  const token = user?.token || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
