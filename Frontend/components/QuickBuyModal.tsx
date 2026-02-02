"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { FaTimes, FaCreditCard, FaMapMarkerAlt } from "react-icons/fa";

interface Address {
  id: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface QuickBuyModalProps {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  variantId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickBuyModal({
  productId,
  productName,
  productImage,
  price,
  variantId,
  onClose,
  onSuccess,
}: QuickBuyModalProps) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await api.get("/api/UserProfile/addresses", {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        setAddresses(response.data);

        // Auto-select default address
        const defaultAddress = response.data.find(
          (addr: Address) => addr.isDefault,
        );
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (response.data.length > 0) {
          setSelectedAddressId(response.data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch addresses:", err);
        setError("Adresler yuklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [user]);

  const handleQuickBuy = async () => {
    if (!selectedAddressId) {
      setError("Lutfen bir adres secin.");
      return;
    }

    if (!user) {
      setError("Lutfen once giris yapin.");
      return;
    }

    try {
      setProcessing(true);
      setError("");

      // Create order directly (skip cart)
      const orderData = {
        items: [
          {
            productId,
            variantId: variantId || null,
            quantity: 1,
            price,
          },
        ],
        shippingAddressId: selectedAddressId,
        billingAddressId: selectedAddressId,
        paymentMethod: "CreditCard",
        notes: "Hizli satin alma",
      };

      const response = await api.post("/api/Orders", orderData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.status === 200 || response.status === 201) {
        onSuccess();
      }
    } catch (err: unknown) {
      console.error("Quick buy failed:", err);
      if (err instanceof Error && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(
          axiosError.response?.data?.message || "Siparis olusturulamadi.",
        );
      } else {
        setError("Siparis olusturulamadi.");
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Hizli Satin Al</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <p className="text-center py-8 text-gray-600">
            Hizli satin alma icin once giris yapmaniz gerekiyor.
          </p>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Kapat
            </button>
            <a
              href="/login"
              className="flex-1 py-2 px-4 bg-custom-red text-white rounded-lg hover:bg-orange-700 text-center"
            >
              Giris Yap
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Hizli Satin Al</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Product Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              <Image
                src={productImage || "/placeholder-product.png"}
                alt={productName}
                fill
                className="object-cover rounded-lg"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{productName}</h3>
              <p className="text-2xl font-bold text-custom-red mt-1">
                {price.toFixed(2)} TL
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-red mx-auto"></div>
              <p className="mt-4 text-gray-600">Adresler yukleniyor...</p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8">
              <FaMapMarkerAlt
                className="mx-auto text-gray-400 mb-4"
                size={48}
              />
              <p className="text-gray-600 mb-4">
                Kayitli adresiniz yok. Lutfen once bir adres ekleyin.
              </p>
              <a
                href="/profile/addresses"
                className="inline-block px-6 py-2 bg-custom-red text-white rounded-lg hover:bg-orange-700"
              >
                Adres Ekle
              </a>
            </div>
          ) : (
            <>
              {/* Delivery Address */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-custom-red" />
                  Teslimat Adresi
                </h3>

                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAddressId === address.id
                          ? "border-custom-red bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{address.fullName}</p>
                            {address.isDefault && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                Varsayilan
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {address.addressLine1}
                            {address.addressLine2 &&
                              `, ${address.addressLine2}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.state} {address.postalCode}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.phoneNumber}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FaCreditCard className="text-custom-red" />
                  Odeme Yontemi
                </h3>
                <div className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600">
                    Kredi Karti / Banka Karti ile odeme yapilacaktir.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Odeme sayfasina yonlendirileceksiniz.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Urun Fiyati:</span>
                  <span className="font-semibold">{price.toFixed(2)} TL</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Kargo:</span>
                  <span className="font-semibold text-green-600">Ucretsiz</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold border-t pt-2">
                  <span>Toplam:</span>
                  <span className="text-custom-red">{price.toFixed(2)} TL</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  disabled={processing}
                  className="flex-1 py-3 px-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Iptal
                </button>
                <button
                  onClick={handleQuickBuy}
                  disabled={processing || !selectedAddressId}
                  className="flex-1 py-3 px-6 bg-custom-red text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Isleniyor...
                    </span>
                  ) : (
                    "Siparisi Tamamla"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
