using ETicaret.Application.DTOs.Security;
using ETicaret.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ETicaret.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SecurityController : ControllerBase
{
    private readonly ISecurityService _securityService;
    private readonly ITwoFactorAuthService _twoFactorAuthService;

    public SecurityController(
        ISecurityService securityService,
        ITwoFactorAuthService twoFactorAuthService)
    {
        _securityService = securityService;
        _twoFactorAuthService = twoFactorAuthService;
    }

    #region Two-Factor Authentication (2FA)

    /// <summary>
    /// 2FA kurulumu başlat - QR kod ve kurtarma kodları döner
    /// </summary>
    [HttpPost("2fa/setup")]
    [Authorize]
    public async Task<IActionResult> Setup2FA()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await _twoFactorAuthService.SetupAsync(userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 2FA'yı aktifleştir (ilk kurulumdan sonra)
    /// </summary>
    [HttpPost("2fa/enable")]
    [Authorize]
    public async Task<IActionResult> Enable2FA([FromBody] Enable2FARequest request)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await _twoFactorAuthService.EnableAsync(userId, request.Code);
            return Ok(new { success = result, message = "2FA başarıyla aktifleştirildi." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 2FA'yı devre dışı bırak
    /// </summary>
    [HttpPost("2fa/disable")]
    [Authorize]
    public async Task<IActionResult> Disable2FA([FromBody] Disable2FARequest request)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await _twoFactorAuthService.DisableAsync(userId, request.Code, request.CurrentPassword);
            return Ok(new { success = result, message = "2FA başarıyla devre dışı bırakıldı." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 2FA kodunu doğrula (giriş sırasında)
    /// </summary>
    [HttpPost("2fa/verify")]
    public async Task<IActionResult> Verify2FA([FromBody] Verify2FAWithUserRequest request)
    {
        try
        {
            var result = await _twoFactorAuthService.CompleteLoginWith2FAAsync(request.UserId, request.Code);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Kurtarma kodu ile giriş
    /// </summary>
    [HttpPost("2fa/recovery")]
    public async Task<IActionResult> LoginWithRecoveryCode([FromBody] RecoveryCodeLoginRequest request)
    {
        try
        {
            var result = await _twoFactorAuthService.LoginWithRecoveryCodeAsync(request.Email, request.RecoveryCode);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 2FA durumunu kontrol et
    /// </summary>
    [HttpGet("2fa/status")]
    [Authorize]
    public async Task<IActionResult> Get2FAStatus()
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var status = await _twoFactorAuthService.GetStatusAsync(userId);
            return Ok(status);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Yeni kurtarma kodları oluştur
    /// </summary>
    [HttpPost("2fa/regenerate-codes")]
    [Authorize]
    public async Task<IActionResult> RegenerateRecoveryCodes([FromBody] Verify2FARequest request)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var codes = await _twoFactorAuthService.RegenerateRecoveryCodesAsync(userId, request.Code);
            return Ok(new { recoveryCodes = codes, message = "Yeni kurtarma kodları oluşturuldu." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    #endregion

    #region IP Management (Admin Only)

    /// <summary>
    /// Engelli IP'leri listele
    /// </summary>
    [HttpGet("ip/blocked")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetBlockedIps()
    {
        try
        {
            var ips = await _securityService.GetBlockedIpsAsync();
            return Ok(ips);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Güvenilir IP'leri listele
    /// </summary>
    [HttpGet("ip/whitelisted")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetWhitelistedIps()
    {
        try
        {
            var ips = await _securityService.GetWhitelistedIpsAsync();
            return Ok(ips);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// IP engelle
    /// </summary>
    [HttpPost("ip/block")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BlockIp([FromBody] BlockIpRequest request)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _securityService.BlockIpAsync(
                request.IpAddress, 
                request.Reason, 
                userId, 
                request.DurationHours);
            
            return Ok(new { message = $"IP adresi {request.IpAddress} engellendi." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// IP engelini kaldır
    /// </summary>
    [HttpPost("ip/unblock")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UnblockIp([FromBody] UnblockIpRequest request)
    {
        try
        {
            await _securityService.UnblockIpAsync(request.IpAddress);
            return Ok(new { message = $"IP adresi {request.IpAddress} engeli kaldırıldı." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// IP'yi güvenilir listeye ekle
    /// </summary>
    [HttpPost("ip/whitelist")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> WhitelistIp([FromBody] WhitelistIpRequest request)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _securityService.WhitelistIpAsync(request.IpAddress, request.Description, userId);
            return Ok(new { message = $"IP adresi {request.IpAddress} güvenilir listeye eklendi." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// IP'yi güvenilir listeden çıkar
    /// </summary>
    [HttpPost("ip/whitelist/remove")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveFromWhitelist([FromBody] UnblockIpRequest request)
    {
        try
        {
            await _securityService.RemoveFromWhitelistAsync(request.IpAddress);
            return Ok(new { message = $"IP adresi {request.IpAddress} güvenilir listeden çıkarıldı." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    #endregion

    #region Audit Logs (Admin Only)

    /// <summary>
    /// Audit log'ları listele
    /// </summary>
    [HttpGet("audit-logs")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] AuditLogFilter filter)
    {
        try
        {
            var logs = await _securityService.GetAuditLogsAsync(filter);
            return Ok(logs);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Güvenlik özeti al
    /// </summary>
    [HttpGet("summary")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetSecuritySummary(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-30);
            var end = endDate ?? DateTime.UtcNow;
            
            var summary = await _securityService.GetSecuritySummaryAsync(start, end);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    #endregion

    #region Rate Limiting

    /// <summary>
    /// Rate limit durumunu kontrol et
    /// </summary>
    [HttpGet("rate-limit/status")]
    public async Task<IActionResult> GetRateLimitStatus([FromQuery] string? endpoint = null)
    {
        try
        {
            var ipAddress = GetClientIpAddress();
            var status = await _securityService.GetRateLimitStatusAsync(ipAddress, endpoint ?? "default");
            return Ok(status);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Rate limit'i sıfırla (Admin)
    /// </summary>
    [HttpPost("rate-limit/reset")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResetRateLimit([FromBody] ResetRateLimitRequest request)
    {
        try
        {
            await _securityService.ResetRateLimitAsync(request.IpAddress, request.Endpoint);
            return Ok(new { message = $"Rate limit sıfırlandı: {request.IpAddress}" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    #endregion

    private string GetClientIpAddress()
    {
        var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
            return forwardedFor.Split(',')[0].Trim();

        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}

// DTO'lar
public class Verify2FAWithUserRequest
{
    public string UserId { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class UnblockIpRequest
{
    public string IpAddress { get; set; } = string.Empty;
}

public class ResetRateLimitRequest
{
    public string IpAddress { get; set; } = string.Empty;
    public string? Endpoint { get; set; }
}
