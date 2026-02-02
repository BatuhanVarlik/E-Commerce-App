"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { FaTruck, FaEdit, FaPlus } from "react-icons/fa";

interface Order {
  id: string;
  orderNumber: string;
  userEmail: string;
  totalAmount: number;
  orderDate: string;
}

interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  shippingCompany: string;
  status: string;
  statusDescription: string;
  estimatedDeliveryDate: string | null;
  order?: Order;
}

const SHIPPING_COMPANIES = ["Aras", "MNG", "Yurtici", "PTT", "UPS", "DHL"];

const SHIPMENT_STATUSES = [
  { value: "Processing", label: "İşleniyor" },
  { value: "ReadyToShip", label: "Kargoya Hazır" },
  { value: "Shipped", label: "Kargoya Verildi" },
  { value: "InTransit", label: "Yolda" },
  { value: "OutForDelivery", label: "Dağıtımda" },
  { value: "Delivered", label: "Teslim Edildi" },
  { value: "Cancelled", label: "İptal Edildi" },
  { value: "Returned", label: "İade Edildi" },
];

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Shipment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [shippingCompany, setShippingCompany] = useState("Aras");
  const [shippingAddress, setShippingAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [shippingCost, setShippingCost] = useState("25");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");

  // Update Status Modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null,
  );
  const [newStatus, setNewStatus] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setIsLoading(true);
      // In a real scenario, you'd have an admin endpoint to get all shipments
      // For now, we'll just set empty array
      setShipments([]);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Kargolar yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/Shipping", {
        orderId,
        shippingCompany,
        shippingAddress,
        city,
        district,
        postalCode,
        shippingCost: parseFloat(shippingCost),
        estimatedDeliveryDate: estimatedDeliveryDate || null,
      });
      alert("Kargo kaydı başarıyla oluşturuldu");
      setShowCreateModal(false);
      resetCreateForm();
      fetchShipments();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Kargo oluşturulamadı");
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;

    try {
      await api.put(`/api/Shipping/${selectedShipment.id}/status`, {
        status: newStatus,
        location,
        description,
      });
      alert("Kargo durumu güncellendi");
      setShowUpdateModal(false);
      resetUpdateForm();
      fetchShipments();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Durum güncellenemedi");
    }
  };

  const resetCreateForm = () => {
    setOrderId("");
    setShippingCompany("Aras");
    setShippingAddress("");
    setCity("");
    setDistrict("");
    setPostalCode("");
    setShippingCost("25");
    setEstimatedDeliveryDate("");
  };

  const resetUpdateForm = () => {
    setSelectedShipment(null);
    setNewStatus("");
    setLocation("");
    setDescription("");
  };

  const openUpdateModal = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setNewStatus(shipment.status);
    setShowUpdateModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FaTruck />
          Kargo Yönetimi
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <FaPlus />
          Yeni Kargo Kaydı
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Shipments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Takip No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sipariş
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Firma
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Teslim Tarihi
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {shipments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Henüz kargo kaydı bulunmuyor
                </td>
              </tr>
            ) : (
              shipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    {shipment.trackingNumber}
                  </td>
                  <td className="px-6 py-4">
                    {shipment.order?.orderNumber || shipment.orderId}
                  </td>
                  <td className="px-6 py-4">{shipment.shippingCompany}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {shipment.statusDescription}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {shipment.estimatedDeliveryDate
                      ? new Date(
                          shipment.estimatedDeliveryDate,
                        ).toLocaleDateString("tr-TR")
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openUpdateModal(shipment)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Shipment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Yeni Kargo Kaydı</h2>
              <form onSubmit={handleCreateShipment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Sipariş ID *
                    </label>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Sipariş ID'sini girin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Kargo Firması *
                    </label>
                    <select
                      value={shippingCompany}
                      onChange={(e) => setShippingCompany(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {SHIPPING_COMPANIES.map((company) => (
                        <option key={company} value={company}>
                          {company}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Kargo Ücreti *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Teslimat Adresi *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      İlçe *
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      İl *
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Posta Kodu *
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Tahmini Teslimat
                    </label>
                    <input
                      type="date"
                      value={estimatedDeliveryDate}
                      onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Oluştur
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateModal && selectedShipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Durum Güncelle</h2>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Takip No:</p>
                <p className="font-medium">{selectedShipment.trackingNumber}</p>
              </div>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Yeni Durum *
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {SHIPMENT_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Konum *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="örn: İstanbul Avrupa Transfer Merkezi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Açıklama *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Durum açıklaması girin"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUpdateModal(false);
                      resetUpdateForm();
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Güncelle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
