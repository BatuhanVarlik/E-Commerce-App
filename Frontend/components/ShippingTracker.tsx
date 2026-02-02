"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  FaBox,
  FaTruck,
  FaCheck,
  FaMapMarkerAlt,
  FaCalendar,
  FaBarcode,
} from "react-icons/fa";

interface ShipmentTracking {
  id: string;
  status: string;
  statusDescription: string;
  location: string;
  description: string;
  timestamp: string;
}

interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  shippingCompany: string;
  status: string;
  statusDescription: string;
  shippingAddress: string;
  city: string;
  district: string;
  postalCode: string;
  shippedDate: string | null;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  shippingCost: number;
  notes: string | null;
  trackingHistory: ShipmentTracking[];
}

interface Props {
  orderId: string;
}

export default function ShippingTracker({ orderId }: Props) {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchShipment();
  }, [orderId]);

  const fetchShipment = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/Shipping/order/${orderId}`);
      setShipment(response.data);
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (error.response?.status === 404) {
        setError("Bu sipariş için henüz kargo kaydı oluşturulmamış");
      } else {
        setError(error.response?.data?.message || "Kargo bilgisi yüklenemedi");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-yellow-800">{error}</p>
      </div>
    );
  }

  if (!shipment) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Processing":
        return <FaBox className="text-yellow-500" />;
      case "ReadyToShip":
        return <FaBox className="text-blue-500" />;
      case "Shipped":
      case "InTransit":
        return <FaTruck className="text-purple-500" />;
      case "OutForDelivery":
        return <FaTruck className="text-orange-500" />;
      case "Delivered":
        return <FaCheck className="text-green-500" />;
      default:
        return <FaBox className="text-gray-500" />;
    }
  };

  const isCompleted = (index: number) => {
    const statusOrder = [
      "Processing",
      "ReadyToShip",
      "Shipped",
      "InTransit",
      "OutForDelivery",
      "Delivered",
    ];
    const currentIndex = statusOrder.indexOf(shipment.status);
    return index <= currentIndex;
  };

  return (
    <div className="space-y-6">
      {/* Tracking Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm opacity-90 mb-1">
              <FaBarcode />
              <span>Takip Numarası</span>
            </div>
            <p className="font-bold text-lg">{shipment.trackingNumber}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm opacity-90 mb-1">
              <FaTruck />
              <span>Kargo Firması</span>
            </div>
            <p className="font-bold text-lg">{shipment.shippingCompany}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm opacity-90 mb-1">
              <FaCalendar />
              <span>Tahmini Teslimat</span>
            </div>
            <p className="font-bold text-lg">
              {shipment.estimatedDeliveryDate
                ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString(
                    "tr-TR",
                  )
                : "Belirlenmedi"}
            </p>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{getStatusIcon(shipment.status)}</div>
          <div>
            <h3 className="text-2xl font-bold">{shipment.statusDescription}</h3>
            {shipment.trackingHistory.length > 0 && (
              <p className="text-gray-600 mt-1">
                {
                  shipment.trackingHistory[shipment.trackingHistory.length - 1]
                    .description
                }
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-6">Kargo Geçmişi</h3>
        <div className="space-y-4">
          {shipment.trackingHistory
            .slice()
            .reverse()
            .map((tracking, index) => (
              <div key={tracking.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index === 0
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {getStatusIcon(tracking.status)}
                  </div>
                  {index < shipment.trackingHistory.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-300 my-1 flex-1 min-h-[40px]"></div>
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">
                        {tracking.statusDescription}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {tracking.description}
                      </p>
                      {tracking.location && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <FaMapMarkerAlt className="text-xs" />
                          {tracking.location}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                      {new Date(tracking.timestamp).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Shipping Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Teslimat Bilgileri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Teslimat Adresi</p>
            <p className="font-medium">
              {shipment.shippingAddress}, {shipment.district}, {shipment.city}
            </p>
            <p className="text-sm text-gray-600">{shipment.postalCode}</p>
          </div>
          {shipment.shippedDate && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Kargoya Verilme</p>
              <p className="font-medium">
                {new Date(shipment.shippedDate).toLocaleDateString("tr-TR")}
              </p>
            </div>
          )}
          {shipment.actualDeliveryDate && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Teslim Tarihi</p>
              <p className="font-medium">
                {new Date(shipment.actualDeliveryDate).toLocaleDateString(
                  "tr-TR",
                )}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 mb-1">Kargo Ücreti</p>
            <p className="font-medium">{shipment.shippingCost.toFixed(2)} ₺</p>
          </div>
        </div>
      </div>
    </div>
  );
}
