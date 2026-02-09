"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaHeart, FaRegHeart, FaShoppingCart, FaEye } from "react-icons/fa";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import QuickBuyModal from "./QuickBuyModal";

interface ProductProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  categoryName: string;
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isSale?: boolean;
}

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  imageUrl,
  categoryName,
  rating = 0,
  reviewCount = 0,
  isNew = false,
  isSale = false,
}: ProductProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const inWishlist = isInWishlist(id);
  const [showQuickBuy, setShowQuickBuy] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(id);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart({
        productId: id,
        productName: name,
        price: price,
        quantity: 1,
        imageUrl: imageUrl,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickBuy(true);
  };

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <>
      <div
        className="group relative bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {isNew && (
            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500 text-white rounded">
              YENİ
            </span>
          )}
          {isSale && discount > 0 && (
            <span className="px-2.5 py-1 text-xs font-semibold bg-red-500 text-white rounded">
              -%{discount}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        {user && (
          <button
            onClick={handleWishlistClick}
            className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
          >
            {inWishlist ? (
              <FaHeart className="text-red-500 text-base" />
            ) : (
              <FaRegHeart className="text-gray-400 text-base hover:text-red-500 transition-colors" />
            )}
          </button>
        )}

        {/* Image Container */}
        <Link
          href={`/product/${id}`}
          className="block relative aspect-square overflow-hidden bg-gray-50"
        >
          <Image
            src={
              imageUrl.startsWith("http")
                ? imageUrl
                : `https://placehold.co/400x400/f8f8f8/666?text=${encodeURIComponent(name.slice(0, 10))}`
            }
            alt={name}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />

          {/* Quick Actions Overlay */}
          <div
            className={`absolute inset-0 bg-black/5 flex items-center justify-center gap-2 transition-all duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:bg-gray-900 hover:text-white transition-all duration-200 transform translate-y-4 group-hover:translate-y-0"
              title="Sepete Ekle"
            >
              {addingToCart ? (
                <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <FaShoppingCart className="text-sm" />
              )}
            </button>
            <button
              onClick={handleQuickView}
              className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg hover:bg-gray-900 hover:text-white transition-all duration-200 transform translate-y-4 group-hover:translate-y-0 delay-75"
              title="Hızlı Görüntüle"
            >
              <FaEye className="text-sm" />
            </button>
          </div>
        </Link>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            {categoryName}
          </p>

          {/* Product Name */}
          <Link href={`/product/${id}`}>
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[40px] hover:text-gray-600 transition-colors">
              {name}
            </h3>
          </Link>

          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= rating ? "text-yellow-400" : "text-gray-200"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-400">({reviewCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              {price.toLocaleString("tr-TR")} ₺
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-gray-400 line-through">
                {originalPrice.toLocaleString("tr-TR")} ₺
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {showQuickBuy && (
        <QuickBuyModal
          productId={id}
          productName={name}
          productImage={imageUrl}
          price={price}
          onClose={() => setShowQuickBuy(false)}
          onSuccess={() => {
            setShowQuickBuy(false);
          }}
        />
      )}
    </>
  );
}
