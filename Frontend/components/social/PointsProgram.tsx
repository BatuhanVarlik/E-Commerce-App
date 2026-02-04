"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  FaStar,
  FaCoins,
  FaHistory,
  FaGift,
  FaArrowUp,
  FaArrowDown,
  FaMedal,
  FaCrown,
  FaGem,
  FaShoppingBag,
} from "react-icons/fa";

interface UserPoints {
  userId: string;
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  tier: string;
  createdAt: string;
  updatedAt: string;
}

interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  description: string;
  referenceId?: string;
  createdAt: string;
}

interface PointsInfo {
  userPoints: UserPoints;
  recentTransactions: PointTransaction[];
  nextTier: string | null;
  pointsToNextTier: number;
}

const tierIcons: Record<string, React.ReactNode> = {
  Bronze: <FaMedal className="text-amber-600" />,
  Silver: <FaMedal className="text-gray-400" />,
  Gold: <FaCrown className="text-yellow-500" />,
  Platinum: <FaGem className="text-cyan-500" />,
};

const tierColors: Record<string, string> = {
  Bronze: "from-amber-500 to-amber-700",
  Silver: "from-gray-400 to-gray-600",
  Gold: "from-yellow-400 to-yellow-600",
  Platinum: "from-cyan-400 to-cyan-600",
};

const tierBonuses: Record<string, string> = {
  Bronze: "%5 Bonus",
  Silver: "%10 Bonus",
  Gold: "%20 Bonus",
  Platinum: "%30 Bonus",
};

