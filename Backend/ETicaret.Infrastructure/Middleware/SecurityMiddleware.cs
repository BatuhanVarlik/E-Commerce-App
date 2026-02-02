using System.Text.RegularExpressions;
using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ETicaret.Infrastructure.Middleware;

/// <summary>
/// Rate limiting middleware - IP ve endpoint bazlı istek sınırlaması
/// </summary>
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;

    // Endpoint bazlı limitler
    private static readonly Dictionary<string, (int MaxRequests, TimeSpan Window)> EndpointLimits = new()
    {
        // Auth endpoints - daha sıkı limit
        { "/api/auth/login", (5, TimeSpan.FromMinutes(5)) },
        { "/api/auth/register", (3, TimeSpan.FromMinutes(10)) },
        { "/api/auth/forgot-password", (3, TimeSpan.FromMinutes(15)) },
        { "/api/auth/reset-password", (5, TimeSpan.FromMinutes(15)) },
        
        // 2FA endpoints
        { "/api/security/2fa/verify", (5, TimeSpan.FromMinutes(5)) },
        { "/api/security/2fa/setup", (3, TimeSpan.FromMinutes(10)) },
        
        // Order endpoints
        { "/api/orders", (30, TimeSpan.FromMinutes(1)) },
        
        // Review endpoints
        { "/api/reviews", (10, TimeSpan.FromMinutes(1)) },
        
        // Default for other endpoints
        { "default", (100, TimeSpan.FromMinutes(1)) }
    };

    public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ISecurityService securityService)
    {
        var ipAddress = GetClientIpAddress(context);
        var endpoint = context.Request.Path.Value?.ToLower() ?? "unknown";
        
        // IP engelli mi kontrol et
        if (await securityService.IsIpBlockedAsync(ipAddress))
        {
            _logger.LogWarning("Blocked IP attempted access: {IpAddress}", ipAddress);
            
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new 
            { 
                message = "IP adresiniz engellenmiştir.",
                error = "IP_BLOCKED"
            });
            return;
        }

        // Rate limit kontrolü
        var (maxRequests, window) = GetLimitForEndpoint(endpoint);
        
        if (!await securityService.CheckRateLimitAsync(ipAddress, endpoint, maxRequests, window))
        {
            _logger.LogWarning("Rate limit exceeded for IP: {IpAddress}, Endpoint: {Endpoint}", 
                ipAddress, endpoint);
            
            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            context.Response.Headers["Retry-After"] = ((int)window.TotalSeconds).ToString();
            
            await context.Response.WriteAsJsonAsync(new 
            { 
                message = "Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.",
                error = "RATE_LIMIT_EXCEEDED",
                retryAfter = (int)window.TotalSeconds
            });
            return;
        }

        await _next(context);
    }

    private static string GetClientIpAddress(HttpContext context)
    {
        // X-Forwarded-For header'ı kontrol et (proxy/load balancer arkasında)
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            // İlk IP adresini al (orijinal client IP)
            return forwardedFor.Split(',')[0].Trim();
        }

        // X-Real-IP header'ı kontrol et
        var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
        {
            return realIp;
        }

        // Connection'dan IP al
        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private static (int MaxRequests, TimeSpan Window) GetLimitForEndpoint(string endpoint)
    {
        // Exact match
        if (EndpointLimits.TryGetValue(endpoint, out var limit))
            return limit;

        // Pattern match - endpoint'in başlangıcına göre
        foreach (var kvp in EndpointLimits)
        {
            if (kvp.Key != "default" && endpoint.StartsWith(kvp.Key))
                return kvp.Value;
        }

        return EndpointLimits["default"];
    }
}

