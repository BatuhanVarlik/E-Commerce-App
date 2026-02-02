"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";

interface IpListItem {
  id: number;
  ipAddress: string;
  reason?: string;
  description?: string;
  isAutomatic: boolean;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

interface AuditLog {
  id: number;
  userId?: string;
  userEmail?: string;
  action: string;
  category: string;
  details?: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  endpoint?: string;
  httpMethod?: string;
  isSuccessful: boolean;
  errorMessage?: string;
  riskLevel: string;
  createdAt: string;
}

interface SecuritySummary {
  totalLoginAttempts: number;
  failedLoginAttempts: number;
  blockedIps: number;
  rateLimitExceeded: number;
  suspiciousActivities: number;
  usersWithEnabled2FA: number;
  periodStart: string;
  periodEnd: string;
}

export default function SecurityManagement() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "blocked" | "whitelist" | "logs"
  >("overview");
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [blockedIps, setBlockedIps] = useState<IpListItem[]>([]);
  const [whitelistedIps, setWhitelistedIps] = useState<IpListItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Block IP form
  const [newBlockIp, setNewBlockIp] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockDuration, setBlockDuration] = useState<string>("");

  // Whitelist IP form
  const [newWhitelistIp, setNewWhitelistIp] = useState("");
  const [whitelistDescription, setWhitelistDescription] = useState("");

  // Audit log filters
  const [logFilter, setLogFilter] = useState({
    category: "",
    riskLevel: "",
    action: "",
  });

  const fetchData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [summaryRes, blockedRes, whitelistRes, logsRes] = await Promise.all(
        [
          fetch(`${API_URL}/api/security/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/security/ip/blocked`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/security/ip/whitelisted`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/security/audit-logs?pageSize=50`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ],
      );

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (blockedRes.ok) setBlockedIps(await blockedRes.json());
      if (whitelistRes.ok) setWhitelistedIps(await whitelistRes.json());
      if (logsRes.ok) setAuditLogs(await logsRes.json());
    } catch {
      setError("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBlockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/api/security/ip/block`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ipAddress: newBlockIp,
          reason: blockReason,
          durationHours: blockDuration ? parseInt(blockDuration) : null,
        }),
      });

      if (response.ok) {
        setSuccess(`IP ${newBlockIp} engellendi.`);
        setNewBlockIp("");
        setBlockReason("");
        setBlockDuration("");
        fetchData();
      } else {
        const data = await response.json();
        setError(data.message || "İşlem başarısız.");
      }
    } catch {
      setError("Bir hata oluştu.");
    }
  };

  const handleUnblockIp = async (ipAddress: string) => {
    try {
      const response = await fetch(`${API_URL}/api/security/ip/unblock`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ipAddress }),
      });

      if (response.ok) {
        setSuccess(`IP ${ipAddress} engeli kaldırıldı.`);
        fetchData();
      }
    } catch {
      setError("Bir hata oluştu.");
    }
  };

  const handleWhitelistIp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/api/security/ip/whitelist`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ipAddress: newWhitelistIp,
          description: whitelistDescription,
        }),
      });

      if (response.ok) {
        setSuccess(`IP ${newWhitelistIp} güvenilir listeye eklendi.`);
        setNewWhitelistIp("");
        setWhitelistDescription("");
        fetchData();
      } else {
        const data = await response.json();
        setError(data.message || "İşlem başarısız.");
      }
    } catch {
      setError("Bir hata oluştu.");
    }
  };

  const handleRemoveFromWhitelist = async (ipAddress: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/security/ip/whitelist/remove`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ipAddress }),
        },
      );

      if (response.ok) {
        setSuccess(`IP ${ipAddress} güvenilir listeden çıkarıldı.`);
        fetchData();
      }
    } catch {
      setError("Bir hata oluştu.");
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (logFilter.category && log.category !== logFilter.category) return false;
    if (logFilter.riskLevel && log.riskLevel !== logFilter.riskLevel)
      return false;
    if (
      logFilter.action &&
      !log.action.toLowerCase().includes(logFilter.action.toLowerCase())
    )
      return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Güvenlik Yönetimi
          </h1>
          <p className="text-gray-500">
            IP yönetimi, audit logları ve güvenlik ayarları
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {["overview", "blocked", "whitelist", "logs"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab === "overview" && "Genel Bakış"}
              {tab === "blocked" && `Engelli IP'ler (${blockedIps.length})`}
              {tab === "whitelist" &&
                `Güvenilir IP'ler (${whitelistedIps.length})`}
              {tab === "logs" && "Audit Loglar"}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.totalLoginAttempts}
                </p>
                <p className="text-sm text-gray-500">Toplam Giriş Denemesi</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
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
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.failedLoginAttempts}
                </p>
                <p className="text-sm text-gray-500">Başarısız Giriş</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.blockedIps}
                </p>
                <p className="text-sm text-gray-500">Engelli IP</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.rateLimitExceeded}
                </p>
                <p className="text-sm text-gray-500">Rate Limit Aşımı</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.suspiciousActivities}
                </p>
                <p className="text-sm text-gray-500">Şüpheli Aktivite</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
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
                <p className="text-2xl font-bold text-gray-900">
                  {summary.usersWithEnabled2FA}
                </p>
                <p className="text-sm text-gray-500">2FA Aktif Kullanıcı</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blocked IPs Tab */}
      {activeTab === "blocked" && (
        <div className="space-y-6">
          {/* Add Form */}
          <form
            onSubmit={handleBlockIp}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              IP Engelle
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                value={newBlockIp}
                onChange={(e) => setNewBlockIp(e.target.value)}
                placeholder="IP Adresi"
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Engelleme Sebebi"
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={blockDuration}
                onChange={(e) => setBlockDuration(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Kalıcı</option>
                <option value="1">1 Saat</option>
                <option value="24">24 Saat</option>
                <option value="168">1 Hafta</option>
                <option value="720">30 Gün</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Engelle
              </button>
            </div>
          </form>

          {/* List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    IP Adresi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sebep
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tür
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bitiş
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {blockedIps.map((ip) => (
                  <tr key={ip.id}>
                    <td className="px-6 py-4 font-mono text-sm">
                      {ip.ipAddress}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ip.reason}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${ip.isAutomatic ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}`}
                      >
                        {ip.isAutomatic ? "Otomatik" : "Manuel"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ip.expiresAt
                        ? new Date(ip.expiresAt).toLocaleString("tr-TR")
                        : "Kalıcı"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleUnblockIp(ip.ipAddress)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Engeli Kaldır
                      </button>
                    </td>
                  </tr>
                ))}
                {blockedIps.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Engelli IP bulunmuyor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Whitelist Tab */}
      {activeTab === "whitelist" && (
        <div className="space-y-6">
          {/* Add Form */}
          <form
            onSubmit={handleWhitelistIp}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Güvenilir IP Ekle
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={newWhitelistIp}
                onChange={(e) => setNewWhitelistIp(e.target.value)}
                placeholder="IP Adresi"
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={whitelistDescription}
                onChange={(e) => setWhitelistDescription(e.target.value)}
                placeholder="Açıklama"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Ekle
              </button>
            </div>
          </form>

          {/* List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    IP Adresi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Eklenme Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {whitelistedIps.map((ip) => (
                  <tr key={ip.id}>
                    <td className="px-6 py-4 font-mono text-sm">
                      {ip.ipAddress}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ip.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(ip.createdAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRemoveFromWhitelist(ip.ipAddress)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Kaldır
                      </button>
                    </td>
                  </tr>
                ))}
                {whitelistedIps.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Güvenilir IP bulunmuyor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={logFilter.category}
                onChange={(e) =>
                  setLogFilter((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tüm Kategoriler</option>
                <option value="Auth">Kimlik Doğrulama</option>
                <option value="Order">Sipariş</option>
                <option value="Admin">Admin</option>
                <option value="Security">Güvenlik</option>
                <option value="User">Kullanıcı</option>
              </select>
              <select
                value={logFilter.riskLevel}
                onChange={(e) =>
                  setLogFilter((prev) => ({
                    ...prev,
                    riskLevel: e.target.value,
                  }))
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tüm Risk Seviyeleri</option>
                <option value="Low">Düşük</option>
                <option value="Medium">Orta</option>
                <option value="High">Yüksek</option>
                <option value="Critical">Kritik</option>
              </select>
              <input
                type="text"
                value={logFilter.action}
                onChange={(e) =>
                  setLogFilter((prev) => ({ ...prev, action: e.target.value }))
                }
                placeholder="Aksiyon ara..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() =>
                  setLogFilter({ category: "", riskLevel: "", action: "" })
                }
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Filtreleri Temizle
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tarih
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Aksiyon
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Kullanıcı
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      IP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Risk
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Durum
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.userEmail || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {log.ipAddress || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getRiskLevelColor(log.riskLevel)}`}
                        >
                          {log.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.isSuccessful ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span
                            className="text-red-600"
                            title={log.errorMessage}
                          >
                            ✗
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Log kaydı bulunamadı
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