export function PointsDashboard() {
  const { user } = useAuth();
  const [pointsInfo, setPointsInfo] = useState<PointsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPointsData();
    }
  }, [user]);

  const fetchPointsData = async () => {
    try {
      setLoading(true);

      // Puan bilgilerini getir
      const { data: pointsData } = await api.get("/api/Social/points");

      // Son işlemleri getir
      const { data: transactionsData } = await api.get(
        "/api/Social/points/transactions",
      );

      // Sonraki seviye hesapla
      const tiers = ["Bronze", "Silver", "Gold", "Platinum"];
      const tierThresholds = [0, 500, 2000, 5000];
      const currentTierIndex = tiers.indexOf(pointsData.tier);
      const nextTier =
        currentTierIndex < tiers.length - 1
          ? tiers[currentTierIndex + 1]
          : null;
      const pointsToNextTier = nextTier
        ? tierThresholds[currentTierIndex + 1] - pointsData.totalEarned
        : 0;

      setPointsInfo({
        userPoints: pointsData,
        recentTransactions: transactionsData,
        nextTier,
        pointsToNextTier,
      });
    } catch (error) {
      console.error("Puan verileri alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-linear-to-r from-yellow-500 to-orange-600 rounded-2xl p-6 text-white text-center">
        <FaCoins className="w-12 h-12 mx-auto mb-4 opacity-80" />
        <h3 className="text-xl font-bold mb-2">Puan Kazan, Avantaj Yakala!</h3>
        <p className="text-white/80 mb-4">
          Alışveriş yap, arkadaş davet et ve puanları indirime çevir!
        </p>
        <a
          href="/login"
          className="inline-block px-6 py-2 bg-white text-orange-600 rounded-full font-medium hover:bg-gray-100 transition-colors"
        >
          Giriş Yap
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-xl mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!pointsInfo) return null;

  const { userPoints, recentTransactions, nextTier, pointsToNextTier } =
    pointsInfo;
  const tierProgress = nextTier
    ? (userPoints.totalEarned / (userPoints.totalEarned + pointsToNextTier)) *
      100
    : 100;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Points Balance Card */}
      <div
        className={`bg-linear-to-r ${tierColors[userPoints.tier] || tierColors.Bronze} p-6 text-white`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              {tierIcons[userPoints.tier] || tierIcons.Bronze}
            </div>
            <div>
              <p className="text-white/80 text-sm">{userPoints.tier} Üye</p>
              <p className="text-white/60 text-xs">
                {tierBonuses[userPoints.tier]}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Mevcut Bakiye</p>
            <p className="text-3xl font-bold">{userPoints.currentBalance}</p>
            <p className="text-white/60 text-xs">puan</p>
          </div>
        </div>

        {/* Tier Progress */}
        {nextTier && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-white/80 mb-1">
              <span>{userPoints.tier}</span>
              <span>{nextTier}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
            <p className="text-center text-white/60 text-xs mt-1">
              {nextTier} seviyesine {pointsToNextTier} puan kaldı
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-green-500 mb-1">
            <FaArrowUp className="w-3 h-3" />
            <span className="text-sm">Kazanılan</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {userPoints.totalEarned}
          </p>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-red-500 mb-1">
            <FaArrowDown className="w-3 h-3" />
            <span className="text-sm">Harcanan</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {userPoints.totalSpent}
          </p>
        </div>
      </div>

      {/* How to Earn */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Puan Kazanma Yolları
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <EarnMethod
            icon={<FaShoppingBag />}
            title="Alışveriş"
            points="Her 10₺ = 1 puan"
          />
          <EarnMethod
            icon={<FaGift />}
            title="Arkadaş Davet"
            points="100 puan"
          />
          <EarnMethod
            icon={<FaStar />}
            title="Değerlendirme"
            points="10 puan"
          />
          <EarnMethod icon={<FaMedal />} title="Günlük Giriş" points="5 puan" />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FaHistory className="text-gray-400" /> Son İşlemler
          </h4>
          {recentTransactions.length > 5 && (
            <button
              onClick={() => setShowAllTransactions(!showAllTransactions)}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {showAllTransactions ? "Daha az göster" : "Tümünü gör"}
            </button>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Henüz işlem yok</p>
        ) : (
          <div className="space-y-2">
            {(showAllTransactions
              ? recentTransactions
              : recentTransactions.slice(0, 5)
            ).map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
          </div>
        )}
      </div>

      {/* Redeem Points */}
      <div className="p-4 bg-linear-to-r from-indigo-50 to-purple-50 border-t border-indigo-100">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Puanlarını Kullan</h4>
            <p className="text-sm text-gray-600">100 puan = 10₺ indirim</p>
          </div>
          <a
            href="/checkout"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Alışverişe Git
          </a>
        </div>
      </div>
    </div>
  );
}

function EarnMethod({
  icon,
  title,
  points,
}: {
  icon: React.ReactNode;
  title: string;
  points: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{points}</p>
      </div>
    </div>
  );
}

function TransactionItem({ transaction }: { transaction: PointTransaction }) {
  const isEarned = transaction.amount > 0;

  const typeLabels: Record<string, string> = {
    Purchase: "Alışveriş",
    Referral: "Arkadaş Daveti",
    Review: "Değerlendirme",
    DailyLogin: "Günlük Giriş",
    Bonus: "Bonus",
    Redemption: "Kullanım",
    Refund: "İade",
    Expired: "Süre Dolumu",
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isEarned ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}
        >
          {isEarned ? (
            <FaArrowUp className="w-3 h-3" />
          ) : (
            <FaArrowDown className="w-3 h-3" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {typeLabels[transaction.type] || transaction.type}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(transaction.createdAt).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
      <p
        className={`font-bold ${isEarned ? "text-green-600" : "text-red-600"}`}
      >
        {isEarned ? "+" : ""}
        {transaction.amount}
      </p>
    </div>
  );
}

// Compact Points Badge
export function PointsBadge() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBalance = async () => {
      try {
        const { data } = await api.get("/api/Social/points/balance");
        if (isMounted) {
          setBalance(data.balance);
        }
      } catch {
        // Silent fail
      }
    };

    if (user) {
      fetchBalance();
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!user || balance === null) return null;

  return (
    <a
      href="/profile/points"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-medium hover:from-yellow-500 hover:to-orange-600 transition-all"
    >
      <FaCoins className="w-3.5 h-3.5" />
      {balance}
    </a>
  );
}
