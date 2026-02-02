"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Chart.js kayıt
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

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

interface SalesChartProps {
  dailySales?: DailySales[];
  monthlySales?: MonthlySales[];
  type?: "daily" | "monthly";
}

export function SalesLineChart({
  dailySales,
  monthlySales,
  type = "daily",
}: SalesChartProps) {
  const data = type === "daily" ? dailySales : monthlySales;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Veri bulunamadı
      </div>
    );
  }

  const labels =
    type === "daily"
      ? (data as DailySales[]).map((d) =>
          new Date(d.date).toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "short",
          }),
        )
      : (data as MonthlySales[]).map((d) => d.monthName);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Gelir (₺)",
        data: data.map((d) => d.revenue),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        yAxisID: "y",
      },
      {
        label: "Sipariş Sayısı",
        data: data.map((d) => d.orders),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: false,
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        ticks: {
          callback: function (value: number | string) {
            return new Intl.NumberFormat("tr-TR", {
              style: "currency",
              currency: "TRY",
              maximumFractionDigits: 0,
            }).format(Number(value));
          },
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  );
}

interface CategoryPerformance {
  id: string;
  name: string;
  productCount: number;
  totalSold: number;
  totalRevenue: number;
  percentage: number;
}

interface CategoryChartProps {
  categories: CategoryPerformance[];
}

export function CategoryDoughnutChart({ categories }: CategoryChartProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Veri bulunamadı
      </div>
    );
  }

  const colors = [
    "rgba(59, 130, 246, 0.8)", // Blue
    "rgba(16, 185, 129, 0.8)", // Green
    "rgba(245, 158, 11, 0.8)", // Amber
    "rgba(239, 68, 68, 0.8)", // Red
    "rgba(139, 92, 246, 0.8)", // Purple
    "rgba(236, 72, 153, 0.8)", // Pink
    "rgba(6, 182, 212, 0.8)", // Cyan
    "rgba(132, 204, 22, 0.8)", // Lime
  ];

  const chartData = {
    labels: categories.map((c) => c.name),
    datasets: [
      {
        data: categories.map((c) => c.totalRevenue),
        backgroundColor: colors.slice(0, categories.length),
        borderColor: colors
          .slice(0, categories.length)
          .map((c) => c.replace("0.8", "1")),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: {
            label: string;
            parsed: number;
            dataset: { data: number[] };
          }) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value)} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-72">
      <Doughnut data={chartData} options={options} />
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

interface TopProductsChartProps {
  products: TopProduct[];
}

export function TopProductsBarChart({ products }: TopProductsChartProps) {
  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Veri bulunamadı
      </div>
    );
  }

  const chartData = {
    labels: products.map((p) =>
      p.name.length > 20 ? p.name.substring(0, 20) + "..." : p.name,
    ),
    datasets: [
      {
        label: "Satış Adedi",
        data: products.map((p) => p.totalSold),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          afterLabel: function (context: { dataIndex: number }) {
            const product = products[context.dataIndex];
            return `Gelir: ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(product.totalRevenue)}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
}

interface OrderStatusDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface OrderStatusChartProps {
  distribution: OrderStatusDistribution[];
}

export function OrderStatusChart({ distribution }: OrderStatusChartProps) {
  if (!distribution || distribution.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Veri bulunamadı
      </div>
    );
  }

  const chartData = {
    labels: distribution.map((d) => d.status),
    datasets: [
      {
        data: distribution.map((d) => d.count),
        backgroundColor: distribution.map((d) => d.color + "CC"),
        borderColor: distribution.map((d) => d.color),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: { label: string; parsed: number }) {
            const item = distribution.find((d) => d.status === context.label);
            return `${context.label}: ${context.parsed} sipariş (${item?.percentage || 0}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

interface UserGrowth {
  year: number;
  month: number;
  monthName: string;
  newUsers: number;
  totalUsers: number;
}

interface UserGrowthChartProps {
  data: UserGrowth[];
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Veri bulunamadı
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.monthName),
    datasets: [
      {
        label: "Yeni Kullanıcı",
        data: data.map((d) => d.newUsers),
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}
