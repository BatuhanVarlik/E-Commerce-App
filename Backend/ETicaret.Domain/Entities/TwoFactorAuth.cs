namespace ETicaret.Domain.Entities;

/// <summary>
/// İki faktörlü kimlik doğrulama (2FA) bilgilerini saklar
/// </summary>
public class TwoFactorAuth
{
    public int Id { get; set; }
    
    /// <summary>
    /// Kullanıcı ID'si
    /// </summary>
    public string UserId { get; set; } = string.Empty;
    
    /// <summary>
    /// TOTP için gizli anahtar (şifrelenmiş)
    /// </summary>
    public string SecretKey { get; set; } = string.Empty;
    
    /// <summary>
    /// 2FA aktif mi?
    /// </summary>
    public bool IsEnabled { get; set; } = false;
    
    /// <summary>
    /// Kurtarma kodları (JSON array olarak saklanır, şifrelenmiş)
    /// </summary>
    public string? RecoveryCodes { get; set; }
    
    /// <summary>
    /// Kullanılan kurtarma kodları sayısı
    /// </summary>
    public int UsedRecoveryCodesCount { get; set; } = 0;
    
    /// <summary>
    /// Son doğrulama tarihi
    /// </summary>
    public DateTime? LastVerifiedAt { get; set; }
    
    /// <summary>
    /// Başarısız doğrulama denemesi sayısı
    /// </summary>
    public int FailedAttempts { get; set; } = 0;
    
    /// <summary>
    /// Kilitlenme bitiş tarihi (çok fazla başarısız deneme sonrası)
    /// </summary>
    public DateTime? LockedUntil { get; set; }
    
    /// <summary>
    /// Oluşturulma tarihi
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Güncellenme tarihi
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation
    public User User { get; set; } = null!;
}
