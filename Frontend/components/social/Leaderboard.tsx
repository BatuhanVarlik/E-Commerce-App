"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  FaTrophy,
  FaMedal,
  FaCrown,
  FaGem,
  FaFire,
  FaChevronDown,
  FaChevronUp,
  FaUser,
} from "react-icons/fa";

interface LeaderboardEntry {
  rank: number;
  userName: string;
  avatarUrl?: string;
  totalPoints: number;
  tier: string;
  isCurrentUser: boolean;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalUsers: number;
  currentUserRank?: number;
  period: string;
}

const tierIcons: Record<string, React.ReactNode> = {
  Bronze: <FaMedal className="text-amber-600" />,
  Silver: <FaMedal className="text-gray-400" />,
  Gold: <FaCrown className="text-yellow-500" />,
  Platinum: <FaGem className="text-cyan-500" />,
};

const rankBadges: Record<number, { icon: React.ReactNode; color: string }> = {
  1: { icon: <FaTrophy />, color: "from-yellow-400 to-yellow-600 text-white" },
  2: { icon: <FaMedal />, color: "from-gray-300 to-gray-500 text-white" },
  3: { icon: <FaMedal />, color: "from-amber-500 to-amber-700 text-white" },
};

type Period = "weekly" | "monthly" | "allTime";

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("monthly");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data: leaderboardData } = await api.get(
        `/api/Social/leaderboard?period=${period}`,
      );
      setData(leaderboardData);
    } catch (error) {
      console.error("Liderlik tablosu alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  const periodLabels: Record<Period, string> = {
    weekly: "Haftalık",
    monthly: "Aylık",
    allTime: "Tüm Zamanlar",
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 text-center text-gray-500">
        Liderlik tablosu yüklenemedi
      </div>
    );
  }

  const displayEntries = showAll ? data.entries : data.entries.slice(0, 10);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaTrophy className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">Liderlik Tablosu</h2>
              <p className="text-white/80 text-sm">
                {data.totalUsers} kullanıcı arasında yarış!
              </p>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex gap-1 bg-white/20 rounded-lg p-1">
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  period === p
                    ? "bg-white text-indigo-600"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Current User Rank */}
        {data.currentUserRank && (
          <div className="mt-4 p-3 bg-white/20 rounded-xl flex items-center justify-between">
            <span className="text-white/80">Senin sıran:</span>
            <span className="font-bold text-lg">#{data.currentUserRank}</span>
          </div>
        )}
      </div>

      {/* Top 3 Podium */}
      {data.entries.length >= 3 && (
        <div className="p-6 border-b border-gray-100 bg-gradient-to-b from-indigo-50 to-white">
          <div className="flex items-end justify-center gap-4">
            {/* 2nd Place */}
            <PodiumEntry entry={data.entries[1]} rank={2} />
            {/* 1st Place */}
            <PodiumEntry entry={data.entries[0]} rank={1} isFirst />
            {/* 3rd Place */}
            <PodiumEntry entry={data.entries[2]} rank={3} />
          </div>
        </div>
      )}

      {/* Rest of Leaderboard */}
      <div className="p-4">
        <div className="space-y-2">
          {displayEntries.slice(3).map((entry) => (
            <LeaderboardRow key={entry.rank} entry={entry} />
          ))}
        </div>

        {data.entries.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-4 py-2 text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-2 text-sm font-medium"
          >
            {showAll ? (
              <>
                <FaChevronUp /> Daha az göster
              </>
            ) : (
              <>
                <FaChevronDown /> Tümünü göster ({data.entries.length}{" "}
                kullanıcı)
              </>
            )}
          </button>
        )}
      </div>

      {/* Motivation Banner */}
      <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-t border-orange-100">
        <div className="flex items-center gap-3">
          <FaFire className="w-6 h-6 text-orange-500" />
          <div>
            <p className="font-medium text-gray-900">Sıralamayı yükselt!</p>
            <p className="text-sm text-gray-600">
              Alışveriş yap, arkadaş davet et ve değerlendirme yaz
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PodiumEntry({
  entry,
  rank,
  isFirst = false,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isFirst?: boolean;
}) {
  const height = isFirst ? "h-28" : rank === 2 ? "h-20" : "h-16";
  const badge = rankBadges[rank];

  return (
    <div className={`flex flex-col items-center ${isFirst ? "scale-110" : ""}`}>
      {/* Avatar */}
      <div
        className={`relative mb-2 ${entry.isCurrentUser ? "ring-4 ring-indigo-500 ring-offset-2" : ""} rounded-full`}
      >
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.userName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <FaUser className="text-gray-400" />
          </div>
        )}
        <div
          className={`absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r ${badge.color} rounded-full flex items-center justify-center text-xs`}
        >
          {badge.icon}
        </div>
      </div>

      {/* Name & Points */}
      <p className="text-sm font-medium text-gray-900 truncate max-w-20">
        {entry.isCurrentUser ? "Sen" : entry.userName}
      </p>
      <p className="text-xs text-gray-500">{entry.totalPoints} puan</p>

      {/* Podium */}
      <div
        className={`${height} w-16 mt-2 bg-gradient-to-r ${badge.color} rounded-t-lg flex items-center justify-center text-2xl font-bold`}
      >
        {rank}
      </div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl ${
        entry.isCurrentUser
          ? "bg-indigo-50 border border-indigo-200"
          : "bg-gray-50"
      }`}
    >
      {/* Rank */}
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-gray-600 shadow-sm">
        {entry.rank}
      </div>

      {/* Avatar */}
      {entry.avatarUrl ? (
        <img
          src={entry.avatarUrl}
          alt={entry.userName}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <FaUser className="text-gray-400" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {entry.isCurrentUser ? "Sen" : entry.userName}
        </p>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          {tierIcons[entry.tier]}
          <span>{entry.tier}</span>
        </div>
      </div>

      {/* Points */}
      <div className="text-right">
        <p className="font-bold text-gray-900">{entry.totalPoints}</p>
        <p className="text-xs text-gray-500">puan</p>
      </div>
    </div>
  );
}

// Mini Leaderboard Widget
export function LeaderboardMini() {
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopUsers();
  }, []);

  const fetchTopUsers = async () => {
    try {
      const { data } = await api.get(
        "/api/Social/leaderboard?period=monthly&limit=3",
      );
      setTopUsers(data.entries.slice(0, 3));
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  if (loading || topUsers.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
      <div className="flex items-center gap-2 mb-3">
        <FaTrophy className="text-yellow-300" />
        <span className="font-medium">Bu Ayın En İyileri</span>
      </div>
      <div className="space-y-2">
        {topUsers.map((user, index) => (
          <div key={user.rank} className="flex items-center gap-2">
            <span className="w-6 text-center font-bold">
              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
            </span>
            <span className="flex-1 truncate text-sm">{user.userName}</span>
            <span className="text-white/80 text-sm">{user.totalPoints}</span>
          </div>
        ))}
      </div>
      <a
        href="/leaderboard"
        className="block mt-3 text-center text-sm text-white/80 hover:text-white"
      >
        Tümünü gör →
      </a>
    </div>
  );
}
