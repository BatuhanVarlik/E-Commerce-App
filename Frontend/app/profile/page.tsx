"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { FaUserCircle, FaBoxOpen, FaCog } from "react-icons/fa";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not logged in, redirect to login
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    return null; // Or loading spinner
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-1/4">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="bg-custom-red p-6 text-center text-white">
              <FaUserCircle className="mx-auto mb-3 text-6xl" />
              <h2 className="text-xl font-bold">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm opacity-90">{user.email}</p>
            </div>
            <nav className="flex flex-col p-2">
              <Link
                href="/profile"
                className="flex items-center gap-3 rounded px-4 py-3 font-medium text-custom-red bg-red-50"
              >
                <FaUserCircle /> Hesabım
              </Link>
              <Link
                href="/profile/orders"
                className="flex items-center gap-3 rounded px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 hover:text-custom-orange transition-colors"
              >
                <FaBoxOpen /> Siparişlerim
              </Link>
              <Link
                href="/profile/settings"
                className="flex items-center gap-3 rounded px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 hover:text-custom-orange transition-colors"
              >
                <FaCog /> Ayarlar
              </Link>
              <button
                onClick={logout}
                className="mt-2 flex w-full items-center gap-3 rounded px-4 py-3 font-medium text-red-600 hover:bg-red-50 text-left"
              >
                Çıkış Yap
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 rounded-lg bg-white p-6 shadow">
          <h1 className="mb-6 text-2xl font-bold text-gray-800">Hesabım</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-gray-600 mb-2">
                Kişisel Bilgiler
              </h3>
              <p className="text-lg font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-gray-500">{user.email}</p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-gray-600 mb-2">Son Sipariş</h3>
              <p className="text-gray-500 text-sm">
                Henüz siparişiniz bulunmuyor.
              </p>
              <Link
                href="/products"
                className="mt-2 text-custom-red text-sm hover:underline inline-block"
              >
                Alışverişe Başla
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
