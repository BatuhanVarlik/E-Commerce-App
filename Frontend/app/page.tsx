"use client";

import {
  HeroSlider,
  CategoryGrid,
  FeaturedProducts,
  PromoBanners,
  FeatureBar,
  NewsletterSection,
} from "@/components/home";
import PersonalizedRecommendations from "@/components/PersonalizedRecommendations";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Feature Bar */}
      <FeatureBar />

      {/* Categories */}
      <CategoryGrid />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Promo Banners */}
      <PromoBanners />

      {/* Personalized Recommendations (for logged-in users) */}
      {user && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6 lg:px-12">
            <PersonalizedRecommendations />
          </div>
        </section>
      )}

      {/* Newsletter */}
      <NewsletterSection />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div>
              <h3 className="text-2xl font-bold text-custom-orange mb-4">
                E-Ticaret
              </h3>
              <p className="text-gray-400 mb-6">
                Modern alışverişin en keyifli adresi. Kaliteli ürünler, uygun
                fiyatlar.
              </p>
              <div className="flex gap-4">
                {["facebook", "twitter", "instagram", "youtube"].map(
                  (social) => (
                    <a
                      key={social}
                      href={`https://${social}.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-custom-orange transition-colors"
                    >
                      <span className="sr-only">{social}</span>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                      </svg>
                    </a>
                  ),
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Hızlı Bağlantılar</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a
                    href="/products"
                    className="hover:text-white transition-colors"
                  >
                    Ürünler
                  </a>
                </li>
                <li>
                  <a
                    href="/coupons"
                    className="hover:text-white transition-colors"
                  >
                    Kuponlar
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    Hakkımızda
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    İletişim
                  </a>
                </li>
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h4 className="font-semibold mb-4">Müşteri Hizmetleri</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <a
                    href="/profile/orders"
                    className="hover:text-white transition-colors"
                  >
                    Siparişlerim
                  </a>
                </li>
                <li>
                  <a
                    href="/profile"
                    className="hover:text-white transition-colors"
                  >
                    Hesabım
                  </a>
                </li>
                <li>
                  <a href="/faq" className="hover:text-white transition-colors">
                    SSS
                  </a>
                </li>
                <li>
                  <a
                    href="/returns"
                    className="hover:text-white transition-colors"
                  >
                    İade Politikası
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">İletişim</h4>
              <ul className="space-y-3 text-gray-400">
                <li>📍 İstanbul, Türkiye</li>
                <li>📞 +90 (212) 123 45 67</li>
                <li>✉️ destek@eticaret.com</li>
                <li>🕐 Pzt-Cuma: 09:00 - 18:00</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
            <p>© 2024 E-Ticaret. Tüm hakları saklıdır.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="/privacy" className="hover:text-white transition-colors">
                Gizlilik Politikası
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                Kullanım Koşulları
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
