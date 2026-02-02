namespace ETicaret.Application.DTOs.Admin;

/// <summary>
/// Satış analizi için kullanılan DTO
/// </summary>
public class SalesAnalyticsDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public decimal AverageOrderValue { get; set; }
    public decimal RevenueGrowth { get; set; } // Yüzdesel değişim
    public int OrderGrowth { get; set; } // Yüzdesel değişim
    public List<DailySalesDto> DailySales { get; set; } = new();
    public List<MonthlySalesDto> MonthlySales { get; set; } = new();
}

public class DailySalesDto
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
}

public class MonthlySalesDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
}

/// <summary>
/// En çok satan ürünler için DTO
/// </summary>
public class TopProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int TotalSold { get; set; }
    public decimal TotalRevenue { get; set; }
    public int Stock { get; set; }
    public string CategoryName { get; set; } = string.Empty;
}

/// <summary>
/// Kategori performansı için DTO
/// </summary>
public class CategoryPerformanceDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int ProductCount { get; set; }
    public int TotalSold { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal Percentage { get; set; } // Toplam gelirin yüzdesi
}

/// <summary>
/// Kullanıcı istatistikleri için DTO
/// </summary>
public class UserStatsDto
{
    public int TotalUsers { get; set; }
    public int NewUsersThisMonth { get; set; }
    public int ActiveUsers { get; set; } // Son 30 günde sipariş veren
    public int ReturningCustomers { get; set; } // 2+ sipariş veren
    public decimal CustomerRetentionRate { get; set; }
    public List<UserGrowthDto> MonthlyGrowth { get; set; } = new();
}

public class UserGrowthDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public int NewUsers { get; set; }
    public int TotalUsers { get; set; }
}

/// <summary>
/// Stok uyarıları için DTO
/// </summary>
public class StockAlertDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public StockAlertLevel AlertLevel { get; set; }
}

public enum StockAlertLevel
{
    OutOfStock = 0,    // Stokta yok
    Critical = 1,      // 5 ve altı
    Low = 2,           // 10 ve altı
    Warning = 3        // 20 ve altı
}

/// <summary>
/// Sipariş durumu dağılımı
/// </summary>
public class OrderStatusDistributionDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
    public string Color { get; set; } = string.Empty; // UI için renk kodu
}

/// <summary>
/// Son aktiviteler için DTO
/// </summary>
public class RecentActivityDto
{
    public string Type { get; set; } = string.Empty; // Order, Review, User
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

/// <summary>
/// Dashboard özet bilgileri
/// </summary>
public class DashboardSummaryDto
{
    public decimal TodayRevenue { get; set; }
    public int TodayOrders { get; set; }
    public decimal WeekRevenue { get; set; }
    public int WeekOrders { get; set; }
    public decimal MonthRevenue { get; set; }
    public int MonthOrders { get; set; }
    
    // Karşılaştırma (önceki dönem)
    public decimal RevenueChangePercent { get; set; }
    public decimal OrderChangePercent { get; set; }
    
    // Özet bilgiler
    public int TotalCustomers { get; set; }
    public int TotalProducts { get; set; }
    public int LowStockProducts { get; set; }
    public int PendingReviews { get; set; }
}
