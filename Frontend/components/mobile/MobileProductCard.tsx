"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaHeart, FaRegHeart, FaShoppingCart, FaStar } from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { API_URL } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  brandName?: string;
}

interface MobileProductCardProps {
  product: Product;
  showQuickAdd?: boolean;
}

export function MobileProductCard({
  product,
  showQuickAdd = true,
}: MobileProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);

  const inWishlist = isInWishlist(product.id);
  const hasDiscount =
    product.discountPrice && product.discountPrice < product.price;
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.discountPrice! / product.price) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAddingToCart) return;

    setIsAddingToCart(true);
    try {
      await addToCart({
        productId: product.id,
        productName: product.name,
        price: product.discountPrice || product.price,
        quantity: 1,
        imageUrl: product.imageUrl || "/uploads/images/default.jpg",
      });
      setShowAddedFeedback(true);

      // Haptic feedback (if supported)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      setTimeout(() => setShowAddedFeedback(false), 1500);
    } catch (error) {
      console.error("Sepete eklenemedi:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    if (inWishlist) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  const imageUrl = product.imageUrl?.startsWith("http")
    ? product.imageUrl
    : `${API_URL}${product.imageUrl || "/uploads/images/default.jpg"}`;

  return (
    <Link href={`/products/${product.id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-shadow hover:shadow-md active:shadow-sm">
        {/* Image Container */}
        <div className="relative aspect-square bg-gray-50">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover"
            loading="lazy"
          />

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-custom-red text-white text-xs font-bold px-2 py-1 rounded-full">
              %{discountPercentage}
            </div>
          )}

          {/* Out of Stock Overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
                Tükendi
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-transform active:scale-90 touch-manipulation"
            aria-label={inWishlist ? "Favorilerden çıkar" : "Favorilere ekle"}
          >
            {inWishlist ? (
              <FaHeart className="w-4 h-4 text-custom-red" />
            ) : (
              <FaRegHeart className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Brand */}
          {product.brandName && (
            <p className="text-xs text-gray-500 mb-1 truncate">
              {product.brandName}
            </p>
          )}

          {/* Title */}
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-10">
            {product.name}
          </h3>

          {/* Rating */}
          {product.rating !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <FaStar className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-gray-600">
                {product.rating.toFixed(1)}
                {product.reviewCount !== undefined && (
                  <span className="text-gray-400 ml-1">
                    ({product.reviewCount})
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Price & Add to Cart */}
          <div className="flex items-center justify-between mt-2">
            <div>
              {hasDiscount ? (
                <>
                  <span className="text-xs text-gray-400 line-through">
                    {product.price.toFixed(2)} ₺
                  </span>
                  <span className="block text-base font-bold text-custom-red">
                    {product.discountPrice!.toFixed(2)} ₺
                  </span>
                </>
              ) : (
                <span className="text-base font-bold text-gray-900">
                  {product.price.toFixed(2)} ₺
                </span>
              )}
            </div>

            {/* Quick Add Button */}
            {showQuickAdd && product.stock !== 0 && (
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all touch-manipulation ${
                  showAddedFeedback
                    ? "bg-green-500 text-white"
                    : "bg-custom-orange text-white active:bg-orange-700"
                } ${isAddingToCart ? "opacity-50" : ""}`}
                aria-label="Sepete ekle"
              >
                {showAddedFeedback ? (
                  <svg
                    className="w-5 h-5 animate-bounce-in"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <FaShoppingCart className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Horizontal scroll product list for mobile
interface MobileProductListProps {
  products: Product[];
  title?: string;
  seeAllLink?: string;
}

export function MobileProductList({
  products,
  title,
  seeAllLink,
}: MobileProductListProps) {
  return (
    <div className="py-4">
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {seeAllLink && (
            <Link
              href={seeAllLink}
              className="text-sm font-medium text-custom-orange hover:text-orange-600 touch-manipulation"
            >
              Tümünü Gör
            </Link>
          )}
        </div>
      )}

      {/* Horizontal Scroll Container */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-3" style={{ width: "max-content" }}>
          {products.map((product) => (
            <div key={product.id} className="w-40 shrink-0">
              <MobileProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Grid product list for mobile
interface MobileProductGridProps {
  products: Product[];
  columns?: 2 | 3;
}

export function MobileProductGrid({
  products,
  columns = 2,
}: MobileProductGridProps) {
  return (
    <div
      className="grid gap-3 px-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {products.map((product) => (
        <MobileProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
