using ETicaret.Domain.Entities;
using ETicaret.Application.DTOs.Security;

namespace ETicaret.Application.Interfaces;

/// <summary>
/// Audit logging service interface
/// </summary>
public interface IAuditService
{
    /// <summary>
    /// Log an audit event
    /// </summary>
    Task LogAsync(AuditLogEntry entry);
    
    /// <summary>
    /// Log a simple action
    /// </summary>
    Task LogAsync(string action, string category, string? details = null);
    
    /// <summary>
    /// Log an entity change
    /// </summary>
    Task LogEntityChangeAsync(string action, string entityType, string entityId, object? oldValue = null, object? newValue = null);
    
    /// <summary>
    /// Log a security event
    /// </summary>
    Task LogSecurityEventAsync(string action, string? details = null, bool isSuccess = true);
    
    /// <summary>
    /// Log authentication event
    /// </summary>
    Task LogAuthEventAsync(string action, string? userId = null, string? email = null, bool isSuccess = true, string? details = null);
    
    /// <summary>
    /// Log admin action
    /// </summary>
    Task LogAdminActionAsync(string action, string? entityType = null, string? entityId = null, object? details = null);
    
    /// <summary>
    /// Get audit logs with filtering
    /// </summary>
    Task<PagedResult<AuditLog>> GetLogsAsync(AuditLogFilter filter);
}

/// <summary>
/// Audit log entry for creating new logs
/// </summary>
public class AuditLogEntry
{
    public string Action { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public object? OldValue { get; set; }
    public object? NewValue { get; set; }
    public object? Details { get; set; }
    public bool IsSuccess { get; set; } = true;
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Paged result wrapper
/// </summary>
public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;
}

/// <summary>
/// Audit categories
/// </summary>
public static class AuditCategories
{
    public const string Auth = "Auth";
    public const string Order = "Order";
    public const string Product = "Product";
    public const string User = "User";
    public const string Admin = "Admin";
    public const string Payment = "Payment";
    public const string Security = "Security";
    public const string System = "System";
}

/// <summary>
/// Audit actions
/// </summary>
public static class AuditActions
{
    // Auth
    public const string Login = "Login";
    public const string LoginFailed = "LoginFailed";
    public const string Logout = "Logout";
    public const string Register = "Register";
    public const string PasswordChanged = "PasswordChanged";
    public const string PasswordResetRequested = "PasswordResetRequested";
    public const string TwoFactorEnabled = "TwoFactorEnabled";
    public const string TwoFactorDisabled = "TwoFactorDisabled";
    
    // Order
    public const string OrderCreated = "OrderCreated";
    public const string OrderStatusChanged = "OrderStatusChanged";
    public const string OrderCancelled = "OrderCancelled";
    public const string RefundRequested = "RefundRequested";
    public const string RefundProcessed = "RefundProcessed";
    
    // Product
    public const string ProductCreated = "ProductCreated";
    public const string ProductUpdated = "ProductUpdated";
    public const string ProductDeleted = "ProductDeleted";
    public const string ProductStockChanged = "ProductStockChanged";
    
    // User
    public const string UserCreated = "UserCreated";
    public const string UserUpdated = "UserUpdated";
    public const string UserDeleted = "UserDeleted";
    public const string UserRoleChanged = "UserRoleChanged";
    
    // Admin
    public const string AdminSettingsChanged = "AdminSettingsChanged";
    public const string AdminDataExport = "AdminDataExport";
    
    // Payment
    public const string PaymentInitiated = "PaymentInitiated";
    public const string PaymentCompleted = "PaymentCompleted";
    public const string PaymentFailed = "PaymentFailed";
    
    // Security
    public const string SuspiciousActivity = "SuspiciousActivity";
    public const string RateLimitExceeded = "RateLimitExceeded";
    public const string InvalidTokenUsed = "InvalidTokenUsed";
    public const string UnauthorizedAccess = "UnauthorizedAccess";
}
