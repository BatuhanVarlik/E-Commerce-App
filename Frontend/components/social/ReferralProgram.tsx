"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  FaGift,
  FaCopy,
  FaCheck,
  FaUserFriends,
  FaChartLine,
  FaWhatsapp,
  FaEnvelope,
  FaTelegram,
  FaLink,
} from "react-icons/fa";

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalPointsEarned: number;
  totalClicks: number;
  conversionRate: number;
  recentReferrals: ReferralItem[];
}

interface ReferralItem {
  id: string;
  referralCode: string;
  status: string;
  clickCount: number;
  referredUserName?: string;
  referrerPoints: number;
  createdAt: string;
  completedAt?: string;
}

export function ReferralDashboard() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralLink, setReferralLink] = useState<string>("");
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);

      // Referral kodu oluştur/getir
      const { data: codeData } = await api.post("/api/Social/referral/create");
      setReferralCode(codeData.referralCode);
      setReferralLink(codeData.referralLink);

      // İstatistikleri getir
      const { data: statsData } = await api.get("/api/Social/referral/stats");
      setStats(statsData);
    } catch (error) {
      console.error("Referral verileri alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = (platform: string) => {
    const message = `E-Ticaret'e katıl ve ilk siparişinde 50 puan kazan! Referans linkim: ${referralLink}`;
    const encodedMessage = encodeURIComponent(message);

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedMessage}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("E-Ticaret'e katıl ve 50 puan kazan!")}`,
      email: `mailto:?subject=${encodeURIComponent("E-Ticaret'e davet")}&body=${encodedMessage}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank");
    }
  };

  if (!user) {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white text-center">
        <FaGift className="w-12 h-12 mx-auto mb-4 opacity-80" />
        <h3 className="text-xl font-bold mb-2">Arkadaşını Davet Et, Kazan!</h3>
        <p className="text-white/80 mb-4">
          Arkadaşlarını davet et, hem sen hem de arkadaşın puan kazansın!
        </p>
        <a
          href="/login"
          className="inline-block px-6 py-2 bg-white text-indigo-600 rounded-full font-medium hover:bg-gray-100 transition-colors"
        >
          Giriş Yap
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <FaGift className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-bold">Arkadaşını Davet Et</h2>
            <p className="text-white/80 text-sm">
              Her başarılı davet için 100 puan kazan!
            </p>
          </div>
        </div>

        {/* Referral Code */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
          <p className="text-sm text-white/80 mb-2">Senin referans kodun:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white/30 px-4 py-2 rounded-lg font-mono text-lg">
              {referralCode}
            </code>
            <button
              onClick={() => handleCopy(referralCode)}
              className="p-2 bg-white/30 rounded-lg hover:bg-white/40 transition-colors"
              title="Kodu kopyala"
            >
              {copied ? <FaCheck /> : <FaCopy />}
            </button>
          </div>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="p-6 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Davet linkini paylaş:
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleShare("whatsapp")}
            className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#22C35E] transition-colors"
          >
            <FaWhatsapp /> WhatsApp
          </button>
          <button
            onClick={() => handleShare("telegram")}
            className="flex items-center gap-2 px-4 py-2 bg-[#0088CC] text-white rounded-lg hover:bg-[#007BB5] transition-colors"
          >
            <FaTelegram /> Telegram
          </button>
          <button
            onClick={() => handleShare("email")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FaEnvelope /> E-posta
          </button>
          <button
            onClick={() => handleCopy(referralLink)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <FaLink /> {copied ? "Kopyalandı!" : "Link Kopyala"}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaChartLine className="text-indigo-500" /> İstatistiklerin
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Toplam Davet"
              value={stats.totalReferrals}
              icon={<FaUserFriends className="text-blue-500" />}
            />
            <StatCard
              label="Tamamlanan"
              value={stats.completedReferrals}
              icon={<FaCheck className="text-green-500" />}
            />
            <StatCard
              label="Tıklama"
              value={stats.totalClicks}
              icon={<FaLink className="text-purple-500" />}
            />
            <StatCard
              label="Kazanılan Puan"
              value={stats.totalPointsEarned}
              icon={<FaGift className="text-orange-500" />}
            />
          </div>

          {/* Recent Referrals */}
          {stats.recentReferrals.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Son Davetler
              </h4>
              <div className="space-y-2">
                {stats.recentReferrals.map((ref) => (
                  <div
                    key={ref.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {ref.referredUserName || "Bekliyor..."}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(ref.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ref.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : ref.status === "Registered"
                              ? "bg-blue-100 text-blue-700"
                              : ref.status === "Clicked"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {ref.status === "Completed"
                          ? "Tamamlandı"
                          : ref.status === "Registered"
                            ? "Kayıt Oldu"
                            : ref.status === "Clicked"
                              ? "Tıkladı"
                              : "Bekliyor"}
                      </span>
                      {ref.status === "Completed" && (
                        <p className="text-sm text-green-600 mt-1">
                          +{ref.referrerPoints} puan
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* How it works */}
      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Nasıl Çalışır?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              1
            </div>
            <p className="text-sm text-gray-600">
              Referans linkini arkadaşınla paylaş
            </p>
          </div>
          <div className="p-4">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              2
            </div>
            <p className="text-sm text-gray-600">
              Arkadaşın kayıt olsun ve ilk siparişini versin
            </p>
          </div>
          <div className="p-4">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              3
            </div>
            <p className="text-sm text-gray-600">
              Sen 100, arkadaşın 50 puan kazansın!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
