"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart, CartItem as CartContextItem } from "@/context/CartContext";
import { API_URL } from "@/lib/api";
import {
  SwipeToDelete,
  QuantitySelector,
  TouchButton,
  ConfirmBottomSheet,
  Skeleton,
} from "@/components/mobile";
import { FaTrash, FaShoppingBag, FaArrowRight } from "react-icons/fa";

interface MobileCartItemProps {
  item: CartContextItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function MobileCartItem({
  item,
  onUpdateQuantity,
  onRemove,
}: MobileCartItemProps) {
  const imageUrl = item.imageUrl?.startsWith("http")
    ? item.imageUrl
    : `${API_URL}${item.imageUrl || "/uploads/images/default.jpg"}`;

  return (
    <SwipeToDelete
      onDelete={() => onRemove(item.productId)}
      className="bg-white"
    >
      <div className="flex gap-3 p-4 border-b border-gray-100">
        {/* Product Image */}
        <Link href={`/products/${item.productId}`} className="shrink-0">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-50">
            <Image
              src={imageUrl}
              alt={item.productName}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        </Link>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/products/${item.productId}`}>
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
              {item.productName}
            </h3>
          </Link>

          <p className="text-base font-bold text-custom-orange mt-1">
            {(item.price * item.quantity).toFixed(2)} ₺
          </p>

          {item.quantity > 1 && (
            <p className="text-xs text-gray-500">
              Birim: {item.price.toFixed(2)} ₺
            </p>
          )}
        </div>

        {/* Quantity & Remove */}
        <div className="flex flex-col items-end justify-between">
          <button
            onClick={() => onRemove(item.productId)}
            className="p-2 -m-2 text-gray-400 hover:text-red-500 active:text-red-600 transition-colors touch-manipulation"
            aria-label="Ürünü sil"
          >
            <FaTrash className="w-4 h-4" />
          </button>

          <QuantitySelector
            value={item.quantity}
            onChange={(q) => onUpdateQuantity(item.productId, q)}
            min={1}
            max={10}
            size="sm"
          />
        </div>
      </div>
    </SwipeToDelete>
  );
}

export function MobileCartView() {
  const { cart, updateQuantity, removeFromCart, clearCart, loading } =
    useCart();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const subtotal =
    cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const itemCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 lg:hidden">
        <div className="p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-4 bg-white rounded-lg">
              <Skeleton
                variant="rectangular"
                width={80}
                height={80}
                className="rounded-lg"
              />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="text" className="w-1/2" />
                <Skeleton variant="text" className="w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!cart?.items.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 lg:hidden">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FaShoppingBag className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sepetiniz Boş</h2>
        <p className="text-gray-500 text-center mb-6">
          Henüz sepetinize ürün eklemediniz.
        </p>
        <Link href="/products">
          <TouchButton variant="primary" size="lg">
            Alışverişe Başla
          </TouchButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40 lg:hidden">
      {/* Header */}
      <div className="sticky top-14 bg-white border-b border-gray-100 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">
            Sepetim{" "}
            <span className="text-gray-500 font-normal">
              ({itemCount} ürün)
            </span>
          </h1>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-sm text-red-600 font-medium touch-manipulation"
          >
            Tümünü Sil
          </button>
        </div>
      </div>

      {/* Cart Items */}
      <div className="bg-white mb-4">
        {cart.items.map((item) => (
          <MobileCartItem
            key={item.productId}
            item={item}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromCart}
          />
        ))}
      </div>

      {/* Summary & Checkout - Fixed at bottom */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600">Toplam</span>
          <span className="text-xl font-bold text-gray-900">
            {subtotal.toFixed(2)} ₺
          </span>
        </div>

        <Link href="/checkout" className="block">
          <TouchButton
            variant="primary"
            size="lg"
            fullWidth
            icon={<FaArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            Siparişi Tamamla
          </TouchButton>
        </Link>

        <p className="text-xs text-gray-500 text-center mt-2">
          Kargo ücreti sonraki adımda hesaplanacaktır
        </p>
      </div>

      {/* Clear Cart Confirmation */}
      <ConfirmBottomSheet
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={clearCart}
        title="Sepeti Temizle"
        message="Sepetinizdeki tüm ürünler silinecek. Emin misiniz?"
        confirmText="Evet, Temizle"
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
}

// Mini cart for mobile (shown as bottom sheet)
interface MobileCartSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileCartSheet({ isOpen, onClose }: MobileCartSheetProps) {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const subtotal =
    cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const itemCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            Sepetim ({itemCount})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 touch-manipulation"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {cart?.items.length ? (
            cart.items.map((item) => (
              <MobileCartItem
                key={item.productId}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FaShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500">Sepetiniz boş</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart?.items.length ? (
          <div className="p-4 border-t border-gray-100 bg-white safe-area-bottom">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600">Toplam</span>
              <span className="text-xl font-bold text-gray-900">
                {subtotal.toFixed(2)} ₺
              </span>
            </div>
            <Link href="/checkout" onClick={onClose}>
              <TouchButton variant="primary" size="lg" fullWidth>
                Ödemeye Geç
              </TouchButton>
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
