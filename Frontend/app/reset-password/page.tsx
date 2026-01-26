"use client";

import { useState, useEffect, Suspense } from "react";
import { authApi } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Şifre doğrulama
    if (newPassword.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    if (!token) {
      setError("Geçersiz sıfırlama bağlantısı.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Gönderilen token:", token);
      console.log("Gönderilen newPassword:", newPassword);

      const response = await authApi.resetPassword(token, newPassword);

      setMessage(response.data.message);

      // 2 saniye sonra login sayfasına yönlendir
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      console.error("Reset password error:", err);
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(
          axiosError.response?.data?.message || "Şifre sıfırlama başarısız.",
        );
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
          Yeni Şifre Belirle
        </h2>
        <p className="mb-6 text-center text-sm text-gray-600">
          Hesabınız için yeni bir şifre oluşturun.
        </p>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded bg-green-100 p-3 text-sm text-green-600">
            {message}
            <p className="mt-2 text-xs">
              Giriş sayfasına yönlendiriliyorsunuz...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Yeni Şifre
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="En az 6 karakter"
              required
              disabled={isLoading || !!message}
              minLength={6}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Yeni Şifre (Tekrar)
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              placeholder="Şifrenizi tekrar girin"
              required
              disabled={isLoading || !!message}
              minLength={6}
            />
          </div>

          {!message && (
            <button
              type="submit"
              className="w-full rounded bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? "Şifre Sıfırlanıyor..." : "Şifreyi Sıfırla"}
            </button>
          )}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
