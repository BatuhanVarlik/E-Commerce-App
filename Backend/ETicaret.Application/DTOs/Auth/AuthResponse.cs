namespace ETicaret.Application.DTOs.Auth;

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public string? ProfilePhotoUrl { get; set; }
    
    /// <summary>
    /// 2FA aktif mi? Login'de kontrol için
    /// </summary>
    public bool RequiresTwoFactor { get; set; } = false;
    
    /// <summary>
    /// 2FA doğrulaması için geçici userId (token yerine)
    /// </summary>
    public string? TwoFactorUserId { get; set; }
}
