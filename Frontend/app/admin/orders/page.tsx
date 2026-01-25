"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { FaEye } from "react-icons/fa";

interface Order {
  id: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  city: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5162/api/admin/orders",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setOrders(response.data);
      } catch (error) {
        console.error("Siparişler çekilemedi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Sipariş Yönetimi
      </h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
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
            {orders.map((order) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
