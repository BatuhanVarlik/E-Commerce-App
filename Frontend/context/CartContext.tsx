"use client";

import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface Cart {
  id: string;
  items: CartItem[];
  totalPrice: number;
}

interface CartContextType {
  cart: Cart | null;
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
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
    let id = localStorage.getItem("guestId");
    if (!id) {
      id = "guest_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("guestId", id);
    }
    setGuestId(id);
  }, []);

  const getCartId = () => (user ? user.email : guestId);

  const fetchCart = async () => {
    if (!guestId && !user) return;
    const cartId = getCartId();
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5162/api/Cart/${cartId}`);
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
      (i) => i.productId === item.productId
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
      i.productId === productId ? { ...i, quantity } : i
    );
    await updateCartBackend(updatedItems);
  };

  const clearCart = async () => {
    const cartId = getCartId();
    await axios.delete(`http://localhost:5162/api/Cart/${cartId}`);
    setCart({ id: cartId, items: [], totalPrice: 0 });
  };

  const updateCartBackend = async (items: CartItem[]) => {
    const cartId = getCartId();
    const newCart = { id: cartId, items };
    try {
      const res = await axios.post("http://localhost:5162/api/Cart", newCart);
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
