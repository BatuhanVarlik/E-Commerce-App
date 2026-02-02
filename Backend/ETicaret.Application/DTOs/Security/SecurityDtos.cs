namespace ETicaret.Application.DTOs.Security;

/// <summary>
/// 2FA kurulum isteği
/// </summary>
public class Setup2FARequest
{
    // Boş - sadece istek yapmak için
}

/// <summary>
/// 2FA kurulum yanıtı
/// </summary>
public class Setup2FAResponse
{
    /// <summary>
    /// QR kod için base64 encoded image
    /// </summary>
    public string QrCodeImage { get; set; } = string.Empty;
    
    /// <summary>
    /// Manuel giriş için secret key
    /// </summary>
    public string ManualEntryKey { get; set; } = string.Empty;
    
    /// <summary>
    /// Kurtarma kodları
    /// </summary>
    public List<string> RecoveryCodes { get; set; } = new();
}

/// <summary>
/// 2FA doğrulama isteği
/// </summary>
public class Verify2FARequest
{
    /// <summary>
    /// TOTP kodu (6 haneli)
    /// </summary>
    public string Code { get; set; } = string.Empty;
}

/// <summary>
/// 2FA aktifleştirme isteği
/// </summary>
public class Enable2FARequest
{
    /// <summary>
    /// Doğrulama kodu
    /// </summary>
    public string Code { get; set; } = string.Empty;
}

/// <summary>
/// 2FA devre dışı bırakma isteği
/// </summary>
public class Disable2FARequest
{
    /// <summary>
    /// Doğrulama kodu veya kurtarma kodu
    /// </summary>
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// Mevcut şifre (güvenlik için)
    /// </summary>
    public string CurrentPassword { get; set; } = string.Empty;
}

/// <summary>
/// 2FA durumu
/// </summary>
public class TwoFactorStatusDto
{
    public bool IsEnabled { get; set; }
    public DateTime? LastVerifiedAt { get; set; }
    public int RemainingRecoveryCodes { get; set; }
}

/// <summary>
/// Kurtarma kodu ile giriş
/// </summary>
public class RecoveryCodeLoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string RecoveryCode { get; set; } = string.Empty;
}

/// <summary>
/// IP engelleme isteği
/// </summary>
public class BlockIpRequest
{
    public string IpAddress { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    /// <summary>
    /// Engelleme süresi (saat). Null ise kalıcı.
    /// </summary>
    public int? DurationHours { get; set; }
}

/// <summary>
/// IP güvenilir listeye ekleme isteği
/// </summary>
public class WhitelistIpRequest
{
    public string IpAddress { get; set; } = string.Empty;
    public string? Description { get; set; }
}

/// <summary>
/// IP listesi yanıtı
/// </summary>
public class IpListDto
{
    public int Id { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string? Description { get; set; }
    public bool IsAutomatic { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Audit log DTO
/// </summary>
public class AuditLogDto
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? IpAddress { get; set; }
    public string? Endpoint { get; set; }
    public string? HttpMethod { get; set; }
    public bool IsSuccessful { get; set; }
    public string? ErrorMessage { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Audit log filtre
/// </summary>
public class AuditLogFilter
{
    public string? UserId { get; set; }
    public string? Category { get; set; }
    public string? Action { get; set; }
    public string? RiskLevel { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool? IsSuccessful { get; set; }
    public string? IpAddress { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

/// <summary>
/// Güvenlik özeti
/// </summary>
public class SecuritySummaryDto
{
    public int TotalLoginAttempts { get; set; }
    public int FailedLoginAttempts { get; set; }
    public int BlockedIps { get; set; }
    public int RateLimitExceeded { get; set; }
    public int SuspiciousActivities { get; set; }
    public int UsersWithEnabled2FA { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
}

/// <summary>
/// Rate limit durumu
/// </summary>
public class RateLimitStatusDto
{
    public string IpAddress { get; set; } = string.Empty;
    public int RemainingRequests { get; set; }
    public int TotalLimit { get; set; }
    public DateTime ResetTime { get; set; }
    public bool IsLimited { get; set; }
}
