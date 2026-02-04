"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiShoppingBag,
  FiHeart,
  FiSearch,
  FiMenu,
  FiX,
  FiUser,
} from "react-icons/fi";
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const miniCartRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?q=${search}`);
      setShowSearch(false);
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
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-100">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {showMobileMenu ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>

            {/* Logo */}
            <Link href="/" className="text-xl font-bold text-gray-900">
              E-Ticaret
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              <Link
                href="/products"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Ürünler
              </Link>
              <Link
                href="/products?category=kadin"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Kadın
              </Link>
              <Link
                href="/products?category=erkek"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Erkek
              </Link>
              <Link
                href="/coupons"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Kuponlar
              </Link>
            </div>
          </div>

          {/* Center: Search */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl"
          >
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Ürün ara..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-gray-50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </form>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Mobile Search */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="md:hidden p-2.5 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiSearch size={20} />
            </button>

            {/* Wishlist */}
            {user && (
              <Link
                href="/wishlist"
                className="relative p-2.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiHeart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] font-medium text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <div className="relative" ref={miniCartRef}>
              <button
                onClick={() => setShowMiniCart(!showMiniCart)}
                className="relative p-2.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] font-medium text-white">
                    {itemCount}
                  </span>
                )}
              </button>
              {showMiniCart && (
                <MiniCart onClose={() => setShowMiniCart(false)} />
              )}
            </div>

            {/* User Menu */}
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === "Admin" && (
                  <Link
                    href="/admin"
                    className="hidden sm:inline-flex px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {user.firstName?.charAt(0).toUpperCase()}
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="hidden sm:inline-flex text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="p-2.5 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <FiUser size={20} />
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Üye Ol
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="md:hidden py-3 border-t border-gray-100">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ürün ara..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pl-10 text-sm focus:outline-none focus:border-gray-400"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                <FiSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            <Link
              href="/products"
              className="block py-2.5 text-gray-700 text-sm"
              onClick={() => setShowMobileMenu(false)}
            >
              Tüm Ürünler
            </Link>
            <Link
              href="/products?category=kadin"
              className="block py-2.5 text-gray-700 text-sm"
              onClick={() => setShowMobileMenu(false)}
            >
              Kadın
            </Link>
            <Link
              href="/products?category=erkek"
              className="block py-2.5 text-gray-700 text-sm"
              onClick={() => setShowMobileMenu(false)}
            >
              Erkek
            </Link>
            <Link
              href="/coupons"
              className="block py-2.5 text-gray-700 text-sm"
              onClick={() => setShowMobileMenu(false)}
            >
              Kuponlar
            </Link>
            {user?.role === "Admin" && (
              <Link
                href="/admin"
                className="block py-2.5 text-gray-900 text-sm font-medium"
                onClick={() => setShowMobileMenu(false)}
              >
                Admin Panel
              </Link>
            )}
            {user && (
              <button
                onClick={() => {
                  logout();
                  setShowMobileMenu(false);
                }}
                className="block py-2.5 text-gray-500 text-sm"
              >
                Çıkış Yap
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
