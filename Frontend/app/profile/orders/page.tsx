"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  FaBox,
  FaCalendar,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";
import { IconType } from "react-icons";
import Link from "next/link";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // Backend'den 'price' gelir
}

interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  shippingAddress: string;
  city: string;
  items: OrderItem[];
}

const statusConfig: Record<
  string,
  { label: string; className: string; icon: IconType }
> = {
  Pending: {
    label: "Beklemede",
    className: "bg-yellow-100 text-yellow-800",
    icon: FaClock,
  },
  Processing: {
    label: "Hazırlanıyor",
    className: "bg-blue-100 text-blue-800",
    icon: FaBox,
  },
  Shipped: {
    label: "Kargoda",
    className: "bg-purple-100 text-purple-800",
    icon: FaTruck,
  },
  Delivered: {
    label: "Teslim Edildi",
    className: "bg-green-100 text-green-800",
    icon: FaCheckCircle,
  },
  Cancelled: {
    label: "İptal Edildi",
    className: "bg-red-100 text-red-800",
    icon: FaTimesCircle,
  },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get(
        "/api/UserProfile/orders?page=1&pageSize=50",
      );
      setOrders(response.data.orders);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Siparişler yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Siparişleriniz yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <FaTimesCircle className="mx-auto mb-4 text-red-500 text-5xl" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <FaBox className="mx-auto mb-4 text-gray-400 text-5xl" />
        <h3 className="text-xl font-semibold mb-2">Henüz siparişiniz yok</h3>
        <p className="text-gray-600 mb-6">
          Alışverişe başlamak için ürünlerimize göz atın
        </p>
        <Link
          href="/products"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold">Siparişlerim</h2>
        <p className="text-gray-600 mt-1">Toplam {orders.length} sipariş</p>
      </div>

      {orders.map((order) => {
        const statusInfo = statusConfig[order.status] || statusConfig.Pending;
        const StatusIcon = statusInfo.icon;

        return (
          <div
            key={order.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            {/* Order Header */}
            <div className="bg-gray-50 border-b px-6 py-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Sipariş No</p>
                    <p className="font-semibold">
                      {order.orderNumber ||
                        order.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div>
                    <p className="text-sm text-gray-600">Tarih</p>
                    <p className="font-semibold flex items-center gap-1">
                      <FaCalendar />
                      {new Date(order.orderDate).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Toplam</p>
                    <p className="text-xl font-bold text-blue-600">
                      {order.totalAmount.toFixed(2)} ₺
                    </p>
                  </div>
                  <span
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium ${statusInfo.className}`}
                  >
                    <StatusIcon className="text-lg" />
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6">
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex-1">
                      <Link
                        href={`/product/${item.productId}`}
                        className="font-medium hover:text-blue-600 transition"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.quantity} adet × {item.price.toFixed(2)} ₺
                      </p>
                    </div>
                    <div className="font-semibold">
                      {(item.quantity * item.price).toFixed(2)} ₺
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">Teslimat Adresi</p>
                <p className="text-gray-800">{order.shippingAddress}</p>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <Link
                  href={`/profile/orders/${order.id}`}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                >
                  Detayları Gör
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
