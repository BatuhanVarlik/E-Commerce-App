"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { FaTrash, FaMinus, FaPlus } from "react-icons/fa";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, loading } =
    useCart();

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-800">Sepetiniz Boş</h1>
        <p className="mb-8 text-gray-600">
          Henüz sepetinize ürün eklememişsiniz.
        </p>
        <Link
          href="/products"
          className="rounded bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-800">
        Alışveriş Sepeti
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-gray-50">
                <Image
                  src={
                    item.imageUrl.startsWith("http")
                      ? item.imageUrl
                      : `https://placehold.co/200?text=${item.productName}`
                  }
                  alt={item.productName}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    <Link
                      href={`/product/${item.productId}`}
                      className="hover:text-custom-orange transition-colors"
                    >
                      {item.productName}
                    </Link>
                  </h3>
                  <p className="text-gray-500">
                    {item.price.toLocaleString("tr-TR")} ₺
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity - 1)
                  }
                  className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 hover:text-custom-orange transition-colors"
                >
                  <FaMinus size={10} />
                </button>
                <span className="w-8 text-center font-medium">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity + 1)
                  }
                  className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 hover:text-custom-orange transition-colors"
                >
                  <FaPlus size={10} />
                </button>
              </div>

              <div className="text-right ml-4">
                <p className="font-bold text-gray-900">
                  {(item.price * item.quantity).toLocaleString("tr-TR")} ₺
                </p>
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="mt-2 text-sm text-gray-400 hover:text-custom-red transition-colors"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <button
              onClick={clearCart}
              className="text-gray-500 hover:text-custom-red hover:underline text-sm transition-colors"
            >
              Sepeti Temizle
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="h-fit rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Sipariş Özeti
          </h2>
          <div className="flex justify-between border-b border-gray-100 pb-4 text-gray-600">
            <span>Ara Toplam</span>
            <span>{cart.totalPrice.toLocaleString("tr-TR")} ₺</span>
          </div>
          <div className="flex justify-between py-6 text-2xl font-bold text-gray-900">
            <span>Toplam</span>
            <span className="text-custom-red">
              {cart.totalPrice.toLocaleString("tr-TR")} ₺
            </span>
          </div>
          <Link
            href="/checkout"
            className="mt-2 block w-full text-center rounded-lg bg-custom-red py-4 font-bold text-white shadow-lg transition-all hover:bg-red-700 hover:-translate-y-1 hover:shadow-xl"
          >
            Ödemeye Geç
          </Link>
          <div className="mt-6 flex justify-center opacity-60">
            {/* Icons for payment methods could go here */}
            <span className="text-xs text-gray-400">
              Güvenli Ödeme Altyapısı
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
