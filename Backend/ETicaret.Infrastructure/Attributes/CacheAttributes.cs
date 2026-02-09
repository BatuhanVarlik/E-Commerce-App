using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using ETicaret.Application.Interfaces;
using System.Text;
using System.Security.Cryptography;

namespace ETicaret.Infrastructure.Attributes;

/// <summary>
/// Redis cache attribute for API responses
/// Usage: [CacheResponse(DurationSeconds = 300)]
/// </summary>
[AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
public class CacheResponseAttribute : Attribute, IAsyncActionFilter
{
    /// <summary>
    /// Cache duration in seconds (default: 5 minutes)
    /// </summary>
    public int DurationSeconds { get; set; } = 300;

    /// <summary>
    /// Cache key prefix
    /// </summary>
    public string? KeyPrefix { get; set; }

    /// <summary>
    /// Whether to vary cache by user (useful for personalized data)
    /// </summary>
    public bool VaryByUser { get; set; } = false;

    /// <summary>
    /// Query parameters to include in cache key
    /// </summary>
    public string[]? VaryByQueryParams { get; set; }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var cacheService = context.HttpContext.RequestServices.GetService<ICacheService>();
        
        if (cacheService == null)
        {
            // If no cache service, just continue
            await next();
            return;
        }

        var cacheKey = GenerateCacheKey(context);

        // Try to get from cache
        var cachedResponse = await cacheService.GetAsync<CachedResponse>(cacheKey);
        
        if (cachedResponse != null)
        {
            // Return cached response
            context.Result = new ContentResult
            {
                Content = cachedResponse.Content,
                ContentType = cachedResponse.ContentType,
                StatusCode = cachedResponse.StatusCode
            };
            
            // Add cache hit header
            context.HttpContext.Response.Headers["X-Cache"] = "HIT";
            return;
        }

        // Execute action
        var executedContext = await next();

        // Cache the response if it's successful
        if (executedContext.Result is ObjectResult objectResult && 
            objectResult.StatusCode is null or >= 200 and < 300)
        {
            var content = System.Text.Json.JsonSerializer.Serialize(objectResult.Value);
            var cachedResponseToStore = new CachedResponse
            {
                Content = content,
                ContentType = "application/json",
                StatusCode = objectResult.StatusCode ?? 200,
                CachedAt = DateTime.UtcNow
            };

            await cacheService.SetAsync(
                cacheKey, 
                cachedResponseToStore, 
                TimeSpan.FromSeconds(DurationSeconds)
            );

            // Add cache miss header
            context.HttpContext.Response.Headers["X-Cache"] = "MISS";
        }
    }

    private string GenerateCacheKey(ActionExecutingContext context)
    {
        var keyBuilder = new StringBuilder();
        
        // Prefix
        keyBuilder.Append(KeyPrefix ?? "api_cache");
        keyBuilder.Append(':');

        // Controller and action
        keyBuilder.Append(context.RouteData.Values["controller"]?.ToString()?.ToLower() ?? "unknown");
        keyBuilder.Append(':');
        keyBuilder.Append(context.RouteData.Values["action"]?.ToString()?.ToLower() ?? "unknown");

        // Route values (like {id})
        foreach (var routeValue in context.RouteData.Values)
        {
            if (routeValue.Key != "controller" && routeValue.Key != "action")
            {
                keyBuilder.Append(':');
                keyBuilder.Append(routeValue.Key);
                keyBuilder.Append('=');
                keyBuilder.Append(routeValue.Value);
            }
        }

        // Action arguments
        foreach (var arg in context.ActionArguments.OrderBy(a => a.Key))
        {
            keyBuilder.Append(':');
            keyBuilder.Append(arg.Key);
            keyBuilder.Append('=');
            keyBuilder.Append(System.Text.Json.JsonSerializer.Serialize(arg.Value));
        }

        // Query params
        if (VaryByQueryParams != null && VaryByQueryParams.Length > 0)
        {
            var query = context.HttpContext.Request.Query;
            foreach (var param in VaryByQueryParams.OrderBy(p => p))
            {
                if (query.ContainsKey(param))
                {
                    keyBuilder.Append(':');
                    keyBuilder.Append(param);
                    keyBuilder.Append('=');
                    keyBuilder.Append(query[param]);
                }
            }
        }

        // User variation
        if (VaryByUser)
        {
            var userId = context.HttpContext.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                keyBuilder.Append(":user=");
                keyBuilder.Append(userId);
            }
        }

        // Hash the key to ensure consistent length
        var fullKey = keyBuilder.ToString();
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(fullKey));
        var hashString = Convert.ToBase64String(hashBytes).Replace("/", "_").Replace("+", "-")[..16];

        return $"{KeyPrefix ?? "api"}:{hashString}";
    }
}

/// <summary>
/// Cached response model
/// </summary>
public class CachedResponse
{
    public string Content { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/json";
    public int StatusCode { get; set; } = 200;
    public DateTime CachedAt { get; set; }
}

/// <summary>
/// Cache invalidation attribute
/// Invalidates cache when data changes (POST, PUT, DELETE)
/// </summary>
[AttributeUsage(AttributeTargets.Method, AllowMultiple = true)]
public class InvalidateCacheAttribute : Attribute, IAsyncActionFilter
{
    /// <summary>
    /// Cache key patterns to invalidate
    /// </summary>
    public string[] Patterns { get; set; } = Array.Empty<string>();

    public InvalidateCacheAttribute(params string[] patterns)
    {
        Patterns = patterns;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // Execute the action first
        var executedContext = await next();

        // If successful, invalidate cache
        if (executedContext.Exception == null && 
            executedContext.Result is ObjectResult result &&
            result.StatusCode is null or >= 200 and < 300)
        {
            var cacheService = context.HttpContext.RequestServices.GetService<ICacheService>();
            
            if (cacheService != null)
            {
                foreach (var pattern in Patterns)
                {
                    await cacheService.RemoveByPatternAsync(pattern);
                }
            }
        }
    }
}
