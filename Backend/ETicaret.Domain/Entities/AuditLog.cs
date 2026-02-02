namespace ETicaret.Domain.Entities;

/// <summary>
/// Sistem üzerinde gerçekleştirilen önemli işlemleri kayıt altına alır
/// </summary>
public class AuditLog
{
    public int Id { get; set; }
    
    /// <summary>
    /// İşlemi yapan kullanıcının ID'si (null ise anonim)
    /// </summary>
    public string? UserId { get; set; }
    
    /// <summary>
    /// İşlemi yapan kullanıcının email adresi
    /// </summary>
    public string? UserEmail { get; set; }
    
    /// <summary>
    /// İşlem türü (Login, Logout, CreateOrder, UpdateProduct, etc.)
    /// </summary>
    public string Action { get; set; } = string.Empty;
    
    /// <summary>
    /// İşlem kategorisi (Auth, Order, Product, Admin, Security)
    /// </summary>
    public string Category { get; set; } = string.Empty;
    
    /// <summary>
    /// İşlem detayları (JSON formatında)
    /// </summary>
    public string? Details { get; set; }
    
    /// <summary>
    /// Etkilenen entity türü (User, Product, Order, etc.)
    /// </summary>
    public string? EntityType { get; set; }
    
    /// <summary>
    /// Etkilenen entity'nin ID'si
    /// </summary>
    public string? EntityId { get; set; }
    
    /// <summary>
    /// Eski değer (güncelleme işlemlerinde)
    /// </summary>
    public string? OldValue { get; set; }
    
    /// <summary>
    /// Yeni değer (güncelleme işlemlerinde)
    /// </summary>
    public string? NewValue { get; set; }
    
    /// <summary>
    /// İstemci IP adresi
    /// </summary>
    public string? IpAddress { get; set; }
    
    /// <summary>
    /// User Agent bilgisi
    /// </summary>
    public string? UserAgent { get; set; }
    
    /// <summary>
    /// İstek yapılan endpoint
    /// </summary>
    public string? Endpoint { get; set; }
    
    /// <summary>
    /// HTTP metodu (GET, POST, PUT, DELETE)
    /// </summary>
    public string? HttpMethod { get; set; }
    
    /// <summary>
    /// İşlem başarılı mı?
    /// </summary>
    public bool IsSuccessful { get; set; } = true;
    
    /// <summary>
    /// Hata mesajı (başarısız işlemlerde)
    /// </summary>
    public string? ErrorMessage { get; set; }
    
    /// <summary>
    /// Risk seviyesi (Low, Medium, High, Critical)
    /// </summary>
    public string RiskLevel { get; set; } = "Low";
    
    /// <summary>
    /// İşlem tarihi
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation
    public User? User { get; set; }
}

/// <summary>
/// Audit log kategorileri
/// </summary>
public static class AuditCategory
{
    public const string Auth = "Auth";
    public const string Order = "Order";
    public const string Product = "Product";
    public const string Admin = "Admin";
    public const string Security = "Security";
    public const string User = "User";
    public const string Payment = "Payment";
    public const string System = "System";
}

/// <summary>
/// Audit log aksiyonları
/// </summary>
public static class AuditAction
{
    // Auth
    public const string Login = "Login";
    public const string LoginFailed = "LoginFailed";
    public const string Logout = "Logout";
    public const string Register = "Register";
    public const string PasswordReset = "PasswordReset";
    public const string PasswordChange = "PasswordChange";
    public const string Enable2FA = "Enable2FA";
    public const string Disable2FA = "Disable2FA";
    public const string Verify2FA = "Verify2FA";
    
    // Order
    public const string CreateOrder = "CreateOrder";
    public const string UpdateOrderStatus = "UpdateOrderStatus";
    public const string CancelOrder = "CancelOrder";
    public const string RefundOrder = "RefundOrder";
    
    // Product
    public const string CreateProduct = "CreateProduct";
    public const string UpdateProduct = "UpdateProduct";
    public const string DeleteProduct = "DeleteProduct";
    public const string UpdateStock = "UpdateStock";
    
    // Admin
    public const string CreateUser = "CreateUser";
    public const string UpdateUser = "UpdateUser";
    public const string DeleteUser = "DeleteUser";
    public const string ChangeUserRole = "ChangeUserRole";
    public const string BanUser = "BanUser";
    public const string UnbanUser = "UnbanUser";
    
    // Security
    public const string RateLimitExceeded = "RateLimitExceeded";
    public const string SuspiciousActivity = "SuspiciousActivity";
    public const string BlockedIp = "BlockedIp";
    public const string UnblockedIp = "UnblockedIp";
    public const string AccessDenied = "AccessDenied";
}

/// <summary>
/// Risk seviyeleri
/// </summary>
public static class RiskLevel
{
    public const string Low = "Low";
    public const string Medium = "Medium";
    public const string High = "High";
    public const string Critical = "Critical";
}
