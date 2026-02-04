"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  FaMapMarkerAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
} from "react-icons/fa";

interface Address {
  id: string;
  title: string;
  fullName: string;
  phoneNumber: string;
  city: string;
  district: string;
  neighborhood: string;
  street: string;
  buildingNo: string;
  apartmentNo: string;
  postalCode: string;
  isDefault: boolean;
  type: string;
  formattedAddress: string;
}

interface AddressFormData {
  title: string;
  fullName: string;
  phoneNumber: string;
  city: string;
  district: string;
  neighborhood: string;
  street: string;
  buildingNo: string;
  apartmentNo: string;
  postalCode: string;
  isDefault: boolean;
  type: number;
}

const emptyForm: AddressFormData = {
  title: "",
  fullName: "",
  phoneNumber: "",
  city: "",
  district: "",
  neighborhood: "",
  street: "",
  buildingNo: "",
  apartmentNo: "",
  postalCode: "",
  isDefault: false,
  type: 2, // Both
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await api.get("/api/UserProfile/addresses");
      setAddresses(response.data);
    } catch {
      setError("Adresler yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (address?: Address) => {
    if (address) {
      setEditingId(address.id);
      setFormData({
        title: address.title,
        fullName: address.fullName,
        phoneNumber: address.phoneNumber,
        city: address.city,
        district: address.district,
        neighborhood: address.neighborhood,
        street: address.street,
        buildingNo: address.buildingNo,
        apartmentNo: address.apartmentNo,
        postalCode: address.postalCode,
        isDefault: address.isDefault,
        type:
          address.type === "Billing" ? 0 : address.type === "Shipping" ? 1 : 2,
      });
    } else {
      setEditingId(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
    setError("");
    setSuccess("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await api.put(`/api/UserProfile/addresses/${editingId}`, formData);
        setSuccess("Adres güncellendi");
      } else {
        await api.post("/api/UserProfile/addresses", formData);
        setSuccess("Adres eklendi");
      }
      fetchAddresses();
      handleCloseModal();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "İşlem başarısız");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu adresi silmek istediğinizden emin misiniz?")) return;

    try {
      await api.delete(`/api/UserProfile/addresses/${id}`);
      setSuccess("Adres silindi");
      fetchAddresses();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Adres silinemedi");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/api/UserProfile/addresses/${id}/set-default`);
      setSuccess("Varsayılan adres güncellendi");
      fetchAddresses();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "İşlem başarısız");
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Adreslerim</h2>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FaPlus />
            Yeni Adres Ekle
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FaMapMarkerAlt className="mx-auto mb-4 text-gray-400 text-5xl" />
          <h3 className="text-xl font-semibold mb-2">
            Henüz adres eklemediniz
          </h3>
          <p className="text-gray-600 mb-6">
            Hızlı teslimat için adresinizi ekleyin
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            İlk Adresimi Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`bg-white rounded-lg shadow-md p-6 border-2 transition ${
                address.isDefault ? "border-blue-500" : "border-transparent"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-blue-600" />
                  <h3 className="font-semibold text-lg">{address.title}</h3>
                </div>
                {address.isDefault && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded flex items-center gap-1">
                    <FaCheck className="text-xs" />
                    Varsayılan
                  </span>
                )}
              </div>

              <p className="font-medium mb-2">{address.fullName}</p>
              <p className="text-gray-600 text-sm mb-2">
                {address.phoneNumber}
              </p>
              <p className="text-gray-700 text-sm mb-3">
                {address.formattedAddress}
              </p>

              <div className="flex gap-2 pt-3 border-t">
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="flex-1 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm"
                  >
                    Varsayılan Yap
                  </button>
                )}
                <button
                  onClick={() => handleOpenModal(address)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                  disabled={address.isDefault}
                  title={address.isDefault ? "Varsayılan adres silinemez" : ""}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-6">
                {editingId ? "Adresi Düzenle" : "Yeni Adres Ekle"}
              </h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adres Başlığı *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Ev, İş, vb."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder="05XX XXX XX XX"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      İl *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      İlçe *
                    </label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) =>
                        setFormData({ ...formData, district: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mahalle *
                    </label>
                    <input
                      type="text"
                      value={formData.neighborhood}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          neighborhood: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sokak/Cadde *
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) =>
                      setFormData({ ...formData, street: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bina No *
                    </label>
                    <input
                      type="text"
                      value={formData.buildingNo}
                      onChange={(e) =>
                        setFormData({ ...formData, buildingNo: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Daire No *
                    </label>
                    <input
                      type="text"
                      value={formData.apartmentNo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          apartmentNo: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posta Kodu *
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adres Tipi *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Fatura Adresi</option>
                    <option value={1}>Teslimat Adresi</option>
                    <option value={2}>Her İkisi</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isDefault"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Varsayılan adres olarak ayarla
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {editingId ? "Güncelle" : "Kaydet"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    İptal
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
