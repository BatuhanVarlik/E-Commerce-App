"use client";

import {
  HeroSlider,
  CategoryGrid,
  FeaturedProducts,
  TrendingProducts,
  FlashSales,
  PromoBanners,
  NewsletterSection,
  FeatureBar,
} from "@/components/home";
import PersonalizedRecommendations from "@/components/PersonalizedRecommendations";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Feature Bar - Compact version below hero */}
      <FeatureBar />

      {/* Flash Sales - Günün Fırsatları */}
      <FlashSales />

      {/* Categories */}
      <CategoryGrid
        layout="default"
        columns={4}
        title="Kategorileri Keşfet"
        showViewAll={true}
      />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Trending Products - Bu Haftanın Trendleri */}
      <TrendingProducts />

      {/* Promo Banners */}
      <PromoBanners />

      {/* Personalized Recommendations (for logged-in users) */}
      {user && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PersonalizedRecommendations />
          </div>
        </section>
      )}

      {/* Newsletter */}
      <NewsletterSection />
    </div>
  );
}
