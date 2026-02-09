using ETicaret.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ETicaret.API.Controllers;

/// <summary>
/// Admin Analytics Controller - Only for authenticated admins
/// </summary>
[Route("api/admin/analytics")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(IAnalyticsService analyticsService, ILogger<AnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>
    /// Dashboard özet bilgilerini getirir
    /// </summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        try
        {
            var summary = await _analyticsService.GetDashboardSummaryAsync();
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Dashboard özeti alınırken hata oluştu");
            return StatusCode(500, new { message = "Özet bilgileri alınırken bir hata oluştu" });
        }
    }

    /// <summary>
    /// Satış analitiğini getirir
    /// </summary>
    [HttpGet("sales")]
    public async Task<IActionResult> GetSalesAnalytics([FromQuery] int days = 30)
    {
        try
        {
            var analytics = await _analyticsService.GetSalesAnalyticsAsync(days);
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Satış analitiği alınırken hata oluştu");
            return StatusCode(500, new { message = "Satış verileri alınırken bir hata oluştu" });
        }
    }

    /// <summary>
    /// Günlük satış verilerini getirir
    /// </summary>
    [HttpGet("sales/daily")]
    public async Task<IActionResult> GetDailySales([FromQuery] int days = 30)
    {
        try
        {
            var dailySales = await _analyticsService.GetDailySalesAsync(days);
            return Ok(dailySales);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Günlük satış verileri alınırken hata oluştu");
            return StatusCode(500, new { message = "Günlük satış verileri alınırken bir hata oluştu" });
        }
    }

    /// <summary>
    /// Aylık satış verilerini getirir
    /// </summary>
    [HttpGet("sales/monthly")]
    public async Task<IActionResult> GetMonthlySales([FromQuery] int months = 12)
    {
        try
        {
            var monthlySales = await _analyticsService.GetMonthlySalesAsync(months);
            return Ok(monthlySales);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Aylık satış verileri alınırken hata oluştu");
            return StatusCode(500, new { message = "Aylık satış verileri alınırken bir hata oluştu" });
        }
    }

    /// <summary>
    /// En çok satan ürünleri getirir
    /// </summary>
    [HttpGet("products/top")]
    public async Task<IActionResult> GetTopSellingProducts([FromQuery] int count = 10)
    {
        try
        {
            var topProducts = await _analyticsService.GetTopSellingProductsAsync(count);
            return Ok(topProducts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "En çok satan ürünler alınırken hata oluştu");
            return StatusCode(500, new { message = "Ürün verileri alınırken bir hata oluştu" });
        }
    }

    /// <summary>
    /// Kategori performansını getirir
    /// </summary>
    [HttpGet("categories/performance")]
    public async Task<IActionResult> GetCategoryPerformance()
    {
        try
        {
            var performance = await _analyticsService.GetCategoryPerformanceAsync();
            return Ok(performance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kategori performansı alınırken hata oluştu");
            return StatusCode(500, new { message = "Kategori verileri alınırken bir hata oluştu" });
        }
    }

    /// <summary>
    /// Kullanıcı istatistiklerini getirir
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetUserStats()
    {
        try
        {
            var stats = await _analyticsService.GetUserStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kullanıcı istatistikleri alınırken hata oluştu");
            return StatusCode(500, new { message = "Kullanıcı verileri alınırken bir hata oluştu" });
        }
    }

    /// <summary>
    /// Stok uyarılarını getirir
    /// </summary>
    [HttpGet("stock-alerts")]
    public async Task<IActionResult> GetStockAlerts()
    {
        try
        {
            var alerts = await _analyticsService.GetStockAlertsAsync();
            return Ok(alerts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Stok uyarıları alınırken hata oluştu");
            return StatusCode(500, new { message = "Stok uyarıları alınırken bir hata oluştu" });
        }
    }

    /// <summary>
    /// Sipariş durumu dağılımını getirir
    /// </summary>
    [HttpGet("orders/status-distribution")]
    public async Task<IActionResult> GetOrderStatusDistribution()
    {
        try
        {
            var distribution = await _analyticsService.GetOrderStatusDistributionAsync();
            return Ok(distribution);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sipariş durumu dağılımı alınırken hata oluştu");
            return StatusCode(500, new { message = "Sipariş verileri alınırken bir hata oluştu" });
        }
    }

    /// <summary>
    /// Son aktiviteleri getirir
    /// </summary>
    [HttpGet("activities")]
    public async Task<IActionResult> GetRecentActivities([FromQuery] int count = 20)
    {
        try
        {
            var activities = await _analyticsService.GetRecentActivitiesAsync(count);
            return Ok(activities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Son aktiviteler alınırken hata oluştu");
            return StatusCode(500, new { message = "Aktivite verileri alınırken bir hata oluştu" });
        }
    }

    /// <summary>
    /// Satış raporunu Excel (CSV) olarak dışa aktarır
    /// </summary>
    [HttpGet("export/sales")]
    public async Task<IActionResult> ExportSalesReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        try
        {
            var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
            var end = endDate ?? DateTime.UtcNow;

            var csvBytes = await _analyticsService.ExportSalesReportAsync(start, end);
            
            return File(csvBytes, "text/csv", $"satis-raporu-{start:yyyyMMdd}-{end:yyyyMMdd}.csv");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Satış raporu dışa aktarılırken hata oluştu");
            return StatusCode(500, new { message = "Rapor oluşturulurken bir hata oluştu" });
        }
    }

    /// <summary>
    /// Ürün raporunu Excel (CSV) olarak dışa aktarır
    /// </summary>
    [HttpGet("export/products")]
    public async Task<IActionResult> ExportProductsReport()
    {
        try
        {
            var csvBytes = await _analyticsService.ExportProductsReportAsync();
            
            return File(csvBytes, "text/csv", $"urun-raporu-{DateTime.UtcNow:yyyyMMdd}.csv");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ürün raporu dışa aktarılırken hata oluştu");
            return StatusCode(500, new { message = "Rapor oluşturulurken bir hata oluştu" });
        }
    }

    /// <summary>
    /// Sipariş detay raporunu Excel (CSV) olarak dışa aktarır
    /// </summary>
    [HttpGet("export/orders")]
    public async Task<IActionResult> ExportOrdersReport([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        try
        {
            var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
            var end = endDate ?? DateTime.UtcNow;

            var csvBytes = await _analyticsService.ExportOrdersReportAsync(start, end);
            
            return File(csvBytes, "text/csv", $"siparis-detay-raporu-{start:yyyyMMdd}-{end:yyyyMMdd}.csv");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sipariş raporu dışa aktarılırken hata oluştu");
            return StatusCode(500, new { message = "Rapor oluşturulurken bir hata oluştu" });
        }
    }
}
