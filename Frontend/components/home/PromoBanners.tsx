"use client";

import Link from "next/link";
import Image from "next/image";

export function PromoBanners() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Banner 1 - Large */}
          <Link
            href="/products?collection=summer"
            className="group relative overflow-hidden rounded-3xl aspect-video md:aspect-4/3 shadow-xl"
          >
            <Image
              src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80"
              alt="Yaz Koleksiyonu"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-r from-orange-600/80 to-transparent" />
            <div className="absolute inset-0 flex items-center p-8 md:p-12">
              <div className="text-white max-w-xs">
                <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium mb-4 backdrop-blur-sm">
                  Özel Teklif
                </span>
                <h3 className="text-3xl md:text-4xl font-bold mb-3">
                  Yaz Koleksiyonu
                </h3>
                <p className="text-white/90 mb-6">
                  %40&apos;a varan indirimlerle yeni sezon ürünleri
                </p>
                <span className="inline-flex items-center font-semibold group-hover:underline">
                  Alışverişe Başla
                  <svg
                    className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform"
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
                </span>
              </div>
            </div>
          </Link>

          {/* Banner 2 & 3 - Stacked */}
          <div className="flex flex-col gap-8">
            {/* Banner 2 */}
            <Link
              href="/products?category=aksesuar"
              className="group relative overflow-hidden rounded-3xl aspect-16/7 shadow-xl"
            >
              <Image
                src="https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80"
                alt="Aksesuar Koleksiyonu"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-r from-purple-600/80 to-transparent" />
              <div className="absolute inset-0 flex items-center p-6 md:p-8">
                <div className="text-white">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">
                    Aksesuar Koleksiyonu
                  </h3>
                  <span className="inline-flex items-center text-sm font-medium group-hover:underline">
                    Keşfet
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>

            {/* Banner 3 */}
            <Link
              href="/coupons"
              className="group relative overflow-hidden rounded-3xl aspect-16/7 shadow-xl"
            >
              <div className="absolute inset-0 bg-linear-to-r from-emerald-600 to-teal-500" />
              <div className="absolute inset-0 flex items-center justify-between p-6 md:p-8">
                <div className="text-white">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">
                    Ücretsiz Kargo
                  </h3>
                  <p className="text-white/90">500₺ ve üzeri siparişlerde</p>
                </div>
                <div className="hidden md:flex items-center justify-center w-24 h-24 bg-white/20 rounded-full backdrop-blur-sm">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
