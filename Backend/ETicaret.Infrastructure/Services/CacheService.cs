using System.Text.Json;
using ETicaret.Application.Interfaces;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace ETicaret.Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _db;
    private readonly ILogger<CacheService> _logger;
    
    private static readonly TimeSpan DefaultExpiration = TimeSpan.FromMinutes(30);
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public CacheService(IConnectionMultiplexer redis, ILogger<CacheService> logger)
    {
        _redis = redis;
        _db = redis.GetDatabase();
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            var value = await _db.StringGetAsync(key);
            if (value.IsNullOrEmpty)
            {
                return default;
            }
            
            return JsonSerializer.Deserialize<T>(value!, JsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis GET error for key: {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        try
        {
            var serialized = JsonSerializer.Serialize(value, JsonOptions);
            await _db.StringSetAsync(key, serialized, expiration ?? DefaultExpiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis SET error for key: {Key}", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        try
        {
            await _db.KeyDeleteAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis DELETE error for key: {Key}", key);
        }
    }

    public async Task RemoveByPatternAsync(string pattern)
    {
        try
        {
            var server = _redis.GetServer(_redis.GetEndPoints().First());
            var keys = server.Keys(pattern: pattern).ToArray();
            
            if (keys.Length > 0)
            {
                await _db.KeyDeleteAsync(keys);
                _logger.LogInformation("Removed {Count} keys matching pattern: {Pattern}", keys.Length, pattern);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis DELETE BY PATTERN error for pattern: {Pattern}", pattern);
        }
    }

    public async Task<bool> ExistsAsync(string key)
    {
        try
        {
            return await _db.KeyExistsAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis EXISTS error for key: {Key}", key);
            return false;
        }
    }

    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null)
    {
        try
        {
            var cached = await GetAsync<T>(key);
            if (cached != null)
            {
                return cached;
            }

            var value = await factory();
            await SetAsync(key, value, expiration);
            return value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis GetOrSet error for key: {Key}", key);
            // Fallback: execute factory without caching
            return await factory();
        }
    }
}

// Cache key sabitleri
public static class CacheKeys
{
    public const string ProductsPrefix = "products:";
    public const string CategoriesPrefix = "categories:";
    public const string BrandsPrefix = "brands:";
    public const string UserPrefix = "user:";
    public const string CartPrefix = "cart:";
    
    // Ürünler
    public static string Product(Guid id) => $"{ProductsPrefix}{id}";
    public static string ProductsList(int page, int size, string? category = null) 
        => $"{ProductsPrefix}list:{page}:{size}:{category ?? "all"}";
    public static string ProductsSearch(string query) => $"{ProductsPrefix}search:{query.ToLower()}";
    
    // Kategoriler
    public static string AllCategories => $"{CategoriesPrefix}all";
    public static string Category(Guid id) => $"{CategoriesPrefix}{id}";
    
    // Markalar
    public static string AllBrands => $"{BrandsPrefix}all";
    public static string Brand(Guid id) => $"{BrandsPrefix}{id}";
    
    // Dashboard
    public static string DashboardStats => "dashboard:stats";
    public static string DashboardSummary => "dashboard:summary";
    
    // Öneriler
    public static string Recommendations(string userId) => $"recommendations:{userId}";
    public static string SimilarProducts(Guid productId) => $"similar:{productId}";
}
