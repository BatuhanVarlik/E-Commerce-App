using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ETicaret.Infrastructure.Persistence;
using StackExchange.Redis;

namespace ETicaret.API.Controllers;

/// <summary>
/// Health check endpoints for monitoring and container orchestration
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<HealthController> _logger;

    public HealthController(
        ApplicationDbContext context,
        IConnectionMultiplexer redis,
        ILogger<HealthController> logger)
    {
        _context = context;
        _redis = redis;
        _logger = logger;
    }

    /// <summary>
    /// Basic health check - returns 200 if the service is running
    /// </summary>
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            service = "ETicaret.API",
            version = "1.0.0"
        });
    }

    /// <summary>
    /// Detailed health check - checks database and redis connectivity
    /// </summary>
    [HttpGet("detailed")]
    public async Task<IActionResult> GetDetailed()
    {
        var health = new HealthCheckResult
        {
            Status = "healthy",
            Timestamp = DateTime.UtcNow,
            Service = "ETicaret.API",
            Version = "1.0.0",
            Checks = new Dictionary<string, HealthCheckItem>()
        };

        // Check Database
        try
        {
            var canConnect = await _context.Database.CanConnectAsync();
            health.Checks["database"] = new HealthCheckItem
            {
                Status = canConnect ? "healthy" : "unhealthy",
                ResponseTime = null,
                Message = canConnect ? "Connected to PostgreSQL" : "Cannot connect to database"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            health.Checks["database"] = new HealthCheckItem
            {
                Status = "unhealthy",
                ResponseTime = null,
                Message = ex.Message
            };
            health.Status = "degraded";
        }

        // Check Redis
        try
        {
            var db = _redis.GetDatabase();
            var pingStart = DateTime.UtcNow;
            var pingResult = await db.PingAsync();
            var pingTime = (DateTime.UtcNow - pingStart).TotalMilliseconds;

            health.Checks["redis"] = new HealthCheckItem
            {
                Status = "healthy",
                ResponseTime = $"{pingTime:F2}ms",
                Message = "Connected to Redis"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis health check failed");
            health.Checks["redis"] = new HealthCheckItem
            {
                Status = "unhealthy",
                ResponseTime = null,
                Message = ex.Message
            };
            health.Status = "degraded";
        }

        // Check disk space (for uploads)
        try
        {
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (Directory.Exists(uploadsPath))
            {
                var drive = new DriveInfo(Path.GetPathRoot(uploadsPath) ?? "/");
                var freeSpaceGB = drive.AvailableFreeSpace / (1024.0 * 1024.0 * 1024.0);
                
                health.Checks["disk"] = new HealthCheckItem
                {
                    Status = freeSpaceGB > 1 ? "healthy" : "warning",
                    ResponseTime = null,
                    Message = $"Free space: {freeSpaceGB:F2} GB"
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Disk health check failed");
            health.Checks["disk"] = new HealthCheckItem
            {
                Status = "unknown",
                ResponseTime = null,
                Message = "Could not check disk space"
            };
        }

        // Set overall status
        if (health.Checks.Values.Any(c => c.Status == "unhealthy"))
        {
            health.Status = "unhealthy";
            return StatusCode(503, health);
        }
        else if (health.Checks.Values.Any(c => c.Status == "degraded" || c.Status == "warning"))
        {
            health.Status = "degraded";
        }

        return Ok(health);
    }

    /// <summary>
    /// Liveness probe - Kubernetes/Docker liveness check
    /// </summary>
    [HttpGet("live")]
    public IActionResult Live()
    {
        return Ok(new { status = "alive", timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Readiness probe - Kubernetes/Docker readiness check
    /// </summary>
    [HttpGet("ready")]
    public async Task<IActionResult> Ready()
    {
        try
        {
            // Check if we can connect to essential services
            var dbReady = await _context.Database.CanConnectAsync();
            var redisReady = _redis.IsConnected;

            if (dbReady && redisReady)
            {
                return Ok(new { status = "ready", timestamp = DateTime.UtcNow });
            }

            return StatusCode(503, new
            {
                status = "not ready",
                timestamp = DateTime.UtcNow,
                database = dbReady ? "ready" : "not ready",
                redis = redisReady ? "ready" : "not ready"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Readiness check failed");
            return StatusCode(503, new
            {
                status = "not ready",
                timestamp = DateTime.UtcNow,
                error = ex.Message
            });
        }
    }
}

public class HealthCheckResult
{
    public string Status { get; set; } = "healthy";
    public DateTime Timestamp { get; set; }
    public string Service { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public Dictionary<string, HealthCheckItem> Checks { get; set; } = new();
}

public class HealthCheckItem
{
    public string Status { get; set; } = "healthy";
    public string? ResponseTime { get; set; }
    public string Message { get; set; } = string.Empty;
}
