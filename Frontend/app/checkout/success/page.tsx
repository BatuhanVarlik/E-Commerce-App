"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FaCheckCircle } from "react-icons/fa";
import { Suspense } from "react";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="container mx-auto flex flex-col items-center justify-center px-4 py-20 text-center">
      <FaCheckCircle className="text-6xl text-green-500 mb-6" />
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Ödeme Başarılı!</h1>
      <p className="mb-8 text-gray-600">
        Siparişiniz başarıyla alındı. Sipariş Numaranız:{" "}
        <span className="font-mono font-bold">{orderId}</span>
      </p>
      <div className="flex gap-4">
        <Link
          href="/profile"
          className="rounded border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
        >
          Siparişlerim
        </Link>
        <Link
          href="/products"
          className="rounded bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Alışverişe Devam Et
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Yükleniyor...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
