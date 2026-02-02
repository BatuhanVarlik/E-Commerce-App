using ETicaret.Application.DTOs.Admin;

namespace ETicaret.Application.Interfaces;

public interface IAnalyticsService
{
    // Dashboard Summary
    Task<DashboardSummaryDto> GetDashboardSummaryAsync();
    
    // Sales Analytics
    Task<SalesAnalyticsDto> GetSalesAnalyticsAsync(int days = 30);
    Task<List<DailySalesDto>> GetDailySalesAsync(int days = 30);
    Task<List<MonthlySalesDto>> GetMonthlySalesAsync(int months = 12);
    
    // Product Analytics
    Task<List<TopProductDto>> GetTopSellingProductsAsync(int count = 10);
    Task<List<CategoryPerformanceDto>> GetCategoryPerformanceAsync();
    
    // User Analytics
    Task<UserStatsDto> GetUserStatsAsync();
    
    // Stock Alerts
    Task<List<StockAlertDto>> GetStockAlertsAsync();
    
    // Order Status Distribution
    Task<List<OrderStatusDistributionDto>> GetOrderStatusDistributionAsync();
    
    // Recent Activities
    Task<List<RecentActivityDto>> GetRecentActivitiesAsync(int count = 20);
    
    // Export
    Task<byte[]> ExportSalesReportAsync(DateTime startDate, DateTime endDate);
    Task<byte[]> ExportProductsReportAsync();
    Task<byte[]> ExportOrdersReportAsync(DateTime startDate, DateTime endDate);
}
