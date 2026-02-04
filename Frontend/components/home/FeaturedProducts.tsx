"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import ProductCard from "../ProductCard";

interface Product {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  categoryName: string;
}

type TabType = "featured" | "new" | "sale";

export function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState<TabType>("featured");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/api/Products", {
          params: { pageSize: 8 },
        });
        setProducts(data.items || []);
      } catch (error) {
        console.error("Ürünler yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeTab]);

  const tabs = [
    { id: "featured" as TabType, label: "Öne Çıkanlar" },
    { id: "new" as TabType, label: "Yeni Gelenler" },
    { id: "sale" as TabType, label: "İndirimli" },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Öne Çıkan Ürünler
            </h2>
            <p className="text-gray-500 mt-1">
              En çok tercih edilen ürünleri keşfedin
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4 sm:mt-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-lg overflow-hidden animate-pulse aspect-[3/4]"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.productId}
                id={product.productId}
                name={product.name}
                price={product.price}
                imageUrl={product.imageUrl}
                categoryName={product.categoryName}
              />
            ))}
          </div>
        )}

        {/* View All Link */}
        <div className="text-center mt-10">
          <a
            href="/products"
            className="inline-flex items-center text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors group"
          >
            Tüm Ürünleri Gör
            <svg
              className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
