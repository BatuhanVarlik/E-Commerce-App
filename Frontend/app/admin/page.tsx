"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  FaEye,
  FaDownload,
  FaSync,
  FaChartLine,
  FaChartBar,
  FaChartPie,
} from "react-icons/fa";
import {
  SalesLineChart,
  CategoryDoughnutChart,
  TopProductsBarChart,
  OrderStatusChart,
  UserGrowthChart,
} from "@/components/admin/Charts";
import {
  SummaryCard,
  StockAlertsWidget,
  TopProductsWidget,
  RecentActivitiesWidget,
  QuickStatsWidget,
} from "@/components/admin/DashboardWidgets";

interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  city: string;
}

interface DashboardSummary {
  todayRevenue: number;
  todayOrders: number;
  weekRevenue: number;
  weekOrders: number;
  monthRevenue: number;
  monthOrders: number;
  revenueChangePercent: number;
  orderChangePercent: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingReviews: number;
}

interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}

interface MonthlySales {
  year: number;
  month: number;
  monthName: string;
  revenue: number;
  orders: number;
}

interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  dailySales: DailySales[];
  monthlySales: MonthlySales[];
}

interface TopProduct {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  totalSold: number;
  totalRevenue: number;
  stock: number;
  categoryName: string;
}

interface CategoryPerformance {
  id: string;
  name: string;
  productCount: number;
  totalSold: number;
  totalRevenue: number;
  percentage: number;
}

interface StockAlert {
  productId: string;
  productName: string;
  imageUrl: string;
  currentStock: number;
  categoryName: string;
  alertLevel: number;
}

interface OrderStatusDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface UserStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  monthlyGrowth: {
    year: number;
    month: number;
    monthName: string;
    newUsers: number;
    totalUsers: number;
  }[];
}

interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

