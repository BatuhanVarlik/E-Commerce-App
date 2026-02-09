using ETicaret.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ETicaret.API.Controllers;

/// <summary>
/// Public Analytics Controller - Accessible without authentication
/// </summary>
[Route("api/Analytics")]
[ApiController]
public class PublicAnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;
    private readonly ILogger<PublicAnalyticsController> _logger;

    public PublicAnalyticsController(IAnalyticsService analyticsService, ILogger<PublicAnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>
    /// En çok satan ürünleri getirir (Public endpoint)
    /// </summary>
    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopSellingProducts([FromQuery] int count = 8, [FromQuery] int days = 7)
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
}
