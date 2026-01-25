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
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Cookie'den kullanıcı bilgilerini yükle
    const storedUser = cookieStorage.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    // Token'ı cookie'ye kaydet (7 gün geçerli)
    cookieStorage.setToken(userData.token, 7);
    // Kullanıcı bilgilerini cookie'ye kaydet
    cookieStorage.setUser(userData, 7);
  };

  const logout = () => {
    setUser(null);
    // Tüm auth cookie'lerini temizle
    cookieStorage.clearAuth();
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
