"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState(""); // Development için

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5162/api/Auth/forgot-password",
        { email },
      );

      setMessage(response.data.message);

      // Development aşamasında token'ı göster
      if (response.data.resetToken) {
        setResetToken(response.data.resetToken);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Bir hata oluştu.");
      } else {
        setError("Beklenmeyen bir hata oluştu.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-800">
          Şifremi Unuttum
        </h2>
        <p className="mb-6 text-center text-sm text-gray-600">
          E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
        </p>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded bg-green-100 p-3 text-sm text-green-600">
            {message}
          </div>
        )}

        {resetToken && (
          <div className="mb-4 rounded bg-yellow-100 p-3 text-xs">
            <p className="font-semibold text-yellow-800 mb-2">
              ⚠️ Geliştirme Modu - Token:
            </p>
            <code className="block bg-yellow-200 p-2 rounded break-all text-yellow-900">
              {resetToken}
            </code>
            <button
              onClick={() => {
                router.push(`/reset-password?token=${resetToken}`);
              }}
              className="mt-2 w-full rounded bg-yellow-600 py-2 text-sm font-semibold text-white hover:bg-yellow-700"
            >
              Şifre Sıfırlama Sayfasına Git
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              E-Posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="ornek@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            ← Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </div>
  );
}
