using ETicaret.Application.DTOs.Security;

namespace ETicaret.Application.Interfaces;

/// <summary>
/// Güvenlik işlemleri servisi
/// </summary>
public interface ISecurityService
{
    // Audit Logging
    Task LogAsync(string action, string category, string? userId = null, string? userEmail = null,
        string? details = null, string? entityType = null, string? entityId = null,
        string? oldValue = null, string? newValue = null, string? ipAddress = null,
        string? userAgent = null, string? endpoint = null, string? httpMethod = null,
        bool isSuccessful = true, string? errorMessage = null, string riskLevel = "Low");
    
    Task<List<AuditLogDto>> GetAuditLogsAsync(AuditLogFilter filter);
    Task<SecuritySummaryDto> GetSecuritySummaryAsync(DateTime startDate, DateTime endDate);
    
    // IP Management
    Task<bool> IsIpBlockedAsync(string ipAddress);
    Task<bool> IsIpWhitelistedAsync(string ipAddress);
    Task BlockIpAsync(string ipAddress, string reason, string? blockedByUserId = null, int? durationHours = null, bool isAutomatic = false);
    Task UnblockIpAsync(string ipAddress);
    Task WhitelistIpAsync(string ipAddress, string? description, string? addedByUserId = null);
    Task RemoveFromWhitelistAsync(string ipAddress);
    Task<List<IpListDto>> GetBlockedIpsAsync();
    Task<List<IpListDto>> GetWhitelistedIpsAsync();
    
    // Rate Limiting
    Task<bool> CheckRateLimitAsync(string ipAddress, string endpoint, int maxRequests, TimeSpan window);
    Task<RateLimitStatusDto> GetRateLimitStatusAsync(string ipAddress, string endpoint);
    Task ResetRateLimitAsync(string ipAddress, string? endpoint = null);
}
