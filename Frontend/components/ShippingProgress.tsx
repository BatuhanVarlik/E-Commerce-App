"use client";

import { FaTruck } from "react-icons/fa";

interface ShippingProgressProps {
  subtotal: number;
}

export default function ShippingProgress({ subtotal }: ShippingProgressProps) {
  const FREE_SHIPPING_THRESHOLD = 500;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const qualifies = subtotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FaTruck
            className={`text-2xl ${qualifies ? "text-green-600" : "text-blue-600"}`}
          />
          <span className="font-semibold text-gray-800">
            {qualifies ? (
              <span className="text-green-600">✓ Ücretsiz Kargo</span>
            ) : (
              <span className="text-blue-700">Ücretsiz Kargo</span>
            )}
          </span>
        </div>
        {!qualifies && (
          <span className="text-sm text-gray-600">
            {remaining.toFixed(2)}₺ kaldı
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            qualifies
              ? "bg-linear-to-r from-green-500 to-green-600"
              : "bg-linear-to-r from-blue-500 to-indigo-600"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {!qualifies && (
        <p className="text-xs text-gray-600 mt-2 text-center">
          {remaining.toFixed(2)}₺ değerinde daha ürün ekleyin ve kargo ücretsiz
          olsun!
        </p>
      )}

      {qualifies && (
        <p className="text-xs text-green-700 mt-2 text-center font-semibold">
          🎉 Tebrikler! Siparişinize ücretsiz kargo hakkı kazandınız!
        </p>
      )}
    </div>
  );
}
