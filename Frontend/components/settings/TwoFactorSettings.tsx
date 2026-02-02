"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";

interface TwoFactorStatus {
  isEnabled: boolean;
  lastVerifiedAt: string | null;
  remainingRecoveryCodes: number;
}

interface Setup2FAResponse {
  qrCodeImage: string;
  manualEntryKey: string;
  recoveryCodes: string[];
}

export default function TwoFactorSettings() {
  const { token } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<Setup2FAResponse | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchStatus = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/security/2fa/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("2FA durumu alınamadı:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSetup = async () => {
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/security/2fa/setup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSetupData(data);
        setShowSetup(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Kurulum başlatılamadı.");
      }
    } catch {
      setError("Bir hata oluştu.");
    }
  };

  const handleEnable = async () => {
    if (!verificationCode) {
      setError("Doğrulama kodunu girin.");
      return;
    }

    setError("");
    try {
      const response = await fetch(`${API_URL}/api/security/2fa/enable`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (response.ok) {
        setSuccess("2FA başarıyla aktifleştirildi!");
        setShowSetup(false);
        setVerificationCode("");
        await fetchStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Doğrulama başarısız.");
      }
    } catch {
      setError("Bir hata oluştu.");
    }
  };

  const handleDisable = async () => {
    if (!verificationCode || !password) {
      setError("Tüm alanları doldurun.");
      return;
    }

    setError("");
    try {
      const response = await fetch(`${API_URL}/api/security/2fa/disable`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: verificationCode,
          currentPassword: password,
        }),
      });

      if (response.ok) {
        setSuccess("2FA devre dışı bırakıldı.");
        setShowDisable(false);
        setVerificationCode("");
        setPassword("");
        await fetchStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "İşlem başarısız.");
      }
    } catch {
      setError("Bir hata oluştu.");
    }
  };

  const handleRegenerateCodes = async () => {
    if (!verificationCode) {
      setError("Doğrulama kodunu girin.");
      return;
    }

    setError("");
    try {
      const response = await fetch(
        `${API_URL}/api/security/2fa/regenerate-codes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: verificationCode }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setSetupData((prev) =>
          prev ? { ...prev, recoveryCodes: data.recoveryCodes } : null,
        );
        setShowRecoveryCodes(true);
        setSuccess("Yeni kurtarma kodları oluşturuldu.");
        setVerificationCode("");
        await fetchStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "İşlem başarısız.");
      }
    } catch {
      setError("Bir hata oluştu.");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-blue-600"
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
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            İki Faktörlü Kimlik Doğrulama (2FA)
          </h2>
          <p className="text-sm text-gray-500">
            Hesabınıza ekstra güvenlik katmanı ekleyin
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Durum Kartı */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${status?.isEnabled ? "bg-green-500" : "bg-gray-400"}`}
            ></div>
            <span className="font-medium text-gray-900">
              {status?.isEnabled ? "2FA Aktif" : "2FA Devre Dışı"}
            </span>
          </div>
          {status?.isEnabled && status.remainingRecoveryCodes > 0 && (
            <span className="text-sm text-gray-500">
              Kalan kurtarma kodu: {status.remainingRecoveryCodes}
            </span>
          )}
        </div>
        {status?.lastVerifiedAt && (
          <p className="text-xs text-gray-500 mt-2">
            Son doğrulama:{" "}
            {new Date(status.lastVerifiedAt).toLocaleString("tr-TR")}
          </p>
        )}
      </div>

      {/* Aksiyonlar */}
      {!status?.isEnabled ? (
        <div className="space-y-4">
          {!showSetup ? (
            <button
              onClick={handleSetup}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              2FA&apos;yı Etkinleştir
            </button>
          ) : (
            <div className="space-y-6">
              {/* QR Kod */}
              {setupData && (
                <>
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900 mb-2">
                      1. QR Kodu Tara
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Google Authenticator veya benzeri bir uygulama ile QR kodu
                      tarayın
                    </p>
                    <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={setupData.qrCodeImage}
                        alt="QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>

                  {/* Manuel Giriş */}
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900 mb-2">
                      Veya Manuel Giriş
                    </h3>
                    <code className="block p-3 bg-gray-100 rounded-lg text-sm font-mono break-all">
                      {setupData.manualEntryKey}
                    </code>
                  </div>

                  {/* Kurtarma Kodları */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      Kurtarma Kodlarını Kaydedin!
                    </h3>
                    <p className="text-sm text-yellow-700 mb-3">
                      Bu kodları güvenli bir yerde saklayın. Telefonunuza
                      erişemezseniz bu kodları kullanabilirsiniz.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {setupData.recoveryCodes.map((code, index) => (
                        <code
                          key={index}
                          className="p-2 bg-white rounded text-sm font-mono text-center"
                        >
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>

                  {/* Doğrulama */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      2. Doğrulama Kodunu Girin
                    </h3>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="6 haneli kod"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => setShowSetup(false)}
                        className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        onClick={handleEnable}
                        className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Aktifleştir
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Devre Dışı Bırak */}
          {!showDisable && !showRecoveryCodes ? (
            <div className="flex gap-3">
              <button
                onClick={() => setShowRecoveryCodes(true)}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Kurtarma Kodlarını Yenile
              </button>
              <button
                onClick={() => setShowDisable(true)}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                2FA&apos;yı Devre Dışı Bırak
              </button>
            </div>
          ) : showDisable ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  2FA&apos;yı devre dışı bırakmak hesabınızın güvenliğini
                  azaltacaktır.
                </p>
              </div>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="6 haneli doğrulama kodu"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mevcut şifreniz"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDisable(false);
                    setVerificationCode("");
                    setPassword("");
                    setError("");
                  }}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleDisable}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Devre Dışı Bırak
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="6 haneli doğrulama kodu"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {setupData?.recoveryCodes && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">
                    Yeni Kurtarma Kodları
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {setupData.recoveryCodes.map((code, index) => (
                      <code
                        key={index}
                        className="p-2 bg-white rounded text-sm font-mono text-center"
                      >
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRecoveryCodes(false);
                    setVerificationCode("");
                    setError("");
                  }}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Kapat
                </button>
                <button
                  onClick={handleRegenerateCodes}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Yeni Kodlar Oluştur
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
