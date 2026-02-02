"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { FaTrash, FaExclamationTriangle, FaSave } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  orderUpdates: boolean;
  priceAlerts: boolean;
  newsletterSubscription: boolean;
}

export default function SettingsPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
    orderUpdates: true,
    priceAlerts: true,
    newsletterSubscription: false,
  });
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await api.get("/api/UserProfile/preferences");
      setPreferences(response.data);
    } catch (err) {
      console.error("Tercihler yüklenemedi:", err);
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    setError("");
    setSuccess("");

    try {
      await api.put("/api/UserProfile/preferences", preferences);
      setSuccess("Tercihleriniz kaydedildi");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Tercihler kaydedilemedi");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!password) {
      setError("Lütfen şifrenizi girin");
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await api.delete("/api/UserProfile/account", {
        data: { password },
      });

      logout();
      router.push("/");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Hesap silinemedi");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold">Hesap Ayarları</h2>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Notifications Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Bildirim Tercihleri</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-700 font-medium">
                E-posta bildirimleri
              </span>
              <p className="text-sm text-gray-500">
                Genel bildirimler için e-posta al
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailNotifications}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  emailNotifications: e.target.checked,
                })
              }
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-700 font-medium">
                SMS bildirimleri
              </span>
              <p className="text-sm text-gray-500">
                Önemli güncellemeler için SMS al
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.smsNotifications}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  smsNotifications: e.target.checked,
                })
              }
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-700 font-medium">
                Push bildirimleri
              </span>
              <p className="text-sm text-gray-500">Tarayıcı bildirimleri al</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.pushNotifications}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  pushNotifications: e.target.checked,
                })
              }
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-700 font-medium">
                Pazarlama e-postaları
              </span>
              <p className="text-sm text-gray-500">
                Kampanya ve fırsatlar hakkında bilgi al
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.marketingEmails}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  marketingEmails: e.target.checked,
                })
              }
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-700 font-medium">
                Sipariş güncellemeleri
              </span>
              <p className="text-sm text-gray-500">
                Siparişleriniz hakkında bildirim al
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.orderUpdates}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  orderUpdates: e.target.checked,
                })
              }
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-700 font-medium">Fiyat uyarıları</span>
              <p className="text-sm text-gray-500">
                İzlediğiniz ürünlerin fiyat değişiklikleri
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.priceAlerts}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  priceAlerts: e.target.checked,
                })
              }
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-700 font-medium">
                Bülten aboneliği
              </span>
              <p className="text-sm text-gray-500">Haftalık bülten al</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.newsletterSubscription}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  newsletterSubscription: e.target.checked,
                })
              }
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSavePreferences}
            disabled={isSavingPreferences}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            <FaSave />
            {isSavingPreferences ? "Kaydediliyor..." : "Tercihleri Kaydet"}
          </button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
        <div className="flex items-start gap-3 mb-4">
          <FaExclamationTriangle className="text-red-600 shrink-0 mt-1 text-2xl" />
          <div>
            <h3 className="text-xl font-semibold text-red-600 mb-2">
              Tehlikeli Bölge
            </h3>
            <p className="text-gray-700">
              Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak
              silinecektir. Bu işlem geri alınamaz.
            </p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <FaTrash />
            Hesabımı Sil
          </button>
        ) : (
          <div className="space-y-4 p-4 bg-red-50 rounded-lg">
            <p className="font-semibold text-red-800">
              Hesabınızı silmek istediğinizden emin misiniz?
            </p>

            {error && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şifrenizi girin
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Şifre"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
              >
                {isDeleting ? "Siliniyor..." : "Evet, Hesabımı Sil"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPassword("");
                  setError("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                İptal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
