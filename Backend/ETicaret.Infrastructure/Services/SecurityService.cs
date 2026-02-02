using System.Text.Json;
using ETicaret.Application.DTOs.Security;
using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace ETicaret.Infrastructure.Services;

/// <summary>
/// Güvenlik işlemleri servisi - Audit logging, IP yönetimi, Rate limiting
/// </summary>
public class SecurityService : ISecurityService
{
    private readonly ApplicationDbContext _context;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<SecurityService> _logger;
    private readonly IDatabase _redisDb;

    public SecurityService(
        ApplicationDbContext context,
        IConnectionMultiplexer redis,
        ILogger<SecurityService> logger)
    {
        _context = context;
        _redis = redis;
        _logger = logger;
        _redisDb = redis.GetDatabase();
    }

    #region Audit Logging

    public async Task LogAsync(
        string action, 
        string category, 
        string? userId = null, 
        string? userEmail = null,
        string? details = null, 
        string? entityType = null, 
        string? entityId = null,
        string? oldValue = null, 
        string? newValue = null, 
        string? ipAddress = null,
        string? userAgent = null, 
        string? endpoint = null, 
        string? httpMethod = null,
        bool isSuccessful = true, 
        string? errorMessage = null, 
        string riskLevel = "Low")
    {
        try
        {
            var auditLog = new AuditLog
            {
                UserId = userId,
                UserEmail = userEmail,
                Action = action,
                Category = category,
                Details = details,
                EntityType = entityType,
                EntityId = entityId,
                OldValue = oldValue,
                NewValue = newValue,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                Endpoint = endpoint,
                HttpMethod = httpMethod,
                IsSuccessful = isSuccessful,
                ErrorMessage = errorMessage,
                RiskLevel = riskLevel,
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            // Yüksek risk seviyeli işlemlerde log
            if (riskLevel is RiskLevel.High or RiskLevel.Critical)
            {
                _logger.LogWarning(
                    "High risk action logged: {Action} by user {UserId} from IP {IpAddress}",
                    action, userId, ipAddress);
            }
        }
        catch (Exception ex)
        {
            // Audit log kaydı başarısız olursa işlemi durdurmayalım
            _logger.LogError(ex, "Failed to save audit log for action: {Action}", action);
        }
    }

    public async Task<List<AuditLogDto>> GetAuditLogsAsync(AuditLogFilter filter)
    {
        var query = _context.AuditLogs.AsQueryable();

        if (!string.IsNullOrEmpty(filter.UserId))
            query = query.Where(a => a.UserId == filter.UserId);

        if (!string.IsNullOrEmpty(filter.Category))
            query = query.Where(a => a.Category == filter.Category);

        if (!string.IsNullOrEmpty(filter.Action))
            query = query.Where(a => a.Action == filter.Action);

        if (!string.IsNullOrEmpty(filter.RiskLevel))
            query = query.Where(a => a.RiskLevel == filter.RiskLevel);

        if (filter.StartDate.HasValue)
            query = query.Where(a => a.CreatedAt >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            query = query.Where(a => a.CreatedAt <= filter.EndDate.Value);

        if (filter.IsSuccessful.HasValue)
            query = query.Where(a => a.IsSuccessful == filter.IsSuccessful.Value);

        if (!string.IsNullOrEmpty(filter.IpAddress))
            query = query.Where(a => a.IpAddress == filter.IpAddress);

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                UserId = a.UserId,
                UserEmail = a.UserEmail,
                Action = a.Action,
                Category = a.Category,
                Details = a.Details,
                EntityType = a.EntityType,
                EntityId = a.EntityId,
                IpAddress = a.IpAddress,
                Endpoint = a.Endpoint,
                HttpMethod = a.HttpMethod,
                IsSuccessful = a.IsSuccessful,
                ErrorMessage = a.ErrorMessage,
                RiskLevel = a.RiskLevel,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<SecuritySummaryDto> GetSecuritySummaryAsync(DateTime startDate, DateTime endDate)
    {
        var logs = await _context.AuditLogs
            .Where(a => a.CreatedAt >= startDate && a.CreatedAt <= endDate)
            .ToListAsync();

        var usersWithEnabled2FA = await _context.TwoFactorAuths
            .CountAsync(t => t.IsEnabled);

        return new SecuritySummaryDto
        {
            TotalLoginAttempts = logs.Count(a => a.Action == AuditAction.Login || a.Action == AuditAction.LoginFailed),
            FailedLoginAttempts = logs.Count(a => a.Action == AuditAction.LoginFailed),
            BlockedIps = await _context.IpBlacklists.CountAsync(i => i.IsActive),
            RateLimitExceeded = logs.Count(a => a.Action == AuditAction.RateLimitExceeded),
            SuspiciousActivities = logs.Count(a => a.RiskLevel == RiskLevel.High || a.RiskLevel == RiskLevel.Critical),
            UsersWithEnabled2FA = usersWithEnabled2FA,
            PeriodStart = startDate,
            PeriodEnd = endDate
        };
    }

    #endregion

    #region IP Management

    public async Task<bool> IsIpBlockedAsync(string ipAddress)
    {
        // Önce Redis cache kontrol et
        var cacheKey = $"ip:blocked:{ipAddress}";
        var cached = await _redisDb.StringGetAsync(cacheKey);
        
        if (!cached.IsNullOrEmpty)
            return cached == "1";

        // Veritabanından kontrol et
        var blocked = await _context.IpBlacklists
            .AnyAsync(i => i.IpAddress == ipAddress && 
                          i.IsActive && 
                          (i.ExpiresAt == null || i.ExpiresAt > DateTime.UtcNow));

        // Cache'e ekle (5 dakika)
        await _redisDb.StringSetAsync(cacheKey, blocked ? "1" : "0", TimeSpan.FromMinutes(5));

        return blocked;
    }

    public async Task<bool> IsIpWhitelistedAsync(string ipAddress)
    {
        var cacheKey = $"ip:whitelisted:{ipAddress}";
        var cached = await _redisDb.StringGetAsync(cacheKey);
        
        if (!cached.IsNullOrEmpty)
            return cached == "1";

        var whitelisted = await _context.IpWhitelists
            .AnyAsync(i => i.IpAddress == ipAddress && i.IsActive);

        await _redisDb.StringSetAsync(cacheKey, whitelisted ? "1" : "0", TimeSpan.FromMinutes(5));

        return whitelisted;
    }

    public async Task BlockIpAsync(string ipAddress, string reason, string? blockedByUserId = null, 
        int? durationHours = null, bool isAutomatic = false)
    {
        var existing = await _context.IpBlacklists
            .FirstOrDefaultAsync(i => i.IpAddress == ipAddress);

        if (existing != null)
        {
            existing.IsActive = true;
            existing.Reason = reason;
            existing.BlockedByUserId = blockedByUserId;
            existing.IsAutomatic = isAutomatic;
            existing.ExpiresAt = durationHours.HasValue 
                ? DateTime.UtcNow.AddHours(durationHours.Value) 
                : null;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.IpBlacklists.Add(new IpBlacklist
            {
                IpAddress = ipAddress,
                Reason = reason,
                BlockedByUserId = blockedByUserId,
                IsAutomatic = isAutomatic,
                ExpiresAt = durationHours.HasValue 
                    ? DateTime.UtcNow.AddHours(durationHours.Value) 
                    : null,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        // Cache'i temizle
        await _redisDb.KeyDeleteAsync($"ip:blocked:{ipAddress}");

        _logger.LogWarning("IP blocked: {IpAddress}, Reason: {Reason}, Automatic: {IsAutomatic}", 
            ipAddress, reason, isAutomatic);
    }

    public async Task UnblockIpAsync(string ipAddress)
    {
        var blocked = await _context.IpBlacklists
            .FirstOrDefaultAsync(i => i.IpAddress == ipAddress && i.IsActive);

        if (blocked != null)
        {
            blocked.IsActive = false;
            blocked.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _redisDb.KeyDeleteAsync($"ip:blocked:{ipAddress}");

            _logger.LogInformation("IP unblocked: {IpAddress}", ipAddress);
        }
    }

    public async Task WhitelistIpAsync(string ipAddress, string? description, string? addedByUserId = null)
    {
        var existing = await _context.IpWhitelists
            .FirstOrDefaultAsync(i => i.IpAddress == ipAddress);

        if (existing != null)
        {
            existing.IsActive = true;
            existing.Description = description;
            existing.AddedByUserId = addedByUserId;
        }
        else
        {
            _context.IpWhitelists.Add(new IpWhitelist
            {
                IpAddress = ipAddress,
                Description = description,
                AddedByUserId = addedByUserId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        await _redisDb.KeyDeleteAsync($"ip:whitelisted:{ipAddress}");
    }

    public async Task RemoveFromWhitelistAsync(string ipAddress)
    {
        var whitelisted = await _context.IpWhitelists
            .FirstOrDefaultAsync(i => i.IpAddress == ipAddress && i.IsActive);

        if (whitelisted != null)
        {
            whitelisted.IsActive = false;
            await _context.SaveChangesAsync();
            await _redisDb.KeyDeleteAsync($"ip:whitelisted:{ipAddress}");
        }
    }

    public async Task<List<IpListDto>> GetBlockedIpsAsync()
    {
        return await _context.IpBlacklists
            .Where(i => i.IsActive)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new IpListDto
            {
                Id = i.Id,
                IpAddress = i.IpAddress,
                Reason = i.Reason,
                IsAutomatic = i.IsAutomatic,
                ExpiresAt = i.ExpiresAt,
                IsActive = i.IsActive,
                CreatedAt = i.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<IpListDto>> GetWhitelistedIpsAsync()
    {
        return await _context.IpWhitelists
            .Where(i => i.IsActive)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new IpListDto
            {
                Id = i.Id,
                IpAddress = i.IpAddress,
                Description = i.Description,
                IsActive = i.IsActive,
                CreatedAt = i.CreatedAt
            })
            .ToListAsync();
    }

    #endregion

    #region Rate Limiting

    public async Task<bool> CheckRateLimitAsync(string ipAddress, string endpoint, int maxRequests, TimeSpan window)
    {
        // Whitelist'te mi kontrol et
        if (await IsIpWhitelistedAsync(ipAddress))
            return true; // Whitelist'teyse limit uygulanmaz

        var key = $"ratelimit:{ipAddress}:{endpoint}";
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var windowStart = now - (long)window.TotalSeconds;

        // Sliding window rate limiting with Redis sorted sets
        var transaction = _redisDb.CreateTransaction();
        
        // Eski kayıtları sil
        _ = transaction.SortedSetRemoveRangeByScoreAsync(key, 0, windowStart);
        
        // Mevcut sayıyı al
        var countTask = transaction.SortedSetLengthAsync(key);
        
        await transaction.ExecuteAsync();

        var currentCount = await countTask;

        if (currentCount >= maxRequests)
        {
            // Rate limit aşıldı - log kaydet
            await LogAsync(
                AuditAction.RateLimitExceeded,
                AuditCategory.Security,
                ipAddress: ipAddress,
                endpoint: endpoint,
                details: JsonSerializer.Serialize(new { currentCount, maxRequests, window = window.TotalSeconds }),
                riskLevel: RiskLevel.Medium
            );

            // Çok fazla deneme varsa IP'yi otomatik engelle
            if (currentCount >= maxRequests * 3)
            {
                await BlockIpAsync(ipAddress, "Rate limit exceeded multiple times", 
                    durationHours: 1, isAutomatic: true);
            }

            return false;
        }

        // Yeni istek kaydet
        await _redisDb.SortedSetAddAsync(key, now.ToString(), now);
        await _redisDb.KeyExpireAsync(key, window.Add(TimeSpan.FromMinutes(1)));

        return true;
    }

    public async Task<RateLimitStatusDto> GetRateLimitStatusAsync(string ipAddress, string endpoint)
    {
        var key = $"ratelimit:{ipAddress}:{endpoint}";
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        
        // Default window 1 dakika
        var window = TimeSpan.FromMinutes(1);
        var windowStart = now - (long)window.TotalSeconds;

        // Eski kayıtları temizle ve say
        await _redisDb.SortedSetRemoveRangeByScoreAsync(key, 0, windowStart);
        var currentCount = await _redisDb.SortedSetLengthAsync(key);

        // Default limitler (endpoint'e göre farklı olabilir)
        int maxRequests = endpoint.Contains("login") ? 5 : 100;

        return new RateLimitStatusDto
        {
            IpAddress = ipAddress,
            RemainingRequests = Math.Max(0, maxRequests - (int)currentCount),
            TotalLimit = maxRequests,
            ResetTime = DateTime.UtcNow.Add(window),
            IsLimited = currentCount >= maxRequests
        };
    }

    public async Task ResetRateLimitAsync(string ipAddress, string? endpoint = null)
    {
        if (string.IsNullOrEmpty(endpoint))
        {
            // Tüm endpoint'ler için rate limit'i sıfırla
            var server = _redis.GetServer(_redis.GetEndPoints()[0]);
            var keys = server.Keys(pattern: $"ratelimit:{ipAddress}:*");
            
            foreach (var key in keys)
            {
                await _redisDb.KeyDeleteAsync(key);
            }
        }
        else
        {
            var key = $"ratelimit:{ipAddress}:{endpoint}";
            await _redisDb.KeyDeleteAsync(key);
        }

        _logger.LogInformation("Rate limit reset for IP: {IpAddress}, Endpoint: {Endpoint}", 
            ipAddress, endpoint ?? "all");
    }

    #endregion
}
