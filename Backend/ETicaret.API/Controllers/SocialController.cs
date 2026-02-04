using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ETicaret.Application.DTOs.Social;
using ETicaret.Application.Interfaces;

namespace ETicaret.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SocialController : ControllerBase
{
    private readonly IReferralService _referralService;
    private readonly IPointsService _pointsService;
    private readonly ISocialShareService _socialShareService;
    private readonly ILogger<SocialController> _logger;

    public SocialController(
        IReferralService referralService,
        IPointsService pointsService,
        ISocialShareService socialShareService,
        ILogger<SocialController> logger)
    {
        _referralService = referralService;
        _pointsService = pointsService;
        _socialShareService = socialShareService;
        _logger = logger;
    }

    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // ===== Referral Endpoints =====

    /// <summary>
    /// Kullanıcının referans kodunu oluştur/getir
    /// </summary>
    [HttpPost("referral/create")]
    [Authorize]
    public async Task<ActionResult<CreateReferralResponse>> CreateReferralCode()
    {
        try
        {
            var result = await _referralService.CreateReferralCodeAsync(GetUserId());
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating referral code");
            return StatusCode(500, new { message = "Referans kodu oluşturulamadı" });
        }
    }

    /// <summary>
    /// Kullanıcının referans istatistiklerini getir
    /// </summary>
    [HttpGet("referral/stats")]
    [Authorize]
    public async Task<ActionResult<ReferralStatsDto>> GetReferralStats()
    {
        try
        {
            var stats = await _referralService.GetUserReferralStatsAsync(GetUserId());
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting referral stats");
            return StatusCode(500, new { message = "Referans istatistikleri alınamadı" });
        }
    }

    /// <summary>
    /// Kullanıcının tüm referanslarını listele
    /// </summary>
    [HttpGet("referral/list")]
    [Authorize]
    public async Task<ActionResult> GetUserReferrals()
    {
        try
        {
            var referrals = await _referralService.GetUserReferralsAsync(GetUserId());
            return Ok(referrals);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user referrals");
            return StatusCode(500, new { message = "Referanslar alınamadı" });
        }
    }

    /// <summary>
    /// Referans linki tıklamasını kaydet (public)
    /// </summary>
    [HttpPost("referral/track/{code}")]
    public async Task<IActionResult> TrackReferralClick(string code)
    {
        try
        {
            await _referralService.TrackReferralClickAsync(code);
            return Ok(new { message = "Tıklama kaydedildi" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking referral click");
            return Ok(); // Hata olsa bile kullanıcıyı etkilemesin
        }
    }

    /// <summary>
    /// Referans kodunu kayıt sırasında uygula
    /// </summary>
    [HttpPost("referral/apply")]
    [Authorize]
    public async Task<IActionResult> ApplyReferral([FromBody] ApplyReferralRequest request)
    {
        try
        {
            var success = await _referralService.ApplyReferralAsync(GetUserId(), request.ReferralCode);
            if (success)
            {
                // Hoş geldin bonusu ver
                await _pointsService.EarnWelcomeBonusAsync(GetUserId());
                return Ok(new { message = "Referans kodu başarıyla uygulandı!" });
            }
            return BadRequest(new { message = "Geçersiz veya kullanılmış referans kodu" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying referral");
            return StatusCode(500, new { message = "Referans kodu uygulanamadı" });
        }
    }

    /// <summary>
    /// Referans kodunun geçerliliğini kontrol et (public)
    /// </summary>
    [HttpGet("referral/validate/{code}")]
    public async Task<ActionResult> ValidateReferralCode(string code)
    {
        try
        {
            var referral = await _referralService.GetReferralByCodeAsync(code);
            if (referral == null || referral.Status == "Completed" || referral.Status == "Expired")
            {
                return Ok(new { valid = false, message = "Geçersiz veya kullanılmış referans kodu" });
            }
            return Ok(new { valid = true, message = "Geçerli referans kodu" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating referral code");
            return Ok(new { valid = false, message = "Kod doğrulanamadı" });
        }
    }

    // ===== Points Endpoints =====

    /// <summary>
    /// Kullanıcının puan bilgilerini getir
    /// </summary>
    [HttpGet("points")]
    [Authorize]
    public async Task<ActionResult<UserPointsDto>> GetUserPoints()
    {
        try
        {
            var points = await _pointsService.GetUserPointsAsync(GetUserId());
            return Ok(points);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user points");
            return StatusCode(500, new { message = "Puan bilgileri alınamadı" });
        }
    }

    /// <summary>
    /// Puan işlem geçmişini getir
    /// </summary>
    [HttpGet("points/transactions")]
    [Authorize]
    public async Task<ActionResult> GetPointTransactions([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var transactions = await _pointsService.GetPointTransactionsAsync(GetUserId(), page, pageSize);
            return Ok(transactions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting point transactions");
            return StatusCode(500, new { message = "İşlem geçmişi alınamadı" });
        }
    }

    /// <summary>
    /// Puan kullan (redeem)
    /// </summary>
    [HttpPost("points/redeem")]
    [Authorize]
    public async Task<ActionResult<RedeemPointsResponse>> RedeemPoints([FromBody] RedeemPointsRequest request)
    {
        try
        {
            var result = await _pointsService.RedeemPointsAsync(GetUserId(), request.Points);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error redeeming points");
            return StatusCode(500, new { message = "Puanlar kullanılamadı" });
        }
    }

    /// <summary>
    /// Tier indirim oranını getir
    /// </summary>
    [HttpGet("points/tier-discount")]
    [Authorize]
    public async Task<ActionResult> GetTierDiscount()
    {
        try
        {
            var discount = await _pointsService.GetTierDiscountAsync(GetUserId());
            return Ok(new { discountRate = discount, discountPercentage = discount * 100 });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tier discount");
            return StatusCode(500, new { message = "İndirim oranı alınamadı" });
        }
    }

    /// <summary>
    /// Liderlik tablosunu getir
    /// </summary>
    [HttpGet("leaderboard")]
    public async Task<ActionResult<LeaderboardDto>> GetLeaderboard([FromQuery] int limit = 10)
    {
        try
        {
            string? userId = User.Identity?.IsAuthenticated == true ? GetUserId() : null;
            var leaderboard = await _pointsService.GetLeaderboardAsync(userId, limit);
            return Ok(leaderboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting leaderboard");
            return StatusCode(500, new { message = "Liderlik tablosu alınamadı" });
        }
    }

    // ===== Social Share Endpoints =====

    /// <summary>
    /// Ürün paylaşım linklerini getir
    /// </summary>
    [HttpGet("share/product/{productId}")]
    public async Task<ActionResult<SocialShareDto>> GetProductShareLinks(Guid productId)
    {
        try
        {
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var shareLinks = await _socialShareService.GetProductShareLinksAsync(productId, baseUrl);
            return Ok(shareLinks);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Ürün bulunamadı" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting share links");
            return StatusCode(500, new { message = "Paylaşım linkleri alınamadı" });
        }
    }

    /// <summary>
    /// Paylaşımı kaydet (tracking)
    /// </summary>
    [HttpPost("share/track")]
    public async Task<IActionResult> TrackShare([FromBody] ShareProductRequest request)
    {
        try
        {
            string? userId = User.Identity?.IsAuthenticated == true ? GetUserId() : null;
            await _socialShareService.TrackShareAsync(userId, request.ProductId, request.Platform);
            return Ok(new { message = "Paylaşım kaydedildi" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking share");
            return Ok(); // Hata olsa bile kullanıcıyı etkilemesin
        }
    }
}
