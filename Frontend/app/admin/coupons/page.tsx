"use client";

import { useEffect, useState } from "react";
import { couponApi } from "@/lib/api";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";

interface Coupon {
  id: string;
  code: string;
  type: number;
  value: number;
  minimumAmount: number;
  maxUsage: number;
  currentUsage: number;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    type: "0",
    value: "",
    minimumAmount: "",
    maxUsage: "",
    startDate: "",
    expiryDate: "",
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await couponApi.getAll();
      setCoupons(res.data);
    } catch (error) {
      console.error("Kuponlar yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        code: formData.code.toUpperCase(),
        type: parseInt(formData.type),
        value: parseFloat(formData.value),
        minimumAmount: parseFloat(formData.minimumAmount),
        maxUsage: parseInt(formData.maxUsage),
        startDate: new Date(formData.startDate).toISOString(),
        expiryDate: new Date(formData.expiryDate).toISOString(),
      };

      if (editingCoupon) {
        await couponApi.update(editingCoupon.id, data);
      } else {
        await couponApi.create(data);
      }

      setShowModal(false);
      resetForm();
      fetchCoupons();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Hata oluştu");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kuponu silmek istediğinizden emin misiniz?")) return;

    try {
      await couponApi.delete(id);
      fetchCoupons();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Silme hatası");
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await couponApi.update(coupon.id, { isActive: !coupon.isActive });
      fetchCoupons();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Güncelleme hatası");
    }
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type.toString(),
      value: coupon.value.toString(),
      minimumAmount: coupon.minimumAmount.toString(),
      maxUsage: coupon.maxUsage.toString(),
      startDate: new Date(coupon.startDate).toISOString().split("T")[0],
      expiryDate: new Date(coupon.expiryDate).toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      type: "0",
      value: "",
      minimumAmount: "",
      maxUsage: "",
      startDate: "",
      expiryDate: "",
    });
  };

  const getCouponTypeName = (type: number) => {
    const types = [
      "Yüzde İndirim",
      "Sabit İndirim",
      "Ücretsiz Kargo",
      "Hediye Ürün",
    ];
    return types[type] || "Bilinmeyen";
  };

  if (loading) {
    return <div className="p-10 text-center">Yükleniyor...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Kupon Yönetimi</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-custom-orange text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <FaPlus />
          Yeni Kupon
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Kod
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tip
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Değer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Min. Tutar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Kullanım
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Son Tarih
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono font-bold text-custom-orange">
                    {coupon.code}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {getCouponTypeName(coupon.type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {coupon.type === 0 ? `%${coupon.value}` : `${coupon.value}₺`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {coupon.minimumAmount.toLocaleString("tr-TR")}₺
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {coupon.currentUsage} / {coupon.maxUsage}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(coupon.expiryDate).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(coupon)}
                    className={`flex items-center gap-1 text-sm font-medium ${
                      coupon.isActive ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {coupon.isActive ? (
                      <FaToggleOn size={20} />
                    ) : (
                      <FaToggleOff size={20} />
                    )}
                    {coupon.isActive ? "Aktif" : "Pasif"}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(coupon)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {coupons.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Henüz kupon bulunmuyor. Yeni kupon ekleyin.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingCoupon ? "Kupon Düzenle" : "Yeni Kupon Ekle"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kupon Kodu *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-custom-orange focus:border-transparent"
                    required
                    disabled={!!editingCoupon}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kupon Tipi *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-custom-orange focus:border-transparent"
                    required
                  >
                    <option value="0">Yüzde İndirim</option>
                    <option value="1">Sabit İndirim</option>
                    <option value="2">Ücretsiz Kargo</option>
                    <option value="3">Hediye Ürün</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Değer * {formData.type === "0" ? "(%)" : "(₺)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-custom-orange focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Tutar (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minimumAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimumAmount: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-custom-orange focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maksimum Kullanım *
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsage}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUsage: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-custom-orange focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlangıç Tarihi *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-custom-orange focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitiş Tarihi *
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-custom-orange focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-custom-orange text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  {editingCoupon ? "Güncelle" : "Oluştur"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
