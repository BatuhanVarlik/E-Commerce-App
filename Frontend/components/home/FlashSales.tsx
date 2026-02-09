"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import ProductCard from "../ProductCard";
import { FaBolt, FaClock } from "react-icons/fa";

interface FlashSaleProduct {
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  categoryName: string;
  discountPercent?: number;
  stock?: number;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

export function FlashSales() {
  const [products, setProducts] = useState<FlashSaleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Flash sale bitiş zamanı (günün gece yarısı)
  const getEndTime = useCallback(() => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return end;
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const end = getEndTime();
      const diff = end.getTime() - now.getTime();

      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [getEndTime]);

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        // İndirimli ürünleri getir
        const { data } = await api.get("/api/Products", {
          params: { pageSize: 4, hasDiscount: true },
        });

        // Ürünlere indirim yüzdesi ekle (mock)
        const productsWithDiscount = (data.items || []).map(
          (p: FlashSaleProduct) => ({
            ...p,
            originalPrice: p.price * 1.3, // %30 indirim gibi göster
            discountPercent: 30,
            stock: Math.floor(Math.random() * 20) + 5,
          }),
        );

        setProducts(productsWithDiscount);
      } catch (error) {
        console.error("Flash sale ürünleri yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSales();
  }, []);

  if (!loading && products.length === 0) return null;

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg min-w-[50px] text-center">
        <span className="text-xl font-bold font-mono">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  );

  return (
    <section className="py-16 bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg animate-pulse">
              <FaBolt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Günün Fırsatları
              </h2>
              <p className="text-purple-200 text-sm">
                Kaçırmayın, stoklar sınırlı!
              </p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl">
            <FaClock className="w-5 h-5 text-yellow-400" />
            <span className="text-white text-sm mr-2">Bitmesine:</span>
            <div className="flex items-center gap-1">
              <TimeBlock value={timeLeft.hours} label="Saat" />
              <span className="text-white text-xl font-bold mx-1">:</span>
              <TimeBlock value={timeLeft.minutes} label="Dk" />
              <span className="text-white text-xl font-bold mx-1">:</span>
              <TimeBlock value={timeLeft.seconds} label="Sn" />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white/10 rounded-xl overflow-hidden animate-pulse aspect-[3/4]"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.productId}
                className="bg-white rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Discount Badge */}
                <div className="relative">
                  <div className="absolute top-2 left-2 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    %{product.discountPercent} İNDİRİM
                  </div>
                  <ProductCard
                    id={product.productId}
                    name={product.name}
                    price={product.price}
                    imageUrl={product.imageUrl}
                    categoryName={product.categoryName}
                  />
                </div>

                {/* Stock Progress */}
                {product.stock && (
                  <div className="px-4 pb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Kalan Stok</span>
                      <span className="font-medium">{product.stock} adet</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, product.stock * 5)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
