"use client";

import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { WishlistItem } from "@/context/WishlistContext";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleAddToCart = async (item: WishlistItem) => {
    await addToCart({
      productId: item.productId,
      productName: item.productName,
      price: item.productPrice,
      quantity: 1,
      imageUrl: item.productImageUrl,
    });
    alert("Ürün sepete eklendi!");
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("URL kopyalanamadı:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Favorilerim ({wishlist.length})
        </h1>
        {wishlist.length > 0 && (
          <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-white border-2 border-custom-red text-custom-red px-4 py-2 rounded-lg hover:bg-custom-red hover:text-white transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            {copied ? "Kopyalandı!" : "Listeyi Paylaş"}
          </button>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-16">
          <svg
            className="mx-auto h-24 w-24 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <p className="text-xl text-gray-600 mb-4">Favori listeniz boş</p>
          <Link
            href="/products"
            className="inline-block bg-custom-red text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
          >
            Ürünleri Keşfet
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <Link href={`/product/${item.productId}`}>
                <div className="relative h-64 bg-gray-100">
                  <Image
                    src={item.productImageUrl}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                </div>
              </Link>

              <div className="p-4">
                <Link href={`/product/${item.productId}`}>
                  <h3 className="font-semibold text-gray-800 mb-1 hover:text-custom-red transition line-clamp-2">
                    {item.productName}
                  </h3>
                </Link>
                <p className="text-sm text-gray-500 mb-2">{item.brandName}</p>
                <p className="text-xl font-bold text-custom-red mb-4">
                  ₺{item.productPrice.toLocaleString("tr-TR")}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={item.productStock === 0}
                    className="flex-1 bg-custom-red text-white py-2 px-4 rounded-lg hover:bg-red-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {item.productStock === 0 ? "Stokta Yok" : "Sepete Ekle"}
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition"
                    title="Favorilerden Kaldır"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  {new Date(item.addedAt).toLocaleDateString("tr-TR")} tarihinde
                  eklendi
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
