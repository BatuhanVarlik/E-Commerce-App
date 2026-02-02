"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthContext";

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productPrice: number;
  productStock: number;
  productImageUrl: string;
  brandName: string;
  addedAt: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  loading: boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/api/Wishlist");
      setWishlist(res.data.items || []);
    } catch (error) {
      console.error("Wishlist yuklenmedi:", error);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (productId: string) => {
    if (!user) {
      alert("Favorilere eklemek icin giris yapmalisiniz");
      return;
    }

    try {
      await api.post("/api/Wishlist", { productId });
      await fetchWishlist();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Favorilere eklenemedi:", error);
      alert(err.response?.data?.message || "Favorilere eklenemedi");
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    try {
      await api.delete(`/api/Wishlist/${productId}`);
      await fetchWishlist();
    } catch (error) {
      console.error("Favorilerden kaldirilmadi:", error);
    }
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlist.some((item) => item.productId === productId);
  };

  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        loading,
        wishlistCount: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}
