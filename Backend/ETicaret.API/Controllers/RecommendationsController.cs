using ETicaret.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ETicaret.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecommendationsController : ControllerBase
{
    private readonly IRecommendationService _recommendationService;
    private readonly ILogger<RecommendationsController> _logger;

    public RecommendationsController(
        IRecommendationService recommendationService,
        ILogger<RecommendationsController> logger)
    {
        _recommendationService = recommendationService;
        _logger = logger;
    }

    [HttpGet("similar/{productId}")]
    public async Task<IActionResult> GetSimilarProducts(Guid productId, [FromQuery] int count = 6)
    {
        var products = await _recommendationService.GetSimilarProductsAsync(productId, count);
        return Ok(products);
    }

    [HttpGet("frequently-bought-together/{productId}")]
    public async Task<IActionResult> GetFrequentlyBoughtTogether(Guid productId, [FromQuery] int count = 6)
    {
        var products = await _recommendationService.GetFrequentlyBoughtTogetherAsync(productId, count);
        return Ok(products);
    }

    [HttpGet("personalized")]
    public async Task<IActionResult> GetPersonalizedRecommendations([FromQuery] string? sessionId, [FromQuery] int count = 12)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? userId = userIdClaim != null ? Guid.Parse(userIdClaim) : null;

        var products = await _recommendationService.GetPersonalizedRecommendationsAsync(userId, sessionId, count);
        return Ok(products);
    }

    [HttpGet("all/{productId}")]
    public async Task<IActionResult> GetAllRecommendations(Guid productId, [FromQuery] string? sessionId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? userId = userIdClaim != null ? Guid.Parse(userIdClaim) : null;

        var recommendations = await _recommendationService.GetAllRecommendationsAsync(productId, userId, sessionId);
        return Ok(recommendations);
    }

    [HttpPost("track-view/{productId}")]
    public async Task<IActionResult> TrackProductView(Guid productId, [FromBody] TrackViewRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? userId = userIdClaim != null ? Guid.Parse(userIdClaim) : null;

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers["User-Agent"].ToString();

        await _recommendationService.TrackProductViewAsync(
            productId,
            userId,
            request.SessionId,
            ipAddress,
            userAgent);

        return Ok(new { success = true });
    }
}

public class TrackViewRequest
{
    public string? SessionId { get; set; }
}
