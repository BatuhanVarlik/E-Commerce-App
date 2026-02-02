"use client";

import {
  FaArrowUp,
  FaArrowDown,
  FaShoppingCart,
  FaDollarSign,
  FaUsers,
  FaBox,
  FaExclamationTriangle,
  FaStar,
} from "react-icons/fa";

interface SummaryCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: "sales" | "orders" | "users" | "products" | "alerts" | "reviews";
  color: "blue" | "green" | "yellow" | "red" | "purple" | "orange";
}

const iconMap = {
  sales: FaDollarSign,
  orders: FaShoppingCart,
  users: FaUsers,
  products: FaBox,
  alerts: FaExclamationTriangle,
  reviews: FaStar,
};

const colorMap = {
  blue: {
    bg: "bg-blue-500",
    light: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-500",
  },
  green: {
    bg: "bg-green-500",
    light: "bg-green-50",
    text: "text-green-600",
    border: "border-green-500",
  },
  yellow: {
    bg: "bg-yellow-500",
    light: "bg-yellow-50",
    text: "text-yellow-600",
    border: "border-yellow-500",
  },
  red: {
    bg: "bg-red-500",
    light: "bg-red-50",
    text: "text-red-600",
    border: "border-red-500",
  },
  purple: {
    bg: "bg-purple-500",
    light: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-500",
  },
  orange: {
    bg: "bg-orange-500",
    light: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-500",
  },
};

export function SummaryCard({
  title,
  value,
  change,
  icon,
  color,
}: SummaryCardProps) {
  const Icon = iconMap[icon];
  const colors = colorMap[color];

  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${colors.border} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {change !== undefined && (
            <div
              className={`flex items-center mt-2 text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {change >= 0 ? (
                <FaArrowUp className="mr-1" size={12} />
              ) : (
                <FaArrowDown className="mr-1" size={12} />
              )}
              <span>{Math.abs(change)}% önceki döneme göre</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-full ${colors.light}`}>
          <Icon className={colors.text} size={24} />
        </div>
      </div>
    </div>
  );
}

interface StockAlert {
  productId: string;
  productName: string;
  imageUrl: string;
  currentStock: number;
  categoryName: string;
  alertLevel: number; // 0: OutOfStock, 1: Critical, 2: Low, 3: Warning
}

interface StockAlertsWidgetProps {
  alerts: StockAlert[];
  onViewAll?: () => void;
}

const alertLevelColors = {
  0: { bg: "bg-red-100", text: "text-red-800", label: "Stokta Yok" },
  1: { bg: "bg-red-50", text: "text-red-700", label: "Kritik" },
  2: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Düşük" },
  3: { bg: "bg-orange-50", text: "text-orange-700", label: "Uyarı" },
};

export function StockAlertsWidget({
  alerts,
  onViewAll,
}: StockAlertsWidgetProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Stok Uyarıları
          </h3>
        </div>
        <div className="flex items-center justify-center py-8 text-gray-500">
          <FaExclamationTriangle className="mr-2" />
          <span>Stok uyarısı bulunmuyor</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Stok Uyarıları</h3>
        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {alerts.length} ürün
        </span>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {alerts.slice(0, 5).map((alert) => {
          const levelStyle =
            alertLevelColors[
              alert.alertLevel as keyof typeof alertLevelColors
            ] || alertLevelColors[3];
          return (
            <div
              key={alert.productId}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                {alert.imageUrl ? (
                  <img
                    src={alert.imageUrl}
                    alt={alert.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaBox className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {alert.productName}
                </p>
                <p className="text-xs text-gray-500">{alert.categoryName}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded ${levelStyle.bg} ${levelStyle.text}`}
                >
                  {levelStyle.label}
                </span>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  {alert.currentStock} adet
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {alerts.length > 5 && onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Tümünü Gör ({alerts.length} ürün)
        </button>
      )}
    </div>
  );
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

interface TopProductsWidgetProps {
  products: TopProduct[];
}

export function TopProductsWidget({ products }: TopProductsWidgetProps) {
  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          En Çok Satanlar
        </h3>
        <div className="flex items-center justify-center py-8 text-gray-500">
          Veri bulunamadı
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        En Çok Satanlar
      </h3>
      <div className="space-y-3">
        {products.slice(0, 5).map((product, index) => (
          <div
            key={product.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
              {index + 1}
            </div>
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FaBox className="text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {product.name}
              </p>
              <p className="text-xs text-gray-500">{product.totalSold} satış</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-600">
                {product.totalRevenue.toLocaleString("tr-TR")} ₺
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

interface RecentActivitiesWidgetProps {
  activities: RecentActivity[];
}

const activityIcons: Record<string, typeof FaShoppingCart> = {
  Order: FaShoppingCart,
  Review: FaStar,
  User: FaUsers,
};

export function RecentActivitiesWidget({
  activities,
}: RecentActivitiesWidgetProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Son Aktiviteler
        </h3>
        <div className="flex items-center justify-center py-8 text-gray-500">
          Aktivite bulunamadı
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Son Aktiviteler
      </h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.slice(0, 10).map((activity, index) => {
          const Icon = activityIcons[activity.type] || FaBox;
          return (
            <div key={index} className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: activity.color + "20" }}
              >
                <Icon style={{ color: activity.color }} size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.timestamp).toLocaleString("tr-TR")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface QuickStatsProps {
  todayRevenue: number;
  todayOrders: number;
  weekRevenue: number;
  weekOrders: number;
  monthRevenue: number;
  monthOrders: number;
}

export function QuickStatsWidget({
  todayRevenue,
  todayOrders,
  weekRevenue,
  weekOrders,
  monthRevenue,
  monthOrders,
}: QuickStatsProps) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
      <h3 className="text-lg font-semibold mb-4">Hızlı Bakış</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-blue-200 text-xs uppercase">Bugün</p>
          <p className="text-2xl font-bold mt-1">
            {todayRevenue.toLocaleString("tr-TR")} ₺
          </p>
          <p className="text-blue-200 text-sm">{todayOrders} sipariş</p>
        </div>
        <div className="text-center border-x border-blue-500">
          <p className="text-blue-200 text-xs uppercase">Bu Hafta</p>
          <p className="text-2xl font-bold mt-1">
            {weekRevenue.toLocaleString("tr-TR")} ₺
          </p>
          <p className="text-blue-200 text-sm">{weekOrders} sipariş</p>
        </div>
        <div className="text-center">
          <p className="text-blue-200 text-xs uppercase">Bu Ay</p>
          <p className="text-2xl font-bold mt-1">
            {monthRevenue.toLocaleString("tr-TR")} ₺
          </p>
          <p className="text-blue-200 text-sm">{monthOrders} sipariş</p>
        </div>
      </div>
    </div>
  );
}
