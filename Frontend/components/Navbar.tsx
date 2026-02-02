"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaShoppingCart, FaHeart, FaTag } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import MiniCart from "./MiniCart";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { wishlistCount } = useWishlist();
  const [search, setSearch] = useState("");
  const [showMiniCart, setShowMiniCart] = useState(false);
  const miniCartRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?q=${search}`);
    }
  };

  const itemCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Close mini cart when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        miniCartRef.current &&
        !miniCartRef.current.contains(event.target as Node)
      ) {
        setShowMiniCart(false);
      }
    };

    if (showMiniCart) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMiniCart]);

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            href={user ? "/products" : "/"}
            className="text-2xl font-bold text-custom-red"
          >
            E-Ticaret
          </Link>

          <form onSubmit={handleSearch} className="hidden md:block w-1/3">
            <input
              type="text"
              placeholder="Urun ara..."
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-custom-orange focus:outline-none focus:ring-1 focus:ring-custom-orange"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="flex items-center space-x-4 text-gray-700">
            <Link
              href="/products"
              className="hover:text-custom-orange transition-colors"
            >
              Urunler
            </Link>

            <Link
              href="/coupons"
              className="hover:text-custom-orange transition-colors flex items-center gap-1"
            >
              <FaTag />
              <span className="hidden lg:inline">Kuponlar</span>
            </Link>

            {user && (
              <Link
                href="/wishlist"
                className="relative hover:text-custom-orange transition-colors"
              >
                <FaHeart className="text-xl" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-custom-red text-xs font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            <div className="relative" ref={miniCartRef}>
              <button
                onClick={() => setShowMiniCart(!showMiniCart)}
                className="relative hover:text-custom-orange transition-colors"
              >
                <FaShoppingCart className="text-xl" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-custom-red text-xs font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </button>

              {showMiniCart && (
                <MiniCart onClose={() => setShowMiniCart(false)} />
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                {user.role === "Admin" && (
                  <Link
                    href="/admin"
                    className="rounded bg-custom-red px-3 py-1 text-sm text-white hover:bg-red-700 transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="font-medium text-gray-900 hover:text-custom-orange hover:underline transition-colors"
                >
                  Hosgeldin, {user.firstName}
                </Link>
                <button
                  onClick={logout}
                  className="rounded bg-gray-100 px-4 py-2 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Cikis Yap
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hover:text-custom-orange transition-colors"
                >
                  Giris Yap
                </Link>
                <Link
                  href="/register"
                  className="rounded bg-custom-red px-4 py-2 text-white hover:brightness-90 transition-all shadow-md hover:shadow-lg"
                >
                  Kayit Ol
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
