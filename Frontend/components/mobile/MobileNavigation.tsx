"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import {
  FaBars,
  FaTimes,
  FaHome,
  FaBox,
  FaHeart,
  FaShoppingCart,
  FaUser,
  FaSignOutAlt,
  FaSearch,
  FaTag,
  FaTruck,
  FaCog,
  FaShieldAlt,
  FaChartBar,
} from "react-icons/fa";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  // ESC tuşu ve dışarı tıklama ile kapatma
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [
    { href: "/", icon: FaHome, label: "Ana Sayfa" },
    { href: "/products", icon: FaBox, label: "Ürünler" },
    { href: "/coupons", icon: FaTag, label: "Kuponlar" },
    ...(user
      ? [
          { href: "/wishlist", icon: FaHeart, label: "İstek Listesi" },
          { href: "/cart", icon: FaShoppingCart, label: "Sepetim" },
          { href: "/track", icon: FaTruck, label: "Kargo Takip" },
          { href: "/profile", icon: FaUser, label: "Profilim" },
          { href: "/profile/settings", icon: FaCog, label: "Ayarlar" },
        ]
      : []),
    ...(user?.role === "Admin"
      ? [
          { href: "/admin", icon: FaChartBar, label: "Admin Panel" },
          { href: "/admin/security", icon: FaShieldAlt, label: "Güvenlik" },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={menuRef}
        className="fixed left-0 top-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-out"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Link
            href="/"
            onClick={onClose}
            className="text-xl font-bold text-custom-red"
          >
            E-Ticaret
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors touch-manipulation"
            aria-label="Menüyü kapat"
          >
            <FaTimes className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 bg-linear-to-r from-custom-red to-custom-orange text-white">
            <p className="font-medium">Hoşgeldin,</p>
            <p className="text-lg font-bold">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm opacity-80">{user.email}</p>
          </div>
        )}

        {/* Navigation Links */}
        <nav
          className="p-2 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
            >
              <item.icon className="w-5 h-5 text-gray-500" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
          {user ? (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors touch-manipulation"
            >
              <FaSignOutAlt />
              <span className="font-medium">Çıkış Yap</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                onClick={onClose}
                className="flex-1 py-3 px-4 text-center bg-custom-red text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation font-medium"
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="flex-1 py-3 px-4 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation font-medium"
              >
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MobileHeader() {
  const router = useRouter();
  const { cart } = useCart();
  const { wishlistCount } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const itemCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?q=${search}`);
      setSearchOpen(false);
      setSearch("");
    }
  };

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            aria-label="Menüyü aç"
          >
            <FaBars className="w-6 h-6 text-gray-700" />
          </button>

          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-custom-red">
            E-Ticaret
          </Link>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
              aria-label="Ara"
            >
              <FaSearch className="w-5 h-5 text-gray-700" />
            </button>

            <Link
              href="/wishlist"
              className="relative p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            >
              <FaHeart className="w-5 h-5 text-gray-700" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-custom-red text-[10px] font-bold text-white">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            >
              <FaShoppingCart className="w-5 h-5 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-custom-red text-[10px] font-bold text-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="px-4 pb-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ürün ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-orange focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-custom-orange text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors touch-manipulation"
              >
                <FaSearch />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="lg:hidden h-14" />

      {/* Mobile Menu */}
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

export function MobileBottomNav() {
  const { user } = useAuth();
  const { cart } = useCart();
  const { wishlistCount } = useWishlist();

  const itemCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const navItems = [
    { href: "/", icon: FaHome, label: "Ana Sayfa" },
    { href: "/products", icon: FaBox, label: "Ürünler" },
    {
      href: "/wishlist",
      icon: FaHeart,
      label: "Favoriler",
      badge: wishlistCount > 0 ? wishlistCount : undefined,
    },
    {
      href: "/cart",
      icon: FaShoppingCart,
      label: "Sepet",
      badge: itemCount > 0 ? itemCount : undefined,
    },
    {
      href: user ? "/profile" : "/login",
      icon: FaUser,
      label: user ? "Profil" : "Giriş",
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 h-full px-2 text-gray-600 hover:text-custom-orange active:bg-gray-50 transition-colors touch-manipulation relative"
          >
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.badge && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-custom-red text-[10px] font-bold text-white">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
