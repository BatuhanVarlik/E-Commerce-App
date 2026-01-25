"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center bg-gradient-to-br from-custom-cream to-white text-gray-800">
      <main className="flex flex-col items-center text-center px-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-custom-red sm:text-7xl drop-shadow-sm">
          Stilini Keşfet
        </h1>
        <p className="mt-6 max-w-2xl text-xl text-gray-600">
          En seçkin koleksiyonlar, size özel ayrıcalıklarla burada. Alışverişin
          en keyifli haliyle tanışın.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          {user ? (
            <Link
              href="/products"
              className="rounded-full bg-custom-red px-10 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-orange-700 hover:-translate-y-1 hover:shadow-2xl"
            >
              Ürünleri Keşfet
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full bg-custom-red px-10 py-4 text-lg font-bold text-white shadow-lg transition-all hover:brightness-90 hover:-translate-y-1 hover:shadow-2xl"
              >
                Giriş Yap
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

      <footer className="absolute bottom-4 text-sm font-medium text-custom-gold/80">
        &copy; 2024 E-Ticaret Projesi. Modern & Şık.
      </footer>
    </div>
  );
}
