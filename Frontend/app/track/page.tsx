"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import {
  FaSearch,
  FaTruck,
  FaBarcode,
  FaMapMarkerAlt,
  FaCalendar,
  FaBox,
  FaCheck,
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
  trackingHistory: ShipmentTracking[];
}

export default function TrackShipmentPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError("Lütfen takip numarası girin");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setShipment(null);
      const response = await api.get(`/api/Shipping/track/${trackingNumber}`);
      setShipment(response.data);
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (error.response?.status === 404) {
        setError("Takip numarası bulunamadı");
      } else {
        setError(error.response?.data?.message || "Kargo bilgisi yüklenemedi");
      }
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Kargo Takibi</h1>
          <p className="text-gray-600">
            Siparişinizin nerede olduğunu takip edin
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleTrack} className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Takip numaranızı girin (örn: TRK...)"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              <FaSearch />
              {isLoading ? "Sorgula nıyor..." : "Sorgula"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Shipment Details */}
        {shipment && (
          <div className="space-y-6">
            {/* Status Header */}
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
                  <p className="font-bold text-lg">
                    {shipment.shippingCompany}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm opacity-90 mb-1">
                    <FaCalendar />
                    <span>Tahmini Teslimat</span>
                  </div>
                  <p className="font-bold text-lg">
                    {shipment.estimatedDeliveryDate
                      ? new Date(
                          shipment.estimatedDeliveryDate,
                        ).toLocaleDateString("tr-TR")
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
                  <h3 className="text-2xl font-bold">
                    {shipment.statusDescription}
                  </h3>
                  {shipment.trackingHistory.length > 0 && (
                    <p className="text-gray-600 mt-1">
                      {
                        shipment.trackingHistory[
                          shipment.trackingHistory.length - 1
                        ].description
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
                            {new Date(tracking.timestamp).toLocaleString(
                              "tr-TR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaMapMarkerAlt />
                Teslimat Adresi
              </h3>
              <p className="text-gray-700">
                {shipment.shippingAddress}, {shipment.district}, {shipment.city}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {shipment.postalCode}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
