"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import PersonalizedRecommendations from "@/components/PersonalizedRecommendations";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-custom-cream to-white">
      {/* Hero Section */}
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-gray-800 px-4">
        <main className="flex flex-col items-center text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-custom-red sm:text-7xl drop-shadow-sm">
            Stilini Kesfet
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-gray-600">
            En seckin koleksiyonlar, size ozel ayricalklarla burada. Alisverisin
            en keyifli haliyle tanisin.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            {user ? (
              <Link
                href="/products"
                className="rounded-full bg-custom-red px-10 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-orange-700 hover:-translate-y-1 hover:shadow-2xl"
              >
                Urunleri Kesfet
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full bg-custom-red px-10 py-4 text-lg font-bold text-white shadow-lg transition-all hover:brightness-90 hover:-translate-y-1 hover:shadow-2xl"
                >
                  Giris Yap
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-white px-10 py-4 text-lg font-bold text-custom-red shadow-md ring-2 ring-custom-red transition-all hover:bg-gray-50 hover:-translate-y-1 hover:shadow-xl"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Recommendations Section */}
      <div className="container mx-auto px-4 py-12">
        <PersonalizedRecommendations />
      </div>

      <footer className="text-center py-8 text-sm font-medium text-custom-gold/80">
        &copy; 2024 E-Ticaret Projesi. Modern & Sik.
      </footer>
    </div>
  );
}
