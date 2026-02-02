using ETicaret.Application.DTOs.Security;
using ETicaret.Application.DTOs.Auth;

namespace ETicaret.Application.Interfaces;

/// <summary>
/// İki faktörlü kimlik doğrulama (2FA) servisi
/// </summary>
public interface ITwoFactorAuthService
{
    /// <summary>
    /// Kullanıcı için 2FA kurulumu başlat
    /// </summary>
    Task<Setup2FAResponse> SetupAsync(string userId);
    
    /// <summary>
    /// 2FA kodunu doğrula
    /// </summary>
    Task<bool> VerifyCodeAsync(string userId, string code);
    
    /// <summary>
    /// 2FA'yı aktifleştir (ilk doğrulamadan sonra)
    /// </summary>
    Task<bool> EnableAsync(string userId, string code);
    
    /// <summary>
    /// 2FA'yı devre dışı bırak
    /// </summary>
    Task<bool> DisableAsync(string userId, string code, string password);
    
    /// <summary>
    /// Kullanıcının 2FA durumunu kontrol et
    /// </summary>
    Task<TwoFactorStatusDto> GetStatusAsync(string userId);
    
    /// <summary>
    /// Kullanıcının 2FA aktif mi?
    /// </summary>
    Task<bool> Is2FAEnabledAsync(string userId);
    
    /// <summary>
    /// Kurtarma kodu ile doğrula
    /// </summary>
    Task<bool> VerifyRecoveryCodeAsync(string userId, string recoveryCode);
    
    /// <summary>
    /// Yeni kurtarma kodları oluştur
    /// </summary>
    Task<List<string>> RegenerateRecoveryCodesAsync(string userId, string code);
    
    /// <summary>
    /// 2FA doğrulaması sonrası token oluştur
    /// </summary>
    Task<AuthResponse> CompleteLoginWith2FAAsync(string userId, string code);
    
    /// <summary>
    /// Kurtarma kodu ile giriş
    /// </summary>
    Task<AuthResponse> LoginWithRecoveryCodeAsync(string email, string recoveryCode);
}
