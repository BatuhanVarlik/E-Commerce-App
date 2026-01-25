import Cookies from "js-cookie";

interface UserData {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Cookie helper fonksiyonları
export const cookieStorage = {
  // Token işlemleri
  setToken: (token: string, expiresInDays: number = 7) => {
    Cookies.set("auth_token", token, {
      expires: expiresInDays,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict",
    });
  },

  getToken: (): string | undefined => {
    return Cookies.get("auth_token");
  },

  removeToken: () => {
    Cookies.remove("auth_token");
  },

  // Kullanıcı bilgileri
  setUser: (user: UserData, expiresInDays: number = 7) => {
    Cookies.set("user_data", JSON.stringify(user), {
      expires: expiresInDays,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  },

  getUser: (): UserData | null => {
    const userData = Cookies.get("user_data");
    return userData ? (JSON.parse(userData) as UserData) : null;
  },

  removeUser: () => {
    Cookies.remove("user_data");
  },

  // Tüm auth verilerini temizle
  clearAuth: () => {
    Cookies.remove("auth_token");
    Cookies.remove("user_data");
  },

  // Genel cookie işlemleri
  set: (
    key: string,
    value: string | number | boolean | object,
    options?: Cookies.CookieAttributes
  ) => {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);
    Cookies.set(key, stringValue, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      ...options,
    });
  },

  get: (key: string): string | object | null => {
    const value = Cookies.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as object;
    } catch {
      return value;
    }
  },

  remove: (key: string) => {
    Cookies.remove(key);
  },

  // Tüm cookie'leri al
  getAll: () => {
    return Cookies.get();
  },
};
