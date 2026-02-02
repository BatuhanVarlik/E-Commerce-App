"use client";

import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { FaMapMarkerAlt, FaPlus, FaCheck } from "react-icons/fa";

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
  formattedAddress: string;
}

export default function CheckoutPage() {
  const { cart, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Saved Addresses
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  // Manual Address Form States
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");

  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expireMonth, setExpireMonth] = useState("");
  const [expireYear, setExpireYear] = useState("");
  const [cvc, setCvc] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const response = await api.get("/api/UserProfile/addresses");
      setSavedAddresses(response.data);
      // Auto-select default address
      const defaultAddr = response.data.find((addr: Address) => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (err) {
      console.error("Adresler yüklenemedi:", err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    setUseManualAddress(false);
  };

  if (cartLoading) return <div className="p-10 text-center">Yükleniyor...</div>;
  if (!cart || cart.items.length === 0) {
    return <div className="p-10 text-center">Sepetiniz boş.</div>;
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    // Validate address selection
    if (!useManualAddress && !selectedAddressId) {
      setError("Lütfen bir teslimat adresi seçin");
      return;
    }

    if (useManualAddress && (!address || !city || !zipCode)) {
      setError("Lütfen adres bilgilerini eksiksiz doldurun");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      let addressData;

      if (useManualAddress) {
        // Use manual address
        addressData = {
          address,
          city,
          zipCode,
        };
      } else {
        // Use saved address
        const selectedAddr = savedAddresses.find(
          (addr) => addr.id === selectedAddressId,
        );
        if (!selectedAddr) {
          setError("Seçili adres bulunamadı");
          setIsProcessing(false);
          return;
        }
        addressData = {
          address:
            selectedAddr.formattedAddress ||
            `${selectedAddr.street} No:${selectedAddr.buildingNo}, ${selectedAddr.neighborhood}`,
          city: selectedAddr.city,
          zipCode: selectedAddr.postalCode,
        };
      }

      const response = await api.post("/api/Checkout", {
        cardHolderName,
        cardNumber: cardNumber.replace(/\s/g, ""),
        expireMonth,
        expireYear,
        cvc,
        ...addressData,
      });

      await clearCart();
      router.push(`/checkout/success?orderId=${response.data.orderId}`);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Ödeme sırasında bir hata oluştu.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-800">Ödeme Yap</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Forms */}
        <form onSubmit={handleCheckout} className="space-y-8">
          {/* Shipping Address */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-custom-red border-b pb-2 flex-1">
                Teslimat Adresi
              </h2>
              {savedAddresses.length > 0 && (
                <Link
                  href="/profile/addresses"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Adresleri Yönet
                </Link>
              )}
            </div>

            {isLoadingAddresses ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-red"></div>
              </div>
            ) : savedAddresses.length > 0 ? (
              <div className="space-y-4">
                {/* Saved Addresses */}
                <div className="space-y-3">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => handleAddressSelect(addr.id)}
                      className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedAddressId === addr.id && !useManualAddress
                          ? "border-custom-red bg-red-50 ring-2 ring-custom-red"
                          : "border-gray-300 hover:border-custom-orange"
                      }`}
                    >
                      {selectedAddressId === addr.id && !useManualAddress && (
                        <div className="absolute top-3 right-3 text-custom-red">
                          <FaCheck className="text-xl" />
                        </div>
                      )}
                      <div className="flex items-start gap-3 pr-8">
                        <FaMapMarkerAlt className="text-custom-red mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {addr.title}
                          </div>
                          <div className="text-sm text-gray-700 mt-1">
                            {addr.fullName}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {addr.formattedAddress ||
                              `${addr.street} No:${addr.buildingNo}, ${addr.neighborhood}, ${addr.district}/${addr.city}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {addr.postalCode} - {addr.phoneNumber}
                          </div>
                          {addr.isDefault && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              Varsayılan Adres
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Manual Address Option */}
                <button
                  type="button"
                  onClick={() => {
                    setUseManualAddress(!useManualAddress);
                    if (!useManualAddress) {
                      setSelectedAddressId("");
                    }
                  }}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-custom-orange transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-custom-orange"
                >
                  <FaPlus />
                  <span>Farklı Bir Adres Kullan</span>
                </button>

                {/* Manual Address Form */}
                {useManualAddress && (
                  <div className="border border-custom-orange rounded-lg p-4 bg-orange-50 space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Adres
                      </label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-custom-orange focus:ring-1 focus:ring-custom-orange outline-none"
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required={useManualAddress}
                      ></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Şehir
                        </label>
                        <input
                          type="text"
                          className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-custom-orange focus:ring-1 focus:ring-custom-orange outline-none"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required={useManualAddress}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Posta Kodu
                        </label>
                        <input
                          type="text"
                          className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-custom-orange focus:ring-1 focus:ring-custom-orange outline-none"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          required={useManualAddress}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Kayıtlı adresiniz yok</p>
                <Link
                  href="/profile/addresses"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-custom-red text-white rounded-lg hover:bg-red-700 transition"
                >
                  <FaPlus />
                  Adres Ekle
                </Link>
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600 mb-3">
                    veya şimdi adres girin:
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Adres
                      </label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-custom-orange focus:ring-1 focus:ring-custom-orange outline-none"
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      ></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Şehir
                        </label>
                        <input
                          type="text"
                          className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-custom-orange focus:ring-1 focus:ring-custom-orange outline-none"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Posta Kodu
                        </label>
                        <input
                          type="text"
                          className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-custom-orange focus:ring-1 focus:ring-custom-orange outline-none"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-custom-red border-b pb-2">
              Kart Bilgileri
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kart Üzerindeki İsim
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-custom-orange focus:ring-1 focus:ring-custom-orange outline-none"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kart Numarası
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-custom-orange focus:ring-1 focus:ring-custom-orange outline-none"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  maxLength={19}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ay
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-custom-orange focus:ring-1 focus:ring-custom-orange outline-none"
                    placeholder="MM"
                    maxLength={2}
                    value={expireMonth}
                    onChange={(e) => setExpireMonth(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Yıl
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-custom-orange focus:ring-1 focus:ring-custom-orange outline-none"
                    placeholder="YY"
                    maxLength={2}
                    value={expireYear}
                    onChange={(e) => setExpireYear(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    CVC
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-custom-orange focus:ring-1 focus:ring-custom-orange outline-none"
                    maxLength={3}
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full rounded-lg bg-custom-red py-4 font-bold text-white transition-all hover:bg-red-700 hover:-translate-y-1 hover:shadow-lg disabled:bg-gray-400 disabled:transform-none"
          >
            {isProcessing
              ? "İşleniyor..."
              : `Ödemeyi Tamamla (${cart.totalPrice.toLocaleString(
                  "tr-TR",
                )} ₺)`}
          </button>
        </form>

        {/* Cart Summary */}
        <div className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900 border-b pb-2">
            Sipariş Özeti
          </h2>
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between text-sm"
              >
                <span>
                  {item.productName} (x{item.quantity})
                </span>
                <span>
                  {(item.price * item.quantity).toLocaleString("tr-TR")} ₺
                </span>
              </div>
            ))}
            <div className="border-t pt-4 flex justify-between font-bold text-lg text-custom-red">
              <span>Toplam</span>
              <span>{cart.totalPrice.toLocaleString("tr-TR")} ₺</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
