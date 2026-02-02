"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaBox,
} from "react-icons/fa";

interface ProductVariant {
  id: string;
  productId: string;
  color?: string;
  size?: string;
  material?: string;
  style?: string;
  sku: string;
  priceAdjustment?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl?: string;
  additionalImages: string[];
  isActive: boolean;
  isDefault: boolean;
  weight?: number;
  dimensions?: string;
}

interface VariantValue {
  id: string;
  value: string;
  displayName?: string;
  colorCode?: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function ProductVariantsPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(
    null,
  );

  const [formData, setFormData] = useState({
    color: "",
    size: "",
    material: "",
    style: "",
    sku: "",
    priceAdjustment: 0,
    stockQuantity: 0,
    lowStockThreshold: 5,
    imageUrl: "",
    isActive: true,
    isDefault: false,
    weight: 0,
    dimensions: "",
  });

  const fetchProduct = React.useCallback(async () => {
    try {
      const response = await api.get(`/api/Products/${productId}`);
      setProduct(response.data);
    } catch (err) {
      console.error("Urun bilgileri yuklenirken hata:", err);
    }
  }, [productId]);

  const fetchVariants = React.useCallback(async () => {
    try {
      const response = await api.get(
        `/api/ProductVariants/product/${productId}`,
      );
      setVariants(response.data.variants || []);
    } catch (err) {
      console.error("Varyantlar yuklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
    fetchVariants();
  }, [fetchProduct, fetchVariants]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const variantData = {
        productId,
        ...formData,
      };

      if (editingVariant) {
        await api.put(`/api/ProductVariants/${editingVariant.id}`, variantData);
        alert("Varyant başarıyla güncellendi!");
      } else {
        await api.post("/api/ProductVariants", variantData);
        alert("Varyant başarıyla eklendi!");
      }

      resetForm();
      fetchVariants();
    } catch (err) {
      const errorMessage =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Varyant kaydedilemedi"
          : "Varyant kaydedilemedi";
      alert("Hata: " + errorMessage);
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      color: variant.color || "",
      size: variant.size || "",
      material: variant.material || "",
      style: variant.style || "",
      sku: variant.sku,
      priceAdjustment: variant.priceAdjustment || 0,
      stockQuantity: variant.stockQuantity,
      lowStockThreshold: variant.lowStockThreshold,
      imageUrl: variant.imageUrl || "",
      isActive: variant.isActive,
      isDefault: variant.isDefault,
      weight: variant.weight || 0,
      dimensions: variant.dimensions || "",
    });
    setShowAddForm(true);
  };

  const handleDelete = async (variantId: string) => {
    if (!confirm("Bu varyanti silmek istediginizden emin misiniz?")) {
      return;
    }

    try {
      await api.delete(`/api/ProductVariants/${variantId}`);
      alert("Varyant basariyla silindi!");
      fetchVariants();
    } catch (err) {
      const errorMessage =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Varyant silinemedi"
          : "Varyant silinemedi";
      alert("Hata: " + errorMessage);
    }
  };

  const handleUpdateStock = async (variantId: string, newStock: number) => {
    try {
      await api.post(`/api/ProductVariants/${variantId}/stock`, {
        stockQuantity: newStock,
      });
      fetchVariants();
    } catch {
      alert("Stok guncellenemedi");
    }
  };

  const resetForm = () => {
    setFormData({
      color: "",
      size: "",
      material: "",
      style: "",
      sku: "",
      priceAdjustment: 0,
      stockQuantity: 0,
      lowStockThreshold: 5,
      imageUrl: "",
      isActive: true,
      isDefault: false,
      weight: 0,
      dimensions: "",
    });
    setEditingVariant(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Ürün Varyantları</h1>
          {product && (
            <p className="text-gray-600 mt-1">
              {product.name} - Ana Fiyat: {product.price.toFixed(2)} TL
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          {showAddForm ? <FaTimes /> : <FaPlus />}
          {showAddForm ? "İptal" : "Yeni Varyant Ekle"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingVariant ? "Varyant Düzenle" : "Yeni Varyant Ekle"}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Renk
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: Kırmızı"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beden
              </label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: M, L, XL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Malzeme
              </label>
              <input
                type="text"
                name="material"
                value={formData.material}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stil
              </label>
              <input
                type="text"
                name="style"
                value={formData.style}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fiyat Farkı (TL)
              </label>
              <input
                type="number"
                step="0.01"
                name="priceAdjustment"
                value={formData.priceAdjustment}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stok Miktarı *
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Düşük Stok Eşiği
              </label>
              <input
                type="number"
                name="lowStockThreshold"
                value={formData.lowStockThreshold}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Görsel URL
              </label>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ağırlık (kg)
              </label>
              <input
                type="number"
                step="0.01"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Boyutlar
              </label>
              <input
                type="text"
                name="dimensions"
                value={formData.dimensions}
                onChange={handleInputChange}
                placeholder="Örn: 20x30x10 cm"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Aktif</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  Varsayılan
                </span>
              </label>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <FaSave />
                {editingVariant ? "Güncelle" : "Kaydet"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Özellikler
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fiyat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stok
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {variants.map((variant) => (
              <tr
                key={variant.id}
                className={!variant.isActive ? "bg-gray-50" : ""}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {variant.sku}
                  {variant.isDefault && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      Varsayılan
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="space-y-1">
                    {variant.color && <div>Renk: {variant.color}</div>}
                    {variant.size && <div>Beden: {variant.size}</div>}
                    {variant.material && <div>Malzeme: {variant.material}</div>}
                    {variant.style && <div>Stil: {variant.style}</div>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product && (
                    <>
                      {(product.price + (variant.priceAdjustment || 0)).toFixed(
                        2,
                      )}{" "}
                      TL
                      {variant.priceAdjustment !== 0 && (
                        <div
                          className={`text-xs ${variant.priceAdjustment! > 0 ? "text-red-600" : "text-green-600"}`}
                        >
                          ({variant.priceAdjustment! > 0 ? "+" : ""}
                          {variant.priceAdjustment?.toFixed(2)} TL)
                        </div>
                      )}
                    </>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      defaultValue={variant.stockQuantity}
                      onBlur={(e) => {
                        const newStock = parseInt(e.target.value);
                        if (newStock !== variant.stockQuantity) {
                          handleUpdateStock(variant.id, newStock);
                        }
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                    />
                    <span
                      className={`text-xs ${
                        variant.stockQuantity <= variant.lowStockThreshold
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {variant.stockQuantity <= variant.lowStockThreshold
                        ? "Düşük"
                        : "Yeterli"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      variant.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {variant.isActive ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(variant)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(variant.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {variants.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FaBox className="mx-auto text-4xl mb-4" />
            <p>Henüz varyant eklenmemiş</p>
          </div>
        )}
      </div>
    </div>
  );
}
