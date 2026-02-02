"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

function TwoFactorVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");
  const email = searchParams.get("email");

  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId && !email) {
      setError("Geçersiz oturum.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let response;

      if (useRecovery) {
        // Kurtarma kodu ile giriş
        response = await fetch(`${API_URL}/api/security/2fa/recovery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            recoveryCode: recoveryCode,
          }),
        });
      } else {
        // Normal 2FA kodu ile giriş
        response = await fetch(`${API_URL}/api/security/2fa/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            code: code,
          }),
        });
      }

      if (response.ok) {
        const data = await response.json();

        // Token'ı localStorage'a kaydet
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));

        // Ana sayfaya yönlendir
        router.push("/");
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Doğrulama başarısız.");
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            İki Faktörlü Doğrulama
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {useRecovery
              ? "Kurtarma kodunuzu girin"
              : "Authenticator uygulamanızdaki 6 haneli kodu girin"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          {!useRecovery ? (
            <div>
              <label htmlFor="code" className="sr-only">
                Doğrulama Kodu
              </label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="appearance-none relative block w-full px-4 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="recovery" className="sr-only">
                Kurtarma Kodu
              </label>
              <input
                id="recovery"
                name="recovery"
                type="text"
                required
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                className="appearance-none relative block w-full px-4 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl tracking-wider font-mono"
                placeholder="XXXXX-XXXXX"
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || (!useRecovery && code.length !== 6)}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Doğrula"
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setUseRecovery(!useRecovery);
              setCode("");
              setRecoveryCode("");
              setError("");
            }}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {useRecovery
              ? "← Authenticator kodu kullan"
              : "Kurtarma kodu kullan"}
          </button>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
          <h4 className="font-medium text-gray-900 mb-2">Yardım</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Google Authenticator veya benzeri bir uygulama kullanın</li>
            <li>Kod 30 saniyede bir değişir</li>
            <li>Telefonunuza erişemiyorsanız kurtarma kodunu kullanın</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function TwoFactorVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <TwoFactorVerifyContent />
    </Suspense>
  );
}
