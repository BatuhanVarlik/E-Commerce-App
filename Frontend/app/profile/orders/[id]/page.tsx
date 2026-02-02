"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import ShippingTracker from "@/components/ShippingTracker";
import {
  FaArrowLeft,
  FaBox,
  FaMapMarkerAlt,
  FaCreditCard,
  FaTimes,
  FaRedo,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaTruck,
} from "react-icons/fa";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string;
  productSlug: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  paymentId: string;
  shippingAddress: string;
  city: string;
  country: string;
  zipCode: string;
  userEmail: string;
  items: OrderItem[];
  canCancel: boolean;
  canReorder: boolean;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/UserProfile/orders/${orderId}`);
      setOrder(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message || "Sipariş detayları yüklenemedi",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Siparişi iptal etmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      setIsCancelling(true);
      await api.post(`/api/UserProfile/orders/${orderId}/cancel`);
      await fetchOrderDetail();
      alert("Sipariş başarıyla iptal edildi");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Sipariş iptal edilemedi");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReorder = async () => {
    try {
      setIsReordering(true);
      const response = await api.post(
        `/api/UserProfile/orders/${orderId}/reorder`,
      );
      alert("Sipariş başarıyla tekrarlandı");
      router.push(`/profile/orders/${response.data.orderId}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Sipariş tekrarlanamadı");
    } finally {
      setIsReordering(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "Pending":
        return {
          label: "Beklemede",
          color: "text-yellow-600 bg-yellow-50",
          icon: FaClock,
        };
      case "Paid":
        return {
          label: "Ödendi",
          color: "text-blue-600 bg-blue-50",
          icon: FaCheckCircle,
        };
      case "Shipped":
        return {
          label: "Kargoya Verildi",
          color: "text-purple-600 bg-purple-50",
          icon: FaTruck,
        };
      case "Delivered":
        return {
          label: "Teslim Edildi",
          color: "text-green-600 bg-green-50",
          icon: FaCheckCircle,
        };
      case "Cancelled":
        return {
          label: "İptal Edildi",
          color: "text-red-600 bg-red-50",
          icon: FaTimesCircle,
        };
      default:
        return {
          label: status,
          color: "text-gray-600 bg-gray-50",
          icon: FaClock,
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <FaTimesCircle className="text-red-500 text-5xl mx-auto mb-4" />
        <p className="text-gray-600 mb-4">{error || "Sipariş bulunamadı"}</p>
        <Link
          href="/profile/orders"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Siparişlerime Dön
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/profile/orders"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <FaArrowLeft />
            <span>Siparişlerime Dön</span>
          </Link>
          <div className="flex gap-2">
            {order.canReorder && (
              <button
                onClick={handleReorder}
                disabled={isReordering}
                className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition"
              >
                <FaRedo />
                {isReordering ? "Tekrarlanıyor..." : "Tekrar Sipariş Ver"}
              </button>
            )}
            {order.canCancel && (
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                <FaTimes />
                {isCancelling ? "İptal Ediliyor..." : "Siparişi İptal Et"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Sipariş #{order.orderNumber}
            </h1>
            <p className="text-gray-600">
              {new Date(order.orderDate).toLocaleDateString("tr-TR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center justify-end">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${statusInfo.color}`}
            >
              <StatusIcon />
              <span className="font-medium">{statusInfo.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Shipping Tracker */}
          {(order.status === "Shipped" ||
            order.status === "Delivered" ||
            order.status === "Paid") && <ShippingTracker orderId={order.id} />}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaBox />
              Sipariş Ürünleri
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0">
                    {item.productImageUrl && (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/product/${item.productSlug}`}
                      className="font-semibold hover:text-blue-600 transition"
                    >
                      {item.productName}
                    </Link>
                    <div className="text-sm text-gray-600 mt-1">
                      Adet: {item.quantity} × {item.price.toFixed(2)} ₺
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {item.subtotal.toFixed(2)} ₺
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary & Info */}
        <div className="space-y-6">
          {/* Address */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <FaMapMarkerAlt />
              Teslimat Adresi
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{order.shippingAddress}</p>
              <p>
                {order.city}, {order.country}
              </p>
              <p>{order.zipCode}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <FaCreditCard />
              Ödeme Bilgisi
            </h3>
            <div className="text-sm text-gray-600">
              <p>Ödeme ID: {order.paymentId || "Beklemede"}</p>
              <p>E-posta: {order.userEmail}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-bold mb-3">Sipariş Özeti</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ürün Sayısı:</span>
                <span>{order.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Toplam Adet:</span>
                <span>
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Toplam:</span>
                  <span className="text-blue-600">
                    {order.totalAmount.toFixed(2)} ₺
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
