using System.Text.Json;
using ETicaret.Application.Interfaces;
using ETicaret.Application.DTOs.Security;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ETicaret.Infrastructure.Services;

/// <summary>
/// Audit logging service implementation
/// </summary>
public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AuditService> _logger;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = false,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public AuditService(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor,
        ILogger<AuditService> logger)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task LogAsync(AuditLogEntry entry)
    {
        try
        {
            var httpContext = _httpContextAccessor.HttpContext;
            var userId = httpContext?.User?.FindFirst("uid")?.Value;
            var userEmail = httpContext?.User?.FindFirst("email")?.Value;
            var ipAddress = GetClientIpAddress(httpContext);
            var userAgent = httpContext?.Request?.Headers["User-Agent"].ToString();

            var auditLog = new AuditLog
            {
                UserId = userId,
                UserEmail = userEmail,
                Action = entry.Action,
                Category = entry.Category,
                EntityType = entry.EntityType,
                EntityId = entry.EntityId,
                OldValue = entry.OldValue != null ? JsonSerializer.Serialize(entry.OldValue, _jsonOptions) : null,
                NewValue = entry.NewValue != null ? JsonSerializer.Serialize(entry.NewValue, _jsonOptions) : null,
                Details = entry.Details != null ? JsonSerializer.Serialize(entry.Details, _jsonOptions) : null,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                IsSuccessful = entry.IsSuccess,
                ErrorMessage = entry.ErrorMessage,
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Audit logging should never crash the application
            _logger.LogError(ex, "Failed to create audit log for action: {Action}", entry.Action);
        }
    }

    public async Task LogAsync(string action, string category, string? details = null)
    {
        await LogAsync(new AuditLogEntry
        {
            Action = action,
            Category = category,
            Details = details
        });
    }

    public async Task LogEntityChangeAsync(string action, string entityType, string entityId, object? oldValue = null, object? newValue = null)
    {
        await LogAsync(new AuditLogEntry
        {
            Action = action,
            Category = GetCategoryFromEntityType(entityType),
            EntityType = entityType,
            EntityId = entityId,
            OldValue = oldValue,
            NewValue = newValue
        });
    }

    public async Task LogSecurityEventAsync(string action, string? details = null, bool isSuccess = true)
    {
        await LogAsync(new AuditLogEntry
        {
            Action = action,
            Category = AuditCategories.Security,
            Details = details,
            IsSuccess = isSuccess
        });
    }

    public async Task LogAuthEventAsync(string action, string? userId = null, string? email = null, bool isSuccess = true, string? details = null)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var ipAddress = GetClientIpAddress(httpContext);
        var userAgent = httpContext?.Request?.Headers["User-Agent"].ToString();

        var auditLog = new AuditLog
        {
            UserId = userId,
            UserEmail = email,
            Action = action,
            Category = AuditCategories.Auth,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Details = details,
            IsSuccessful = isSuccess,
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log auth event: {Action}", action);
        }
    }

    public async Task LogAdminActionAsync(string action, string? entityType = null, string? entityId = null, object? details = null)
    {
        await LogAsync(new AuditLogEntry
        {
            Action = action,
            Category = AuditCategories.Admin,
            EntityType = entityType,
            EntityId = entityId,
            Details = details
        });
    }

    public async Task<PagedResult<AuditLog>> GetLogsAsync(AuditLogFilter filter)
    {
        var query = _context.AuditLogs.AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(filter.UserId))
            query = query.Where(x => x.UserId == filter.UserId);
        
        if (!string.IsNullOrEmpty(filter.Action))
            query = query.Where(x => x.Action == filter.Action);
        
        if (!string.IsNullOrEmpty(filter.Category))
            query = query.Where(x => x.Category == filter.Category);
        
        if (!string.IsNullOrEmpty(filter.RiskLevel))
            query = query.Where(x => x.RiskLevel == filter.RiskLevel);
        
        if (!string.IsNullOrEmpty(filter.IpAddress))
            query = query.Where(x => x.IpAddress == filter.IpAddress);
        
        if (filter.StartDate.HasValue)
            query = query.Where(x => x.CreatedAt >= filter.StartDate.Value);
        
        if (filter.EndDate.HasValue)
            query = query.Where(x => x.CreatedAt <= filter.EndDate.Value);
        
        if (filter.IsSuccessful.HasValue)
            query = query.Where(x => x.IsSuccessful == filter.IsSuccessful.Value);

        // Count and paginate
        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResult<AuditLog>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    private string? GetClientIpAddress(HttpContext? context)
    {
        if (context == null) return null;

        // Check for forwarded IP (if behind proxy/load balancer)
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',').First().Trim();
        }

        // Check for real IP header
        var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
        {
            return realIp;
        }

        // Fall back to remote IP
        return context.Connection.RemoteIpAddress?.ToString();
    }

    private static string GetCategoryFromEntityType(string entityType)
    {
        return entityType.ToLower() switch
        {
            "product" => AuditCategories.Product,
            "order" => AuditCategories.Order,
            "user" => AuditCategories.User,
            "payment" => AuditCategories.Payment,
            _ => AuditCategories.System
        };
    }
}
