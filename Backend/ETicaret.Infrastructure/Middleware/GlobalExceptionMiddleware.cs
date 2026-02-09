using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ETicaret.Infrastructure.Middleware;

/// <summary>
/// Global exception handler middleware
/// Tüm hataları yakalar ve standart formatta döner
/// </summary>
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        var errorResponse = new ApiErrorResponse
        {
            TraceId = context.TraceIdentifier,
            Timestamp = DateTime.UtcNow
        };

        switch (exception)
        {
            case ValidationException validationEx:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.Status = (int)HttpStatusCode.BadRequest;
                errorResponse.Error = "VALIDATION_ERROR";
                errorResponse.Message = "Geçersiz veri gönderildi.";
                errorResponse.Details = validationEx.Errors;
                _logger.LogWarning(exception, "Validation error: {Message}", validationEx.Message);
                break;

            case NotFoundException notFoundEx:
                response.StatusCode = (int)HttpStatusCode.NotFound;
                errorResponse.Status = (int)HttpStatusCode.NotFound;
                errorResponse.Error = "NOT_FOUND";
                errorResponse.Message = notFoundEx.Message ?? "Kayıt bulunamadı.";
                _logger.LogWarning(exception, "Not found: {Message}", notFoundEx.Message);
                break;

            case UnauthorizedException unauthorizedEx:
                response.StatusCode = (int)HttpStatusCode.Unauthorized;
                errorResponse.Status = (int)HttpStatusCode.Unauthorized;
                errorResponse.Error = "UNAUTHORIZED";
                errorResponse.Message = unauthorizedEx.Message ?? "Yetkilendirme gerekli.";
                _logger.LogWarning(exception, "Unauthorized: {Message}", unauthorizedEx.Message);
                break;

            case ForbiddenException forbiddenEx:
                response.StatusCode = (int)HttpStatusCode.Forbidden;
                errorResponse.Status = (int)HttpStatusCode.Forbidden;
                errorResponse.Error = "FORBIDDEN";
                errorResponse.Message = forbiddenEx.Message ?? "Bu işlem için yetkiniz yok.";
                _logger.LogWarning(exception, "Forbidden: {Message}", forbiddenEx.Message);
                break;

            case ConflictException conflictEx:
                response.StatusCode = (int)HttpStatusCode.Conflict;
                errorResponse.Status = (int)HttpStatusCode.Conflict;
                errorResponse.Error = "CONFLICT";
                errorResponse.Message = conflictEx.Message ?? "Çakışma hatası.";
                _logger.LogWarning(exception, "Conflict: {Message}", conflictEx.Message);
                break;

            case BusinessException businessEx:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.Status = (int)HttpStatusCode.BadRequest;
                errorResponse.Error = businessEx.ErrorCode ?? "BUSINESS_ERROR";
                errorResponse.Message = businessEx.Message;
                _logger.LogWarning(exception, "Business error: {Message}", businessEx.Message);
                break;

            case OperationCanceledException:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.Status = (int)HttpStatusCode.BadRequest;
                errorResponse.Error = "REQUEST_CANCELLED";
                errorResponse.Message = "İstek iptal edildi.";
                _logger.LogInformation("Request cancelled");
                break;

            default:
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                errorResponse.Status = (int)HttpStatusCode.InternalServerError;
                errorResponse.Error = "INTERNAL_ERROR";
                errorResponse.Message = "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
                
                // Sadece development'ta detaylı hata göster
                var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
                if (isDevelopment)
                {
                    errorResponse.DeveloperMessage = exception.ToString();
                }
                
                _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);
                break;
        }

        var result = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        });

        await response.WriteAsync(result);
    }
}

/// <summary>
/// Standart API hata yanıtı
/// </summary>
public class ApiErrorResponse
{
    /// <summary>
    /// HTTP durum kodu
    /// </summary>
    public int Status { get; set; }

    /// <summary>
    /// Hata kodu (makine okunabilir)
    /// </summary>
    public string Error { get; set; } = string.Empty;

    /// <summary>
    /// Kullanıcı dostu hata mesajı
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Validation hataları veya ek detaylar
    /// </summary>
    public object? Details { get; set; }

    /// <summary>
    /// İstek takip ID'si
    /// </summary>
    public string TraceId { get; set; } = string.Empty;

    /// <summary>
    /// Hata zamanı
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Sadece development'ta görünen detaylı hata mesajı
    /// </summary>
    public string? DeveloperMessage { get; set; }
}

// ========================
// Custom Exception Classes
// ========================

/// <summary>
/// Validation hatası
/// </summary>
public class ValidationException : Exception
{
    public Dictionary<string, string[]> Errors { get; }

    public ValidationException(string message) : base(message)
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(string message, Dictionary<string, string[]> errors) : base(message)
    {
        Errors = errors;
    }

    public ValidationException(Dictionary<string, string[]> errors) 
        : base("Bir veya daha fazla validation hatası oluştu.")
    {
        Errors = errors;
    }
}

/// <summary>
/// Kayıt bulunamadı hatası
/// </summary>
public class NotFoundException : Exception
{
    public NotFoundException() : base("Kayıt bulunamadı.") { }
    public NotFoundException(string message) : base(message) { }
    public NotFoundException(string name, object key) : base($"{name} ({key}) bulunamadı.") { }
}

/// <summary>
/// Yetkilendirme hatası
/// </summary>
public class UnauthorizedException : Exception
{
    public UnauthorizedException() : base("Yetkilendirme gerekli.") { }
    public UnauthorizedException(string message) : base(message) { }
}

/// <summary>
/// Erişim yasak hatası
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException() : base("Bu işlem için yetkiniz yok.") { }
    public ForbiddenException(string message) : base(message) { }
}

/// <summary>
/// Çakışma hatası (örn: duplicate kayıt)
/// </summary>
public class ConflictException : Exception
{
    public ConflictException() : base("Çakışma hatası.") { }
    public ConflictException(string message) : base(message) { }
}

/// <summary>
/// İş kuralı hatası
/// </summary>
public class BusinessException : Exception
{
    public string? ErrorCode { get; }

    public BusinessException(string message) : base(message) { }
    public BusinessException(string message, string errorCode) : base(message)
    {
        ErrorCode = errorCode;
    }
}

/// <summary>
/// Extension method for registering the middleware
/// </summary>
public static class GlobalExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
    {
        return app.UseMiddleware<GlobalExceptionMiddleware>();
    }
}
