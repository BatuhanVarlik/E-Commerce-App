using ETicaret.Application.DTOs.Admin;
using ETicaret.Application.Interfaces;
using ETicaret.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Globalization;
using System.Text;

namespace ETicaret.Infrastructure.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AnalyticsService> _logger;
    
    private static readonly CultureInfo TurkishCulture = new("tr-TR");
    private static readonly string[] MonthNames = { "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
                                                      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık" };

    public AnalyticsService(ApplicationDbContext context, ILogger<AnalyticsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync()
    {
        var today = DateTime.UtcNow.Date;
        var weekStart = today.AddDays(-7);
        var monthStart = today.AddDays(-30);
        var lastMonthStart = today.AddDays(-60);
        var lastMonthEnd = today.AddDays(-30);

        // Bugünün verileri
        var todayOrders = await _context.Orders
            .Where(o => o.OrderDate.Date == today)
            .ToListAsync();
        
        var todayRevenue = todayOrders.Sum(o => o.TotalAmount);
        var todayOrderCount = todayOrders.Count;

        // Bu haftanın verileri
        var weekOrders = await _context.Orders
            .Where(o => o.OrderDate >= weekStart)
            .ToListAsync();
        
        var weekRevenue = weekOrders.Sum(o => o.TotalAmount);
        var weekOrderCount = weekOrders.Count;

        // Bu ayın verileri
        var monthOrders = await _context.Orders
            .Where(o => o.OrderDate >= monthStart)
            .ToListAsync();
        
        var monthRevenue = monthOrders.Sum(o => o.TotalAmount);
        var monthOrderCount = monthOrders.Count;

        // Geçen ayın verileri (karşılaştırma için)
        var lastMonthOrders = await _context.Orders
            .Where(o => o.OrderDate >= lastMonthStart && o.OrderDate < lastMonthEnd)
            .ToListAsync();
        
        var lastMonthRevenue = lastMonthOrders.Sum(o => o.TotalAmount);
        var lastMonthOrderCount = lastMonthOrders.Count;

        // Değişim yüzdeleri
        var revenueChange = lastMonthRevenue > 0 
            ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
            : 100;
        
        var orderChange = lastMonthOrderCount > 0 
            ? ((decimal)(monthOrderCount - lastMonthOrderCount) / lastMonthOrderCount) * 100 
            : 100;

        // Diğer metrikler
        var totalCustomers = await _context.Users.CountAsync(u => u.IsActive);
        var totalProducts = await _context.Products.CountAsync();
        var lowStockProducts = await _context.Products.CountAsync(p => p.Stock <= 10);
        var pendingReviews = await _context.Reviews.CountAsync(r => !r.IsApproved);

        return new DashboardSummaryDto
        {
            TodayRevenue = todayRevenue,
            TodayOrders = todayOrderCount,
            WeekRevenue = weekRevenue,
            WeekOrders = weekOrderCount,
            MonthRevenue = monthRevenue,
            MonthOrders = monthOrderCount,
            RevenueChangePercent = Math.Round(revenueChange, 1),
            OrderChangePercent = Math.Round(orderChange, 1),
            TotalCustomers = totalCustomers,
            TotalProducts = totalProducts,
            LowStockProducts = lowStockProducts,
            PendingReviews = pendingReviews
        };
    }

    public async Task<SalesAnalyticsDto> GetSalesAnalyticsAsync(int days = 30)
    {
        var startDate = DateTime.UtcNow.AddDays(-days);
        var previousStartDate = startDate.AddDays(-days);

        var currentPeriodOrders = await _context.Orders
            .Where(o => o.OrderDate >= startDate)
            .ToListAsync();

        var previousPeriodOrders = await _context.Orders
            .Where(o => o.OrderDate >= previousStartDate && o.OrderDate < startDate)
            .ToListAsync();

        var totalRevenue = currentPeriodOrders.Sum(o => o.TotalAmount);
        var totalOrders = currentPeriodOrders.Count;
        var avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        var prevRevenue = previousPeriodOrders.Sum(o => o.TotalAmount);
        var prevOrders = previousPeriodOrders.Count;

        var revenueGrowth = prevRevenue > 0 
            ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 
            : 100;
        
        var orderGrowth = prevOrders > 0 
            ? (int)(((decimal)(totalOrders - prevOrders) / prevOrders) * 100) 
            : 100;

        var dailySales = await GetDailySalesAsync(days);
        var monthlySales = await GetMonthlySalesAsync(12);

        return new SalesAnalyticsDto
        {
            TotalRevenue = totalRevenue,
            TotalOrders = totalOrders,
            AverageOrderValue = Math.Round(avgOrderValue, 2),
            RevenueGrowth = Math.Round(revenueGrowth, 1),
            OrderGrowth = orderGrowth,
            DailySales = dailySales,
            MonthlySales = monthlySales
        };
    }

    public async Task<List<DailySalesDto>> GetDailySalesAsync(int days = 30)
    {
        var startDate = DateTime.UtcNow.Date.AddDays(-days + 1);
        
        var orders = await _context.Orders
            .Where(o => o.OrderDate >= startDate)
            .ToListAsync();

        var dailyData = new List<DailySalesDto>();
        
        for (int i = 0; i < days; i++)
        {
            var date = startDate.AddDays(i);
            var dayOrders = orders.Where(o => o.OrderDate.Date == date).ToList();
            
            dailyData.Add(new DailySalesDto
            {
                Date = date,
                Revenue = dayOrders.Sum(o => o.TotalAmount),
                Orders = dayOrders.Count
            });
        }

        return dailyData;
    }

    public async Task<List<MonthlySalesDto>> GetMonthlySalesAsync(int months = 12)
    {
        var startDate = DateTime.UtcNow.AddMonths(-months + 1);
        startDate = new DateTime(startDate.Year, startDate.Month, 1);

        var orders = await _context.Orders
            .Where(o => o.OrderDate >= startDate)
            .ToListAsync();

        var monthlyData = new List<MonthlySalesDto>();

        for (int i = 0; i < months; i++)
        {
            var monthDate = startDate.AddMonths(i);
            var monthOrders = orders
                .Where(o => o.OrderDate.Year == monthDate.Year && o.OrderDate.Month == monthDate.Month)
                .ToList();

            monthlyData.Add(new MonthlySalesDto
            {
                Year = monthDate.Year,
                Month = monthDate.Month,
                MonthName = MonthNames[monthDate.Month],
                Revenue = monthOrders.Sum(o => o.TotalAmount),
                Orders = monthOrders.Count
            });
        }

        return monthlyData;
    }

    public async Task<List<TopProductDto>> GetTopSellingProductsAsync(int count = 10)
    {
        var topProducts = await _context.OrderItems
            .Include(oi => oi.Order)
            .GroupBy(oi => oi.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                TotalSold = g.Sum(oi => oi.Quantity),
                TotalRevenue = g.Sum(oi => oi.Price * oi.Quantity)
            })
            .OrderByDescending(x => x.TotalSold)
            .Take(count)
            .ToListAsync();

        var productIds = topProducts.Select(tp => tp.ProductId).ToList();
        
        var products = await _context.Products
            .Include(p => p.Category)
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();

        return topProducts.Select(tp =>
        {
            var product = products.FirstOrDefault(p => p.Id == tp.ProductId);
            return new TopProductDto
            {
                Id = tp.ProductId,
                Name = product?.Name ?? "Bilinmeyen Ürün",
                ImageUrl = product?.ImageUrl ?? "",
                Price = product?.Price ?? 0,
                TotalSold = tp.TotalSold,
                TotalRevenue = tp.TotalRevenue,
                Stock = product?.Stock ?? 0,
                CategoryName = product?.Category?.Name ?? ""
            };
        }).ToList();
    }

    public async Task<List<CategoryPerformanceDto>> GetCategoryPerformanceAsync()
    {
        var categories = await _context.Categories
            .Include(c => c.Products)
            .ToListAsync();

        var orderItems = await _context.OrderItems.ToListAsync();
        var productCategories = await _context.Products
            .Select(p => new { p.Id, p.CategoryId })
            .ToListAsync();

        var totalRevenue = orderItems.Sum(oi => oi.Price * oi.Quantity);

        var categoryPerformance = categories.Select(c =>
        {
            var categoryProductIds = productCategories
                .Where(pc => pc.CategoryId == c.Id)
                .Select(pc => pc.Id)
                .ToList();

            var categoryOrderItems = orderItems
                .Where(oi => categoryProductIds.Contains(oi.ProductId))
                .ToList();

            var categoryRevenue = categoryOrderItems.Sum(oi => oi.Price * oi.Quantity);
            var categorySold = categoryOrderItems.Sum(oi => oi.Quantity);

            return new CategoryPerformanceDto
            {
                Id = c.Id,
                Name = c.Name,
                ProductCount = c.Products.Count,
                TotalSold = categorySold,
                TotalRevenue = categoryRevenue,
                Percentage = totalRevenue > 0 ? Math.Round((categoryRevenue / totalRevenue) * 100, 1) : 0
            };
        })
        .OrderByDescending(cp => cp.TotalRevenue)
        .ToList();

        return categoryPerformance;
    }

    public async Task<UserStatsDto> GetUserStatsAsync()
    {
        var now = DateTime.UtcNow;
        var monthStart = now.AddDays(-30);
        
        var totalUsers = await _context.Users.CountAsync(u => u.IsActive);
        
        var newUsersThisMonth = await _context.Users
            .CountAsync(u => u.CreatedAt >= monthStart);

        // Son 30 günde sipariş veren kullanıcılar
        var activeUserIds = await _context.Orders
            .Where(o => o.OrderDate >= monthStart)
            .Select(o => o.UserId)
            .Distinct()
            .CountAsync();

        // 2+ sipariş veren kullanıcılar
        var returningCustomers = await _context.Orders
            .GroupBy(o => o.UserId)
            .Where(g => g.Count() >= 2)
            .CountAsync();

        var retentionRate = totalUsers > 0 
            ? Math.Round(((decimal)returningCustomers / totalUsers) * 100, 1) 
            : 0;

        // Aylık kullanıcı büyümesi
        var monthlyGrowth = new List<UserGrowthDto>();
        for (int i = 11; i >= 0; i--)
        {
            var monthDate = now.AddMonths(-i);
            var monthStartDate = new DateTime(monthDate.Year, monthDate.Month, 1);
            var monthEndDate = monthStartDate.AddMonths(1);

            var newUsers = await _context.Users
                .CountAsync(u => u.CreatedAt >= monthStartDate && u.CreatedAt < monthEndDate);

            var totalAtMonth = await _context.Users
                .CountAsync(u => u.CreatedAt < monthEndDate);

            monthlyGrowth.Add(new UserGrowthDto
            {
                Year = monthDate.Year,
                Month = monthDate.Month,
                MonthName = MonthNames[monthDate.Month],
                NewUsers = newUsers,
                TotalUsers = totalAtMonth
            });
        }

        return new UserStatsDto
        {
            TotalUsers = totalUsers,
            NewUsersThisMonth = newUsersThisMonth,
            ActiveUsers = activeUserIds,
            ReturningCustomers = returningCustomers,
            CustomerRetentionRate = retentionRate,
            MonthlyGrowth = monthlyGrowth
        };
    }

    public async Task<List<StockAlertDto>> GetStockAlertsAsync()
    {
        var lowStockProducts = await _context.Products
            .Include(p => p.Category)
            .Where(p => p.Stock <= 20)
            .OrderBy(p => p.Stock)
            .ToListAsync();

        return lowStockProducts.Select(p => new StockAlertDto
        {
            ProductId = p.Id,
            ProductName = p.Name,
            ImageUrl = p.ImageUrl,
            CurrentStock = p.Stock,
            CategoryName = p.Category?.Name ?? "",
            AlertLevel = p.Stock switch
            {
                0 => StockAlertLevel.OutOfStock,
                <= 5 => StockAlertLevel.Critical,
                <= 10 => StockAlertLevel.Low,
                _ => StockAlertLevel.Warning
            }
        }).ToList();
    }

    public async Task<List<OrderStatusDistributionDto>> GetOrderStatusDistributionAsync()
    {
        var orders = await _context.Orders.ToListAsync();
        var totalOrders = orders.Count;

        if (totalOrders == 0)
            return new List<OrderStatusDistributionDto>();

        var statusGroups = orders
            .GroupBy(o => o.Status)
            .Select(g => new OrderStatusDistributionDto
            {
                Status = g.Key,
                Count = g.Count(),
                Percentage = Math.Round(((decimal)g.Count() / totalOrders) * 100, 1),
                Color = GetStatusColor(g.Key)
            })
            .OrderByDescending(s => s.Count)
            .ToList();

        return statusGroups;
    }

    private static string GetStatusColor(string status) => status switch
    {
        "Ödendi" => "#3B82F6",      // Blue
        "Hazırlanıyor" => "#F59E0B", // Amber
        "Kargoda" => "#8B5CF6",      // Purple
        "Teslim Edildi" => "#10B981", // Green
        "İptal" => "#EF4444",         // Red
        "Pending" => "#6B7280",       // Gray
        _ => "#9CA3AF"               // Light gray
    };

    public async Task<List<RecentActivityDto>> GetRecentActivitiesAsync(int count = 20)
    {
        var activities = new List<RecentActivityDto>();

        // Son siparişler
        var recentOrders = await _context.Orders
            .OrderByDescending(o => o.OrderDate)
            .Take(count / 3)
            .ToListAsync();

        activities.AddRange(recentOrders.Select(o => new RecentActivityDto
        {
            Type = "Order",
            Description = $"Yeni sipariş: {o.OrderNumber} - {o.TotalAmount:N0} ₺",
            Timestamp = o.OrderDate,
            Icon = "shopping-cart",
            Color = "#3B82F6"
        }));

        // Son yorumlar
        var recentReviews = await _context.Reviews
            .Include(r => r.Product)
            .OrderByDescending(r => r.CreatedAt)
            .Take(count / 3)
            .ToListAsync();

        activities.AddRange(recentReviews.Select(r => new RecentActivityDto
        {
            Type = "Review",
            Description = $"Yeni yorum: {r.Product?.Name ?? "Ürün"} - {r.Rating} yıldız",
            Timestamp = r.CreatedAt,
            Icon = "star",
            Color = "#F59E0B"
        }));

        // Son kullanıcılar
        var recentUsers = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Take(count / 3)
            .ToListAsync();

        activities.AddRange(recentUsers.Select(u => new RecentActivityDto
        {
            Type = "User",
            Description = $"Yeni kullanıcı: {u.FirstName} {u.LastName}",
            Timestamp = u.CreatedAt,
            Icon = "user",
            Color = "#10B981"
        }));

        return activities.OrderByDescending(a => a.Timestamp).Take(count).ToList();
    }

    public async Task<byte[]> ExportSalesReportAsync(DateTime startDate, DateTime endDate)
    {
        var orders = await _context.Orders
            .Include(o => o.Items)
            .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();

        var sb = new StringBuilder();
        
        // CSV Header
        sb.AppendLine("Sipariş No,Tarih,Müşteri Email,Toplam Tutar,Durum,Şehir,Ürün Sayısı");
        
        foreach (var order in orders)
        {
            sb.AppendLine($"{order.OrderNumber},{order.OrderDate:yyyy-MM-dd},{order.UserEmail},{order.TotalAmount:F2},{order.Status},{order.City},{order.Items.Count}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> ExportProductsReportAsync()
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .OrderBy(p => p.Name)
            .ToListAsync();

        var sb = new StringBuilder();
        
        // CSV Header
        sb.AppendLine("Ürün Adı,Kategori,Marka,Fiyat,Stok,Durum");
        
        foreach (var product in products)
        {
            var status = product.Stock switch
            {
                0 => "Stokta Yok",
                <= 10 => "Düşük Stok",
                _ => "Stokta"
            };
            sb.AppendLine($"{product.Name},{product.Category?.Name ?? ""},{product.Brand?.Name ?? ""},{product.Price:F2},{product.Stock},{status}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> ExportOrdersReportAsync(DateTime startDate, DateTime endDate)
    {
        var orders = await _context.Orders
            .Include(o => o.Items)
            .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();

        var sb = new StringBuilder();
        
        // CSV Header
        sb.AppendLine("Sipariş No,Tarih,Müşteri Email,Ürün Adı,Miktar,Birim Fiyat,Ara Toplam,Sipariş Durumu");
        
        foreach (var order in orders)
        {
            foreach (var item in order.Items)
            {
                sb.AppendLine($"{order.OrderNumber},{order.OrderDate:yyyy-MM-dd},{order.UserEmail},{item.ProductName},{item.Quantity},{item.Price:F2},{(item.Price * item.Quantity):F2},{order.Status}");
            }
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }
}
