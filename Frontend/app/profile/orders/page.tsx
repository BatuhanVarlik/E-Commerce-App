"use client";

import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaBoxOpen,
  FaCalendarAlt,
  FaCreditCard,
  FaMapMarkerAlt,
  FaUserCircle,
  FaCog,
} from "react-icons/fa";

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  paymentId: string;
  shippingAddress: string;
  city: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await api.get("/api/Orders");
        setOrders(response.data);
      } catch (error) {
        console.error("Siparişler getirilemedi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, router]);

  if (!user) return null;

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
                className="flex items-center gap-3 rounded px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 hover:text-custom-orange transition-colors"
              >
                <FaUserCircle /> Hesabım
              </Link>
              <Link
                href="/profile/orders"
                className="flex items-center gap-3 rounded px-4 py-3 font-medium text-custom-red bg-red-50"
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
          <h1 className="mb-6 text-2xl font-bold text-gray-800">
            Siparişlerim
          </h1>

          {loading ? (
            <div className="text-center py-10">Yükleniyor...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10">
              <div className="mb-4 text-5xl text-gray-300 flex justify-center">
                <FaBoxOpen />
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">
                Henüz hiç siparişiniz yok.
              </h3>
              <p className="text-gray-500 mb-6">
                İhtiyacınız olan ürünleri bulmak için hemen alışverişe başlayın.
              </p>
              <Link
                href="/products"
                className="inline-block bg-custom-orange text-white px-6 py-3 rounded-full font-medium hover:bg-orange-600 transition-colors"
              >
                Alışverişe Başla
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap justify-between items-center gap-4">
                    <div className="flex gap-8">
                      <div>
                        <span className="block text-xs text-gray-500 uppercase">
                          Sipariş Tarihi
                        </span>
                        <span className="font-medium text-sm flex items-center gap-1">
                          <FaCalendarAlt className="text-gray-400" />
                          {new Date(order.orderDate).toLocaleDateString(
                            "tr-TR",
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 uppercase">
                          Toplam Tutar
                        </span>
                        <span className="font-medium text-sm text-green-600">
                          {order.totalAmount.toLocaleString("tr-TR")} ₺
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 uppercase">
                          Durum
                        </span>
                        <span
                          className={`font-medium text-sm ${
                            order.status === "Paid"
                              ? "text-green-600"
                              : order.status === "Pending"
                                ? "text-yellow-600"
                                : "text-gray-600"
                          }`}
                        >
                          {order.status === "Paid" ? "Ödendi" : order.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <button className="text-custom-red text-sm font-medium hover:underline">
                        Detayları Gör
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <FaBoxOpen className="text-custom-orange" />
                          Sipariş İçeriği ({order.items.length} Ürün)
                        </h4>
                        <ul className="space-y-3">
                          {order.items.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-600">
                                <span className="font-medium text-gray-900">
                                  {item.quantity}x
                                </span>{" "}
                                {item.productName}
                              </span>
                              <span className="font-medium text-gray-900">
                                {item.price.toLocaleString("tr-TR")} ₺
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="md:w-1/3 border-l pl-0 md:pl-6 pt-6 md:pt-0 border-t md:border-t-0">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <FaMapMarkerAlt className="text-custom-orange" />
                          Teslimat Adresi
                        </h4>
                        <p className="text-sm text-gray-600">
                          {order.shippingAddress}
                          <br />
                          {order.city}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