interface OldDashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  recentOrders: Order[];
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics | null>(
    null,
  );
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<
    CategoryPerformance[]
  >([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [orderDistribution, setOrderDistribution] = useState<
    OrderStatusDistribution[]
  >([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    [],
  );
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  const fetchAllData = async () => {
    try {
      // Eski dashboard API'sinden recent orders için
      const oldDashboardPromise = api.get<OldDashboardStats>(
        "/api/admin/dashboard",
      );

      // Yeni analytics API'leri
      const summaryPromise = api.get<DashboardSummary>(
        "/api/admin/analytics/summary",
      );
      const salesPromise = api.get<SalesAnalytics>(
        "/api/admin/analytics/sales?days=30",
      );
      const topProductsPromise = api.get<TopProduct[]>(
        "/api/admin/analytics/products/top?count=10",
      );
      const categoryPromise = api.get<CategoryPerformance[]>(
        "/api/admin/analytics/categories/performance",
      );
      const stockAlertsPromise = api.get<StockAlert[]>(
        "/api/admin/analytics/stock-alerts",
      );
      const orderDistPromise = api.get<OrderStatusDistribution[]>(
        "/api/admin/analytics/orders/status-distribution",
      );
      const userStatsPromise = api.get<UserStats>("/api/admin/analytics/users");
      const activitiesPromise = api.get<RecentActivity[]>(
        "/api/admin/analytics/activities?count=20",
      );

      const [
        oldDashboardRes,
        summaryRes,
        salesRes,
        topProductsRes,
        categoryRes,
        stockAlertsRes,
        orderDistRes,
        userStatsRes,
        activitiesRes,
      ] = await Promise.allSettled([
        oldDashboardPromise,
        summaryPromise,
        salesPromise,
        topProductsPromise,
        categoryPromise,
        stockAlertsPromise,
        orderDistPromise,
        userStatsPromise,
        activitiesPromise,
      ]);

      // Set data from resolved promises
      if (oldDashboardRes.status === "fulfilled") {
        setRecentOrders(oldDashboardRes.value.data.recentOrders);
      }
      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value.data);
      if (salesRes.status === "fulfilled")
        setSalesAnalytics(salesRes.value.data);
      if (topProductsRes.status === "fulfilled")
        setTopProducts(topProductsRes.value.data);
      if (categoryRes.status === "fulfilled")
        setCategoryPerformance(categoryRes.value.data);
      if (stockAlertsRes.status === "fulfilled")
        setStockAlerts(stockAlertsRes.value.data);
      if (orderDistRes.status === "fulfilled")
        setOrderDistribution(orderDistRes.value.data);
      if (userStatsRes.status === "fulfilled")
        setUserStats(userStatsRes.value.data);
      if (activitiesRes.status === "fulfilled")
        setRecentActivities(activitiesRes.value.data);
    } catch (err: unknown) {
      console.error("Dashboard verileri çekilemedi:", err);
      const error = err as { response?: { status?: number } };
      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 403)
      ) {
        setError("Yetkisiz erişim. Lütfen tekrar giriş yapın.");
      } else {
        setError("Veriler yüklenirken bir hata oluştu.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const handleExport = async (type: "sales" | "products" | "orders") => {
    try {
      const response = await api.get(`/api/admin/analytics/export/${type}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${type}-rapor-${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Rapor indirilemedi:", err);
      alert("Rapor indirilemedi");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Mağaza performansınızı izleyin</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            <FaSync className={refreshing ? "animate-spin" : ""} size={14} />
            Yenile
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              <FaDownload size={14} />
              Rapor İndir
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport("sales")}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
              >
                Satış Raporu
              </button>
              <button
                onClick={() => handleExport("products")}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
              >
                Ürün Raporu
              </button>
              <button
                onClick={() => handleExport("orders")}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
              >
                Sipariş Detay Raporu
              </button>
            </div>
          </div>
          <Link
            href="/admin/reviews"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Yorum Moderasyonu
            {summary?.pendingReviews ? (
              <span className="bg-white text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {summary.pendingReviews}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      {summary && (
        <QuickStatsWidget
          todayRevenue={summary.todayRevenue}
          todayOrders={summary.todayOrders}
          weekRevenue={summary.weekRevenue}
          weekOrders={summary.weekOrders}
          monthRevenue={summary.monthRevenue}
          monthOrders={summary.monthOrders}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Toplam Gelir (30 Gün)"
          value={
            salesAnalytics
              ? `${salesAnalytics.totalRevenue.toLocaleString("tr-TR")} ₺`
              : "0 ₺"
          }
          change={summary?.revenueChangePercent}
          icon="sales"
          color="blue"
        />
        <SummaryCard
          title="Toplam Sipariş (30 Gün)"
          value={salesAnalytics?.totalOrders || 0}
          change={summary?.orderChangePercent}
          icon="orders"
          color="green"
        />
        <SummaryCard
          title="Toplam Müşteri"
          value={summary?.totalCustomers || 0}
          icon="users"
          color="purple"
        />
        <SummaryCard
          title="Düşük Stok Uyarısı"
          value={summary?.lowStockProducts || 0}
          icon="alerts"
          color={summary && summary.lowStockProducts > 5 ? "red" : "yellow"}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FaChartLine className="text-blue-600" />
              Satış Grafiği
            </h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("daily")}
                className={`px-3 py-1 text-sm rounded-md transition ${
                  activeTab === "daily"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-600"
                }`}
              >
                Günlük
              </button>
              <button
                onClick={() => setActiveTab("monthly")}
                className={`px-3 py-1 text-sm rounded-md transition ${
                  activeTab === "monthly"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-600"
                }`}
              >
                Aylık
              </button>
            </div>
          </div>
          <SalesLineChart
            dailySales={salesAnalytics?.dailySales}
            monthlySales={salesAnalytics?.monthlySales}
            type={activeTab}
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <FaChartPie className="text-green-600" />
            Kategori Dağılımı
          </h3>
          <CategoryDoughnutChart categories={categoryPerformance} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <FaChartBar className="text-purple-600" />
            En Çok Satan Ürünler
          </h3>
          <TopProductsBarChart products={topProducts} />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <FaChartPie className="text-amber-600" />
            Sipariş Durumu Dağılımı
          </h3>
          <OrderStatusChart distribution={orderDistribution} />
        </div>
      </div>

      {/* Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StockAlertsWidget
          alerts={stockAlerts}
          onViewAll={() => (window.location.href = "/admin/products")}
        />
        <TopProductsWidget products={topProducts} />
        <RecentActivitiesWidget activities={recentActivities} />
      </div>

      {/* User Stats */}
      {userStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Kullanıcı Büyümesi
            </h3>
            <UserGrowthChart data={userStats.monthlyGrowth} />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Kullanıcı İstatistikleri
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Toplam Kullanıcı</span>
                <span className="font-bold text-gray-800">
                  {userStats.totalUsers}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Bu Ay Yeni</span>
                <span className="font-bold text-green-600">
                  +{userStats.newUsersThisMonth}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Aktif Kullanıcı (30 gün)</span>
                <span className="font-bold text-blue-600">
                  {userStats.activeUsers}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Tekrar Eden Müşteri</span>
                <span className="font-bold text-purple-600">
                  {userStats.returningCustomers}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Müşteri Tutma Oranı</span>
                <span className="font-bold text-amber-600">
                  %{userStats.customerRetentionRate}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Son Siparişler</h2>
          <Link
            href="/admin/orders"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Tümünü Gör →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
              <tr>
                <th className="p-4 border-b rounded-tl-lg">Sipariş No</th>
                <th className="p-4 border-b">Tarih</th>
                <th className="p-4 border-b">Tutar</th>
                <th className="p-4 border-b">Durum</th>
                <th className="p-4 border-b">Şehir</th>
                <th className="p-4 border-b text-right rounded-tr-lg">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-600">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 border-b last:border-0"
                  >
                    <td className="p-4 font-medium text-gray-800">
                      {order.orderNumber}
                    </td>
                    <td className="p-4">
                      {new Date(order.orderDate).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="p-4 font-bold text-green-600">
                      {order.totalAmount.toLocaleString("tr-TR")} ₺
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === "Teslim Edildi"
                            ? "bg-green-100 text-green-800"
                            : order.status === "Kargoda"
                              ? "bg-purple-100 text-purple-800"
                              : order.status === "İptal"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">{order.city}</td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-800 p-2 inline-block"
                      >
                        <FaEye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    Henüz sipariş yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Cards */}
      {salesAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 text-white">
            <p className="text-blue-100 text-sm">Ortalama Sipariş Değeri</p>
            <p className="text-3xl font-bold mt-2">
              {salesAnalytics.averageOrderValue.toLocaleString("tr-TR")} ₺
            </p>
            <p className="text-blue-200 text-sm mt-2">Son 30 gün</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg p-6 text-white">
            <p className="text-green-100 text-sm">Gelir Büyümesi</p>
            <p className="text-3xl font-bold mt-2">
              {salesAnalytics.revenueGrowth >= 0 ? "+" : ""}
              {salesAnalytics.revenueGrowth}%
            </p>
            <p className="text-green-200 text-sm mt-2">Önceki 30 güne göre</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg p-6 text-white">
            <p className="text-purple-100 text-sm">Sipariş Büyümesi</p>
            <p className="text-3xl font-bold mt-2">
              {salesAnalytics.orderGrowth >= 0 ? "+" : ""}
              {salesAnalytics.orderGrowth}%
            </p>
            <p className="text-purple-200 text-sm mt-2">Önceki 30 güne göre</p>
          </div>
        </div>
      )}
    </div>
  );
}
