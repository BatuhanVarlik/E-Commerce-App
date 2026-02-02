"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { FaHeart } from "react-icons/fa";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  brandId: string;
  stock: number;
  averageRating: number;
  reviewCount: number;
}

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await api.get("/api/Wishlist");
      setProducts(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Favoriler yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Favorileriniz yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <FaHeart className="mx-auto mb-4 text-gray-400 text-5xl" />
        <h3 className="text-xl font-semibold mb-2">Favori listeniz boş</h3>
        <p className="text-gray-600 mb-6">
          Beğendiğiniz ürünleri favorilere ekleyin
        </p>
        <a
          href="/products"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Ürünleri Keşfet
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3">
          <FaHeart className="text-red-500 text-3xl" />
          <div>
            <h2 className="text-2xl font-bold">Favorilerim</h2>
            <p className="text-gray-600">{products.length} ürün</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            price={product.price}
            imageUrl={product.imageUrl}
            categoryName={product.categoryId}
          />
        ))}
      </div>
    </div>
  );
}
