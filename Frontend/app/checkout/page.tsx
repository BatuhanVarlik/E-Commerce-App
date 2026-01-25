"use client";

import { useCart } from "@/context/CartContext";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function CheckoutPage() {
  const { cart, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Form States
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

  if (cartLoading) return <div className="p-10 text-center">Yükleniyor...</div>;
  if (!cart || cart.items.length === 0) {
    return <div className="p-10 text-center">Sepetiniz boş.</div>;
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      // Force redirect if not logged in (backend guards it too)
      router.push("/login");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5162/api/Checkout",
        {
          cardHolderName,
          cardNumber: cardNumber.replace(/\s/g, ""),
          expireMonth,
          expireYear,
          cvc,
          address,
          city,
          zipCode,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      // On success
      await clearCart();
      router.push(`/checkout/success?orderId=${response.data.orderId}`);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || "Ödeme sırasında bir hata oluştu."
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
            <h2 className="mb-4 text-xl font-semibold text-custom-red border-b pb-2">
              Teslimat Adresi
            </h2>
            <div className="grid grid-cols-1 gap-4">
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
            </div>
            {/* ... existing fields ... */}
            <div className="grid grid-cols-2 gap-4 mt-4">
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
                  "tr-TR"
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
