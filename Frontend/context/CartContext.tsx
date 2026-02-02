"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { cookieStorage } from "@/lib/cookieStorage";

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
  variantId?: string;
}

interface Cart {
  id: string;
  items: CartItem[];
  appliedCouponCode?: string;
  discountAmount: number;
  subtotal: number;
  totalPrice: number;
}

interface CartContextType {
  cart: Cart | null;
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => Promise<void>;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Generate a random ID for guests if not logged in
  const [guestId, setGuestId] = useState<string>("");

  useEffect(() => {
    let id = cookieStorage.get("guestId");
    if (!id) {
      id = "guest_" + Math.random().toString(36).substr(2, 9);
      cookieStorage.set("guestId", id as string, { expires: 365 }); // 1 yil gecerli
    }
    setGuestId(id as string);
  }, []);

  const getCartId = () => (user ? user.email : guestId);

  const fetchCart = async () => {
    if (!guestId && !user) return;
    const cartId = getCartId();
    try {
      setLoading(true);
      const res = await api.get(`/api/Cart/${cartId}`);
      setCart(res.data);
    } catch (error) {
      console.error("Error fetching cart", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user, guestId]);

  const addToCart = async (item: CartItem) => {
    if (!cart) return;
    const updatedItems = [...cart.items];
    const existingIndex = updatedItems.findIndex(
      (i) => i.productId === item.productId,
    );

    if (existingIndex >= 0) {
      updatedItems[existingIndex].quantity += item.quantity;
    } else {
      updatedItems.push(item);
    }

    await updateCartBackend(updatedItems);
  };

  const removeFromCart = async (productId: string) => {
    if (!cart) return;
    const updatedItems = cart.items.filter((i) => i.productId !== productId);
    await updateCartBackend(updatedItems);
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!cart) return;
    if (quantity <= 0) {
      return removeFromCart(productId);
    }

    const updatedItems = cart.items.map((i) =>
      i.productId === productId ? { ...i, quantity } : i,
    );
    await updateCartBackend(updatedItems);
  };

  const clearCart = async () => {
    const cartId = getCartId();
    await api.delete(`/api/Cart/${cartId}`);
    setCart({
      id: cartId,
      items: [],
      totalPrice: 0,
      subtotal: 0,
      discountAmount: 0,
    });
  };

  const applyCoupon = async (code: string) => {
    if (!cart) return { success: false, message: "Sepet bulunamadi" };

    try {
      const subtotal = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const res = await api.post("/api/Coupon/apply", {
        code,
        cartTotal: subtotal,
      });

      if (res.data.isValid) {
        const updatedCart = {
          ...cart,
          appliedCouponCode: code,
          discountAmount: res.data.discountAmount,
          subtotal,
          totalPrice: subtotal - res.data.discountAmount,
        };

        // Update backend cart with coupon
        await updateCartBackend(cart.items, code, res.data.discountAmount);

        return { success: true, message: res.data.message };
      } else {
        return { success: false, message: res.data.message };
      }
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Kupon uygulanirken hata olustu",
      };
    }
  };

  const removeCoupon = async () => {
    if (!cart) return;

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const updatedCart = {
      ...cart,
      appliedCouponCode: undefined,
      discountAmount: 0,
      subtotal,
      totalPrice: subtotal,
    };

    setCart(updatedCart);
    await updateCartBackend(cart.items);
  };

  const updateCartBackend = async (
    items: CartItem[],
    couponCode?: string,
    discountAmount?: number,
  ) => {
    const cartId = getCartId();
    const newCart = {
      id: cartId,
      items,
      appliedCouponCode: couponCode,
      discountAmount: discountAmount || 0,
    };
    try {
      const res = await api.post("/api/Cart", newCart);
      setCart(res.data);
    } catch (error) {
      console.error("Error updating cart", error);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
