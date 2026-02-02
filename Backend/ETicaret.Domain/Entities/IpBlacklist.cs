namespace ETicaret.Domain.Entities;

/// <summary>
/// Engellenen IP adresleri listesi
/// </summary>
public class IpBlacklist
{
    public int Id { get; set; }
    
    /// <summary>
    /// Engellenen IP adresi
    /// </summary>
    public string IpAddress { get; set; } = string.Empty;
    
    /// <summary>
    /// Engelleme sebebi
    /// </summary>
    public string Reason { get; set; } = string.Empty;
    
    /// <summary>
    /// Engelleyen admin kullanıcı ID'si
    /// </summary>
    public string? BlockedByUserId { get; set; }
    
    /// <summary>
    /// Otomatik mi engellendi? (Rate limiting, brute force vs.)
    /// </summary>
    public bool IsAutomatic { get; set; } = false;
    
    /// <summary>
    /// Engelleme bitiş tarihi (null ise kalıcı)
    /// </summary>
    public DateTime? ExpiresAt { get; set; }
    
    /// <summary>
    /// Aktif mi?
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Engelleme tarihi
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Güncellenme tarihi
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation
    public User? BlockedByUser { get; set; }
}

/// <summary>
/// Güvenilir IP adresleri listesi (Rate limit'ten muaf vs.)
/// </summary>
public class IpWhitelist
{
    public int Id { get; set; }
    
    /// <summary>
    /// Güvenilir IP adresi
    /// </summary>
    public string IpAddress { get; set; } = string.Empty;
    
    /// <summary>
    /// Açıklama
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Ekleyen admin kullanıcı ID'si
    /// </summary>
    public string? AddedByUserId { get; set; }
    
    /// <summary>
    /// Aktif mi?
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Ekleme tarihi
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation
    public User? AddedByUser { get; set; }
}
