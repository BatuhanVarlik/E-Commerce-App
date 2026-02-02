"use client";

import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaTimes, FaShoppingCart } from "react-icons/fa";

export default function MiniCart({ onClose }: { onClose: () => void }) {
  const { cart, removeFromCart } = useCart();
  const router = useRouter();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mini-cart-dropdown">
        <div className="p-8 text-center">
          <FaShoppingCart className="mx-auto text-4xl text-gray-300 mb-2" />
          <p className="text-gray-500">Sepetiniz boş</p>
        </div>
      </div>
    );
  }

  const displayItems = cart.items.slice(0, 3);
  const hasMore = cart.items.length > 3;

  const handleGoToCart = () => {
    onClose();
    router.push("/cart");
  };

  const handleCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  return (
    <div className="mini-cart-dropdown">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-800">
          Sepetim ({cart.items.length} ürün)
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes />
        </button>
      </div>

      {/* Items */}
      <div className="max-h-80 overflow-y-auto">
        {displayItems.map((item) => (
          <div
            key={item.productId}
            className="flex gap-3 p-4 border-b hover:bg-gray-50 transition-colors"
          >
            <div className="relative w-16 h-16 shrink-0 rounded overflow-hidden bg-gray-100">
              <Image
                src={
                  item.imageUrl.startsWith("http")
                    ? item.imageUrl
                    : `https://placehold.co/100?text=${item.productName}`
                }
                alt={item.productName}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {item.productName}
              </h4>
              <p className="text-sm text-gray-500">
                {item.quantity} x {item.price.toLocaleString("tr-TR")}₺
              </p>
              <p className="text-sm font-semibold text-custom-orange">
                {(item.price * item.quantity).toLocaleString("tr-TR")}₺
              </p>
            </div>

            <button
              onClick={() => removeFromCart(item.productId)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <FaTimes size={14} />
            </button>
          </div>
        ))}

        {hasMore && (
          <div className="p-3 text-center bg-gray-50 text-sm text-gray-600">
            +{cart.items.length - 3} ürün daha
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex justify-between mb-3">
          <span className="font-medium text-gray-700">Toplam:</span>
          <span className="font-bold text-custom-red text-lg">
            {cart.totalPrice.toLocaleString("tr-TR")}₺
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGoToCart}
            className="flex-1 px-4 py-2 border-2 border-custom-red text-custom-red rounded-lg hover:bg-custom-red hover:text-white transition-colors font-medium"
          >
            Sepete Git
          </button>
          <button
            onClick={handleCheckout}
            className="flex-1 px-4 py-2 bg-custom-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Ödemeye Geç
          </button>
        </div>
      </div>
    </div>
  );
}
