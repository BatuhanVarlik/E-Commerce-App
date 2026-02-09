"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import ProductCard from "../ProductCard";
import { FaFire, FaArrowRight } from "react-icons/fa";

interface TrendingProduct {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  categoryName: string;
  salesCount?: number;
}

export function TrendingProducts() {
  const [products, setProducts] = useState<TrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // En çok satan ürünleri getir (Analytics endpoint'inden)
        const { data } = await api.get("/api/Analytics/top-products", {
          params: { count: 8, days: 7 },
        });
        setProducts(data || []);
      } catch (error) {
        console.error("Trend ürünler yüklenemedi:", error);
        // Fallback: Normal ürünleri getir
        try {
          const { data } = await api.get("/api/Products", {
            params: { pageSize: 8 },
          });
          setProducts(data.items || []);
        } catch {
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
              <FaFire className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Trend Ürünler
              </h2>
              <p className="text-gray-500 text-sm">
                Bu hafta en çok tercih edilenler
              </p>
            </div>
          </div>
          <a
            href="/products?sort=popular"
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
          >
            Tümünü Gör
            <FaArrowRight className="w-3 h-3" />
          </a>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white/60 rounded-xl overflow-hidden animate-pulse aspect-[3/4] shadow-sm"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product, index) => (
              <div key={product.productId} className="relative">
                {/* Ranking Badge */}
                {index < 3 && (
                  <div
                    className={`absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                      index === 0
                        ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                        : index === 1
                          ? "bg-gradient-to-br from-gray-300 to-gray-400"
                          : "bg-gradient-to-br from-orange-300 to-orange-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                )}
                <ProductCard
                  id={product.productId}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.imageUrl}
                  categoryName={product.categoryName}
                />
              </div>
            ))}
          </div>
        )}

        {/* Mobile View All */}
        <div className="sm:hidden text-center mt-6">
          <a
            href="/products?sort=popular"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
          >
            Tümünü Gör
            <FaArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  );
}
