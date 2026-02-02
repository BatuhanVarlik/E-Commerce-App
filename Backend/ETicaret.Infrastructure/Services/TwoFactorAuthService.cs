using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ETicaret.Application.DTOs.Auth;
using ETicaret.Application.DTOs.Security;
using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using OtpNet;
using QRCoder;

namespace ETicaret.Infrastructure.Services;

/// <summary>
/// İki faktörlü kimlik doğrulama (2FA) servisi
/// TOTP (Time-based One-Time Password) tabanlı
/// </summary>
public class TwoFactorAuthService : ITwoFactorAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ISecurityService _securityService;
    
    private const int RecoveryCodeCount = 10;
    private const int MaxFailedAttempts = 5;
    private const int LockoutMinutes = 15;
    private const string Issuer = "ETicaret";

    public TwoFactorAuthService(
        ApplicationDbContext context,
        UserManager<User> userManager,
        IConfiguration configuration,
        ISecurityService securityService)
    {
        _context = context;
        _userManager = userManager;
        _configuration = configuration;
        _securityService = securityService;
    }

    public async Task<Setup2FAResponse> SetupAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new Exception("Kullanıcı bulunamadı.");

        // Mevcut 2FA kaydını kontrol et
        var existing = await _context.TwoFactorAuths
            .FirstOrDefaultAsync(t => t.UserId == userId);

        if (existing != null && existing.IsEnabled)
            throw new Exception("2FA zaten aktif. Önce devre dışı bırakın.");

        // Yeni secret key oluştur (Base32)
        var secretKey = Base32Encoding.ToString(KeyGeneration.GenerateRandomKey(20));
        
        // Kurtarma kodları oluştur
        var recoveryCodes = GenerateRecoveryCodes();
        var hashedCodes = recoveryCodes.Select(HashCode).ToList();

        // QR kod URL'i oluştur (otpauth formatı)
        var otpauthUrl = $"otpauth://totp/{Issuer}:{user.Email}?secret={secretKey}&issuer={Issuer}&algorithm=SHA1&digits=6&period=30";
        
        // QR kod görselini oluştur
        var qrCodeImage = GenerateQrCode(otpauthUrl);

        // 2FA kaydını oluştur veya güncelle
        if (existing != null)
        {
            existing.SecretKey = secretKey;
            existing.RecoveryCodes = JsonSerializer.Serialize(hashedCodes);
            existing.UsedRecoveryCodesCount = 0;
            existing.FailedAttempts = 0;
            existing.LockedUntil = null;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.TwoFactorAuths.Add(new TwoFactorAuth
            {
                UserId = userId,
                SecretKey = secretKey,
                IsEnabled = false, // Enable'da aktifleşecek
                RecoveryCodes = JsonSerializer.Serialize(hashedCodes),
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        return new Setup2FAResponse
        {
            QrCodeImage = qrCodeImage,
            ManualEntryKey = secretKey,
            RecoveryCodes = recoveryCodes
        };
    }

    public async Task<bool> VerifyCodeAsync(string userId, string code)
    {
        var twoFactor = await _context.TwoFactorAuths
            .FirstOrDefaultAsync(t => t.UserId == userId);

        if (twoFactor == null)
            return false;

        // Kilitli mi kontrol et
        if (twoFactor.LockedUntil.HasValue && twoFactor.LockedUntil > DateTime.UtcNow)
            throw new Exception($"Çok fazla başarısız deneme. {LockoutMinutes} dakika sonra tekrar deneyin.");

        var totp = new Totp(Base32Encoding.ToBytes(twoFactor.SecretKey));
        var isValid = totp.VerifyTotp(code, out _, new VerificationWindow(previous: 1, future: 1));

        if (isValid)
        {
            // Başarılı doğrulama
            twoFactor.FailedAttempts = 0;
            twoFactor.LastVerifiedAt = DateTime.UtcNow;
            twoFactor.LockedUntil = null;
            await _context.SaveChangesAsync();
        }
        else
        {
            // Başarısız deneme
            twoFactor.FailedAttempts++;
            
            if (twoFactor.FailedAttempts >= MaxFailedAttempts)
            {
                twoFactor.LockedUntil = DateTime.UtcNow.AddMinutes(LockoutMinutes);
                
                await _securityService.LogAsync(
                    AuditAction.SuspiciousActivity,
                    AuditCategory.Security,
                    userId: userId,
                    details: $"2FA locked after {MaxFailedAttempts} failed attempts",
                    riskLevel: RiskLevel.High
                );
            }
            
            await _context.SaveChangesAsync();
        }

        return isValid;
    }

    public async Task<bool> EnableAsync(string userId, string code)
    {
        // Önce kodu doğrula
        if (!await VerifyCodeAsync(userId, code))
            throw new Exception("Geçersiz doğrulama kodu.");

        var twoFactor = await _context.TwoFactorAuths
            .FirstOrDefaultAsync(t => t.UserId == userId)
            ?? throw new Exception("2FA kurulumu bulunamadı. Önce kurulum yapın.");

        twoFactor.IsEnabled = true;
        twoFactor.UpdatedAt = DateTime.UtcNow;
        
        // ASP.NET Identity'de de 2FA'yı aktifleştir
        var user = await _userManager.FindByIdAsync(userId);
        if (user != null)
        {
            await _userManager.SetTwoFactorEnabledAsync(user, true);
        }

        await _context.SaveChangesAsync();

        await _securityService.LogAsync(
            AuditAction.Enable2FA,
            AuditCategory.Auth,
            userId: userId,
            riskLevel: RiskLevel.Medium
        );

        return true;
    }

    public async Task<bool> DisableAsync(string userId, string code, string password)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new Exception("Kullanıcı bulunamadı.");

        // Şifreyi doğrula
        if (!await _userManager.CheckPasswordAsync(user, password))
            throw new Exception("Geçersiz şifre.");

        // Kodu doğrula (TOTP veya recovery code olabilir)
        var isValidCode = await VerifyCodeAsync(userId, code) || 
                          await VerifyRecoveryCodeAsync(userId, code);

        if (!isValidCode)
            throw new Exception("Geçersiz doğrulama kodu.");

        var twoFactor = await _context.TwoFactorAuths
            .FirstOrDefaultAsync(t => t.UserId == userId);

        if (twoFactor != null)
        {
            twoFactor.IsEnabled = false;
            twoFactor.UpdatedAt = DateTime.UtcNow;
        }

        // ASP.NET Identity'de de 2FA'yı deaktif et
        await _userManager.SetTwoFactorEnabledAsync(user, false);

        await _context.SaveChangesAsync();

        await _securityService.LogAsync(
            AuditAction.Disable2FA,
            AuditCategory.Auth,
            userId: userId,
            riskLevel: RiskLevel.High
        );

        return true;
    }

    public async Task<TwoFactorStatusDto> GetStatusAsync(string userId)
    {
        var twoFactor = await _context.TwoFactorAuths
            .FirstOrDefaultAsync(t => t.UserId == userId);

        if (twoFactor == null)
        {
            return new TwoFactorStatusDto
            {
                IsEnabled = false,
                RemainingRecoveryCodes = 0
            };
        }

        var usedCodes = twoFactor.UsedRecoveryCodesCount;
        
        return new TwoFactorStatusDto
        {
            IsEnabled = twoFactor.IsEnabled,
            LastVerifiedAt = twoFactor.LastVerifiedAt,
            RemainingRecoveryCodes = Math.Max(0, RecoveryCodeCount - usedCodes)
        };
    }

    public async Task<bool> Is2FAEnabledAsync(string userId)
    {
        return await _context.TwoFactorAuths
            .AnyAsync(t => t.UserId == userId && t.IsEnabled);
    }

    public async Task<bool> VerifyRecoveryCodeAsync(string userId, string recoveryCode)
    {
        var twoFactor = await _context.TwoFactorAuths
            .FirstOrDefaultAsync(t => t.UserId == userId);

        if (twoFactor == null || string.IsNullOrEmpty(twoFactor.RecoveryCodes))
            return false;

        var hashedCodes = JsonSerializer.Deserialize<List<string>>(twoFactor.RecoveryCodes);
        if (hashedCodes == null) return false;

        var inputHash = HashCode(recoveryCode.Replace("-", "").ToUpper());
        
        if (hashedCodes.Contains(inputHash))
        {
            // Kodu kullanıldı olarak işaretle
            hashedCodes.Remove(inputHash);
            twoFactor.RecoveryCodes = JsonSerializer.Serialize(hashedCodes);
            twoFactor.UsedRecoveryCodesCount++;
            twoFactor.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            await _securityService.LogAsync(
                "RecoveryCodeUsed",
                AuditCategory.Auth,
                userId: userId,
                details: $"Recovery code used. {hashedCodes.Count} remaining.",
                riskLevel: RiskLevel.Medium
            );

            return true;
        }

        return false;
    }

    public async Task<List<string>> RegenerateRecoveryCodesAsync(string userId, string code)
    {
        // Mevcut kodu doğrula
        if (!await VerifyCodeAsync(userId, code))
            throw new Exception("Geçersiz doğrulama kodu.");

        var twoFactor = await _context.TwoFactorAuths
            .FirstOrDefaultAsync(t => t.UserId == userId)
            ?? throw new Exception("2FA bulunamadı.");

        // Yeni kurtarma kodları oluştur
        var newCodes = GenerateRecoveryCodes();
        var hashedCodes = newCodes.Select(HashCode).ToList();

        twoFactor.RecoveryCodes = JsonSerializer.Serialize(hashedCodes);
        twoFactor.UsedRecoveryCodesCount = 0;
        twoFactor.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _securityService.LogAsync(
            "RecoveryCodesRegenerated",
            AuditCategory.Auth,
            userId: userId,
            riskLevel: RiskLevel.Medium
        );

        return newCodes;
    }

    public async Task<AuthResponse> CompleteLoginWith2FAAsync(string userId, string code)
    {
        // Kodu doğrula
        if (!await VerifyCodeAsync(userId, code))
            throw new Exception("Geçersiz doğrulama kodu.");

        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new Exception("Kullanıcı bulunamadı.");

        // JWT token oluştur
        var token = await GenerateJwtToken(user);
        var roles = await _userManager.GetRolesAsync(user);

        await _securityService.LogAsync(
            AuditAction.Verify2FA,
            AuditCategory.Auth,
            userId: userId,
            userEmail: user.Email,
            riskLevel: RiskLevel.Low
        );

        return new AuthResponse
        {
            Token = token,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            UserId = user.Id,
            Roles = roles.ToList(),
            ProfilePhotoUrl = user.ProfilePhotoUrl
        };
    }

    public async Task<AuthResponse> LoginWithRecoveryCodeAsync(string email, string recoveryCode)
    {
        var user = await _userManager.FindByEmailAsync(email)
            ?? throw new Exception("Kullanıcı bulunamadı.");

        if (!await VerifyRecoveryCodeAsync(user.Id, recoveryCode))
            throw new Exception("Geçersiz kurtarma kodu.");

        var token = await GenerateJwtToken(user);
        var roles = await _userManager.GetRolesAsync(user);

        return new AuthResponse
        {
            Token = token,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            UserId = user.Id,
            Roles = roles.ToList(),
            ProfilePhotoUrl = user.ProfilePhotoUrl
        };
    }

    #region Private Helpers

    private static List<string> GenerateRecoveryCodes()
    {
        var codes = new List<string>();
        
        for (int i = 0; i < RecoveryCodeCount; i++)
        {
            var code = Convert.ToHexString(RandomNumberGenerator.GetBytes(5)).ToUpper();
            // Format: XXXX-XXXX
            codes.Add($"{code.Substring(0, 5)}-{code.Substring(5)}");
        }

        return codes;
    }

    private static string HashCode(string code)
    {
        var bytes = Encoding.UTF8.GetBytes(code.ToUpper().Replace("-", ""));
        var hash = SHA256.HashData(bytes);
        return Convert.ToBase64String(hash);
    }

    private static string GenerateQrCode(string content)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(content, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        var qrCodeBytes = qrCode.GetGraphic(20);
        return $"data:image/png;base64,{Convert.ToBase64String(qrCodeBytes)}";
    }

    private async Task<string> GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKeyVar = jwtSettings["SecretKey"] ?? throw new Exception("JWT SecretKey not configured");
        var issuerVar = jwtSettings["Issuer"] ?? throw new Exception("JWT Issuer not configured");
        var audienceVar = jwtSettings["Audience"] ?? throw new Exception("JWT Audience not configured");

        var secretKey = Environment.GetEnvironmentVariable(secretKeyVar) 
            ?? throw new Exception($"{secretKeyVar} environment variable not set");
        var issuer = Environment.GetEnvironmentVariable(issuerVar) 
            ?? throw new Exception($"{issuerVar} environment variable not set");
        var audience = Environment.GetEnvironmentVariable(audienceVar) 
            ?? throw new Exception($"{audienceVar} environment variable not set");

        var roles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? ""),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new("firstName", user.FirstName),
            new("lastName", user.LastName),
            new("2fa_verified", "true")
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    #endregion
}