/// <summary>
/// XSS ve SQL Injection koruması middleware
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityHeadersMiddleware> _logger;

    // XSS tespit pattern'leri
    private static readonly Regex[] XssPatterns = new[]
    {
        new Regex(@"<script[^>]*>", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"javascript:", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"on\w+\s*=", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"<iframe[^>]*>", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"<object[^>]*>", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"<embed[^>]*>", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"expression\s*\(", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"vbscript:", RegexOptions.IgnoreCase | RegexOptions.Compiled),
    };

    // SQL Injection tespit pattern'leri
    private static readonly Regex[] SqlInjectionPatterns = new[]
    {
        new Regex(@"(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\s", 
            RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@";\s*(SELECT|INSERT|UPDATE|DELETE|DROP)", 
            RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"--\s*$", RegexOptions.Compiled),
        new Regex(@"\/\*.*?\*\/", RegexOptions.Compiled),
        new Regex(@"'\s*OR\s+'?1'?\s*=\s*'?1", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"'\s*OR\s+''='", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new Regex(@"'\s*;\s*--", RegexOptions.IgnoreCase | RegexOptions.Compiled),
    };

    public SecurityHeadersMiddleware(RequestDelegate next, ILogger<SecurityHeadersMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ISecurityService securityService)
    {
        // Security headers ekle
        AddSecurityHeaders(context.Response);

        // POST, PUT, PATCH isteklerinde içerik kontrolü
        if (IsContentCheckRequired(context.Request.Method))
        {
            // Request body'yi oku ve kontrol et
            context.Request.EnableBuffering();
            
            using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;

            // Query string kontrolü
            var queryString = context.Request.QueryString.ToString();
            var allContent = body + queryString;

            // XSS kontrolü
            if (ContainsXss(allContent))
            {
                var ipAddress = GetClientIpAddress(context);
                
                _logger.LogWarning("XSS attempt detected from IP: {IpAddress}, Path: {Path}", 
                    ipAddress, context.Request.Path);

                await securityService.LogAsync(
                    AuditAction.SuspiciousActivity,
                    AuditCategory.Security,
                    ipAddress: ipAddress,
                    endpoint: context.Request.Path,
                    details: "XSS attempt detected",
                    riskLevel: RiskLevel.High
                );

                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new 
                { 
                    message = "Güvenlik ihlali tespit edildi.",
                    error = "SECURITY_VIOLATION"
                });
                return;
            }

            // SQL Injection kontrolü (ek güvenlik katmanı - EF Core zaten parameterized queries kullanır)
            if (ContainsSqlInjection(allContent))
            {
                var ipAddress = GetClientIpAddress(context);
                
                _logger.LogWarning("SQL Injection attempt detected from IP: {IpAddress}, Path: {Path}", 
                    ipAddress, context.Request.Path);

                await securityService.LogAsync(
                    AuditAction.SuspiciousActivity,
                    AuditCategory.Security,
                    ipAddress: ipAddress,
                    endpoint: context.Request.Path,
                    details: "SQL Injection attempt detected",
                    riskLevel: RiskLevel.Critical
                );

                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new 
                { 
                    message = "Güvenlik ihlali tespit edildi.",
                    error = "SECURITY_VIOLATION"
                });
                return;
            }
        }

        await _next(context);
    }

    private static void AddSecurityHeaders(HttpResponse response)
    {
        // XSS Protection
        response.Headers["X-XSS-Protection"] = "1; mode=block";
        
        // Content Type Options - MIME sniffing koruması
        response.Headers["X-Content-Type-Options"] = "nosniff";
        
        // Frame Options - Clickjacking koruması
        response.Headers["X-Frame-Options"] = "DENY";
        
        // Referrer Policy
        response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        
        // Permissions Policy
        response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
        
        // Content Security Policy (CSP)
        response.Headers["Content-Security-Policy"] = 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' data:; " +
            "frame-ancestors 'none';";
        
        // Strict Transport Security (HTTPS zorunlu)
        response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    }

    private static bool IsContentCheckRequired(string method)
    {
        return method.Equals("POST", StringComparison.OrdinalIgnoreCase) ||
               method.Equals("PUT", StringComparison.OrdinalIgnoreCase) ||
               method.Equals("PATCH", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsXss(string content)
    {
        if (string.IsNullOrEmpty(content)) return false;

        foreach (var pattern in XssPatterns)
        {
            if (pattern.IsMatch(content))
                return true;
        }
        return false;
    }

    private static bool ContainsSqlInjection(string content)
    {
        if (string.IsNullOrEmpty(content)) return false;

        foreach (var pattern in SqlInjectionPatterns)
        {
            if (pattern.IsMatch(content))
                return true;
        }
        return false;
    }

    private static string GetClientIpAddress(HttpContext context)
    {
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
            return forwardedFor.Split(',')[0].Trim();

        var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
            return realIp;

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}

/// <summary>
/// Audit logging middleware - tüm istekleri loglar
/// </summary>
public class AuditLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditLoggingMiddleware> _logger;

    // Loglanması gereken endpoint'ler
    private static readonly string[] AuditableEndpoints = new[]
    {
        "/api/auth",
        "/api/orders",
        "/api/admin",
        "/api/security",
        "/api/users"
    };

    public AuditLoggingMiddleware(RequestDelegate next, ILogger<AuditLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ISecurityService securityService)
    {
        var endpoint = context.Request.Path.Value?.ToLower() ?? "";
        
        // Sadece belirli endpoint'leri logla
        if (!ShouldAudit(endpoint))
        {
            await _next(context);
            return;
        }

        var ipAddress = GetClientIpAddress(context);
        var userAgent = context.Request.Headers["User-Agent"].FirstOrDefault();
        var userId = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var userEmail = context.User?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

        try
        {
            await _next(context);

            // Başarılı istekleri logla
            var action = DetermineAction(context.Request.Method, endpoint);
            var category = DetermineCategory(endpoint);
            
            await securityService.LogAsync(
                action,
                category,
                userId: userId,
                userEmail: userEmail,
                ipAddress: ipAddress,
                userAgent: userAgent,
                endpoint: endpoint,
                httpMethod: context.Request.Method,
                isSuccessful: context.Response.StatusCode < 400,
                riskLevel: DetermineRiskLevel(action, context.Response.StatusCode)
            );
        }
        catch (Exception ex)
        {
            // Hata durumunda logla
            await securityService.LogAsync(
                "Error",
                AuditCategory.System,
                userId: userId,
                userEmail: userEmail,
                ipAddress: ipAddress,
                userAgent: userAgent,
                endpoint: endpoint,
                httpMethod: context.Request.Method,
                isSuccessful: false,
                errorMessage: ex.Message,
                riskLevel: RiskLevel.High
            );

            throw;
        }
    }

    private static bool ShouldAudit(string endpoint)
    {
        return AuditableEndpoints.Any(e => endpoint.StartsWith(e));
    }

    private static string DetermineAction(string method, string endpoint)
    {
        if (endpoint.Contains("/login")) return AuditAction.Login;
        if (endpoint.Contains("/register")) return AuditAction.Register;
        if (endpoint.Contains("/logout")) return AuditAction.Logout;
        if (endpoint.Contains("/2fa")) return "2FA_Operation";
        
        return method.ToUpper() switch
        {
            "POST" => "Create",
            "PUT" => "Update",
            "PATCH" => "Update",
            "DELETE" => "Delete",
            _ => "Read"
        };
    }

    private static string DetermineCategory(string endpoint)
    {
        if (endpoint.Contains("/auth")) return AuditCategory.Auth;
        if (endpoint.Contains("/orders")) return AuditCategory.Order;
        if (endpoint.Contains("/admin")) return AuditCategory.Admin;
        if (endpoint.Contains("/security")) return AuditCategory.Security;
        if (endpoint.Contains("/users")) return AuditCategory.User;
        if (endpoint.Contains("/products")) return AuditCategory.Product;
        
        return AuditCategory.System;
    }

    private static string DetermineRiskLevel(string action, int statusCode)
    {
        if (statusCode >= 500) return RiskLevel.High;
        if (statusCode == 401 || statusCode == 403) return RiskLevel.Medium;
        if (action == AuditAction.LoginFailed) return RiskLevel.Medium;
        if (action.Contains("Delete") || action.Contains("Admin")) return RiskLevel.Medium;
        
        return RiskLevel.Low;
    }

    private static string GetClientIpAddress(HttpContext context)
    {
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
            return forwardedFor.Split(',')[0].Trim();

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}

/// <summary>
/// Middleware extension methods
/// </summary>
public static class SecurityMiddlewareExtensions
{
    public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder app)
    {
        return app.UseMiddleware<RateLimitingMiddleware>();
    }

    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
    {
        return app.UseMiddleware<SecurityHeadersMiddleware>();
    }

    public static IApplicationBuilder UseAuditLogging(this IApplicationBuilder app)
    {
        return app.UseMiddleware<AuditLoggingMiddleware>();
    }
}
