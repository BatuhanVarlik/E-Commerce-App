"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const slides = [
  {
    id: 1,
    title: "Premium Kalite Ürünler",
    subtitle: "Yeni Sezon Koleksiyonu",
    description:
      "En seçkin ürünlerle stilinizi tamamlayın. Özel indirimlerle buluşun.",
    buttonText: "Koleksiyonu Keşfet",
    buttonLink: "/products",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80",
    bgColor: "from-slate-900 to-slate-700",
  },
  {
    id: 2,
    title: "Yaz Koleksiyonu",
    subtitle: "%40'a Varan İndirim",
    description: "Yazın enerjisini yansıtan renkler ve desenler sizi bekliyor.",
    buttonText: "İndirimleri Gör",
    buttonLink: "/products?sort=discount",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80",
    bgColor: "from-orange-600 to-amber-500",
  },
  {
    id: 3,
    title: "Özel Tasarımlar",
    subtitle: "Sınırlı Sayıda",
    description:
      "Benzersiz tasarımlarla fark yaratın. Stok tükenmeden sipariş verin.",
    buttonText: "Hemen Al",
    buttonLink: "/products?featured=true",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80",
    bgColor: "from-purple-700 to-indigo-600",
  },
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentSlide];

  return (
    <div className="relative w-full h-[70vh] min-h-125 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={slide.image}
          alt={slide.title}
          fill
          className="object-cover transition-transform duration-700 scale-105"
          priority
        />
        <div
          className={`absolute inset-0 bg-linear-to-r ${slide.bgColor} opacity-80`}
        />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-2xl text-white">
            <p className="text-sm md:text-base font-medium tracking-widest uppercase mb-3 animate-fade-in-up opacity-80">
              {slide.subtitle}
            </p>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up">
              {slide.title}
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90 animate-fade-in-up">
              {slide.description}
            </p>
            <Link
              href={slide.buttonLink}
              className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
            >
              {slide.buttonText}
              <svg
                className="w-5 h-5 ml-2"
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
            </Link>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() =>
          setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
        }
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all"
        aria-label="Previous slide"
      >
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all"
        aria-label="Next slide"
      >
        <svg
          className="w-6 h-6 text-white"
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
      </button>
    </div>
  );
}
