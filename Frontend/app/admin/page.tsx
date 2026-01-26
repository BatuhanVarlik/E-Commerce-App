"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { FaEye } from "react-icons/fa";
import Link from "next/link";

interface Order {
  id: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  city: string;
}

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  recentOrders: Order[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/api/admin/dashboard");
        setStats(response.data);
      } catch (err: any) {
        console.error("Dashboard verileri çekilemedi:", err);
        if (
          err.response &&
          (err.response.status === 401 || err.response.status === 403)
        ) {
          setError("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
        } else {
          setError("Veriler yüklenirken bir hata oluştu.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!stats) return <div>Veri yok.</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/reviews"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Yorum Moderasyonu
          </Link>
          <div className="text-gray-500">
            Son Güncelleme: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm uppercase">Toplam Satış</h3>
          <p className="text-2xl font-bold text-gray-800 mt-2">
            {stats.totalSales.toLocaleString("tr-TR")} ₺
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm uppercase">Toplam Sipariş</h3>
          <p className="text-2xl font-bold text-gray-800 mt-2">
            {stats.totalOrders}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm uppercase">
            Bekleyen Siparişler
          </h3>
          <p className="text-2xl font-bold text-gray-800 mt-2">
            {stats.pendingOrders}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-custom-red">
          <h3 className="text-gray-500 text-sm uppercase">Toplam Ürün</h3>
          <p className="text-2xl font-bold text-gray-800 mt-2">
            {stats.totalProducts}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Son Siparişler</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
              <tr>
                <th className="p-4 border-b">Tarih</th>
                <th className="p-4 border-b">Tutar</th>
                <th className="p-4 border-b">Durum</th>
                <th className="p-4 border-b">Şehir</th>
                <th className="p-4 border-b text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-600">
              {stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 border-b last:border-0"
                  >
                    <td className="p-4">
                      {new Date(order.orderDate).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="p-4 font-bold text-green-600">
                      {order.totalAmount.toLocaleString("tr-TR")} ₺
                    </td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">{order.city}</td>
                    <td className="p-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 p-2">
                        <FaEye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    Henüz sipariş yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
