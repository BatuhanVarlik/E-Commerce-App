"use client";

import { useEffect, useState } from "react";
import { couponApi } from "@/lib/api";
import {
  FaTag,
  FaCalendar,
  FaShoppingCart,
  FaCopy,
  FaCheck,
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

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await couponApi.getActive();
      setCoupons(res.data);
    } catch (error) {
      console.error("Kuponlar yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getCouponTypeName = (type: number) => {
    switch (type) {
      case 0:
        return "Yüzde İndirim";
      case 1:
        return "Sabit İndirim";
      case 2:
        return "Ücretsiz Kargo";
      case 3:
        return "Hediye Ürün";
      default:
        return "İndirim";
    }
  };

  const getCouponValue = (coupon: Coupon) => {
    if (coupon.type === 0) {
      return `%${coupon.value}`;
    }
    return `${coupon.value}₺`;
  };

  const getRemainingDays = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Kullanılabilir Kuponlar
        </h1>
        <p className="text-gray-600">
          Sepetinizde kullanabileceğiniz aktif kupon kodları
        </p>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-16">
          <FaTag className="mx-auto text-gray-300 text-6xl mb-4" />
          <p className="text-gray-500 text-lg">
            Şu anda kullanılabilir kupon bulunmuyor
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => {
            const remainingDays = getRemainingDays(coupon.expiryDate);
            const remainingUsage = coupon.maxUsage - coupon.currentUsage;

            return (
              <div
                key={coupon.id}
                className="bg-gradient-to-br from-custom-orange to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all relative overflow-hidden"
              >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 opacity-10">
                  <FaTag className="text-9xl -mr-8 -mt-8" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                      {getCouponTypeName(coupon.type)}
                    </span>
                    {remainingDays <= 7 && (
                      <span className="bg-red-500 px-2 py-1 rounded text-xs font-bold">
                        {remainingDays} gün kaldı!
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="text-4xl font-bold mb-2">
                      {getCouponValue(coupon)}
                    </div>
                    <div className="text-sm opacity-90">İndirim</div>
                  </div>

                  {/* Coupon Code */}
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs opacity-75 mb-1">
                          Kupon Kodu
                        </div>
                        <div className="text-xl font-mono font-bold tracking-wider">
                          {coupon.code}
                        </div>
                      </div>
                      <button
                        onClick={() => copyCode(coupon.code)}
                        className="bg-white text-custom-orange px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        {copiedCode === coupon.code ? (
                          <>
                            <FaCheck size={14} />
                            <span className="text-sm font-medium">
                              Kopyalandı
                            </span>
                          </>
                        ) : (
                          <>
                            <FaCopy size={14} />
                            <span className="text-sm font-medium">Kopyala</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <FaShoppingCart className="opacity-75" />
                      <span>
                        Minimum: {coupon.minimumAmount.toLocaleString("tr-TR")}₺
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaCalendar className="opacity-75" />
                      <span>
                        {new Date(coupon.expiryDate).toLocaleDateString(
                          "tr-TR",
                        )}{" "}
                        tarihine kadar
                      </span>
                    </div>
                    <div className="flex items-center gap-2 opacity-75">
                      <span>
                        Kalan kullanım: {remainingUsage}/{coupon.maxUsage}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-12 bg-blue-50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          💡 Kupon Kullanım Bilgileri
        </h2>
        <ul className="space-y-2 text-gray-600 text-sm">
          <li>
            • Kupon kodunu sepet sayfasında &quot;İndirim Kuponu&quot; bölümüne
            girin
          </li>
          <li>
            • Her kupon sadece belirtilen minimum tutarın üzerindeki
            siparişlerde geçerlidir
          </li>
          <li>• Bir siparişte yalnızca bir kupon kullanılabilir</li>
          <li>• Kuponlar belirtilen son kullanma tarihine kadar geçerlidir</li>
        </ul>
      </div>
    </div>
  );
}
