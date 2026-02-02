using ETicaret.Application.DTOs.Auth;
using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Google.Apis.Auth;

namespace ETicaret.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<User> userManager, 
        SignInManager<User> signInManager, 
        IConfiguration configuration,
        ApplicationDbContext context,
        IEmailService emailService,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            throw new Exception("Kullanıcı bulunamadı veya şifre hatalı.");

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded)
            throw new Exception("Kullanıcı bulunamadı veya şifre hatalı."); // Güvenlik için aynı mesaj

        var token = await GenerateJwtTokenAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "Customer";

        return new AuthResponse
        {
            Token = token,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = role
        };
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var userExists = await _userManager.FindByEmailAsync(request.Email);
        if (userExists != null)
            throw new Exception("Bu e-posta adresi zaten kullanımda.");

        var user = new User
        {
            Email = request.Email,
            UserName = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new Exception($"Kayıt başarısız: {errors}");
        }

        // Assign default role
        await _userManager.AddToRoleAsync(user, "Customer");

        // Send welcome email
        try
        {
            await _emailService.SendWelcomeEmailAsync(user.Email, $"{user.FirstName} {user.LastName}");
            _logger.LogInformation("Welcome email sent to {Email}", user.Email);
        }
        catch (Exception emailEx)
        {
            _logger.LogError(emailEx, "Failed to send welcome email to {Email}", user.Email);
            // Don't fail registration if email fails
        }

        var token = await GenerateJwtTokenAsync(user);

        return new AuthResponse
        {
            Token = token,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = "Customer"
        };
    }

    public async Task<AuthResponse> GoogleLoginAsync(GoogleLoginRequest request)
    {
        try
        {
            // Google Client ID'yi environment variable'dan al (appsettings.json'da env var adı var)
            var googleClientIdVar = _configuration["Google:ClientId"]
                ?? throw new InvalidOperationException("Google:ClientId configuration is required.");
            
            var googleClientId = Environment.GetEnvironmentVariable(googleClientIdVar)
                ?? throw new InvalidOperationException($"{googleClientIdVar} environment variable is required. Check your .env file.");

            // GÜVENLİK: ID Token'ı kriptografik olarak doğrula
            // Bu, token'ın gerçekten Google'dan geldiğini ve manipüle edilmediğini garanti eder
            GoogleJsonWebSignature.Payload payload;
            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(
                    request.IdToken,
                    new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { googleClientId },
                        // İsteğe bağlı: İlave güvenlik kontrolleri
                        IssuedAtClockTolerance = TimeSpan.FromMinutes(5),
                        ExpirationTimeClockTolerance = TimeSpan.FromMinutes(5)
                    }
                );
            }
            catch (Exception ex)
            {
                throw new Exception($"Google token doğrulama hatası: {ex.Message}");
            }

            if (payload == null || string.IsNullOrEmpty(payload.Email))
            {
                throw new Exception("Google kullanıcı bilgileri geçersiz.");
            }

            // Email doğrulamasını kontrol et
            if (!payload.EmailVerified)
            {
                throw new Exception("Google hesabınızın email adresi doğrulanmamış.");
            }

            // Kullanıcıyı email ile bul
            var user = await _userManager.FindByEmailAsync(payload.Email);

            // Kullanıcı yoksa, yeni kullanıcı oluştur
            if (user == null)
            {
                user = new User
                {
                    Email = payload.Email,
                    UserName = payload.Email,
                    FirstName = payload.GivenName ?? "Google",
                    LastName = payload.FamilyName ?? "User",
                    EmailConfirmed = true, // Google'dan gelen emailler doğrulanmış
                    CreatedAt = DateTime.UtcNow
                };

                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                {
                    var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                    throw new Exception($"Google kullanıcısı oluşturulamadı: {errors}");
                }

                // Yeni kullanıcıya Customer rolü ata
                await _userManager.AddToRoleAsync(user, "Customer");
            }

            // JWT token oluştur
            var token = await GenerateJwtTokenAsync(user);

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "Customer";

            return new AuthResponse
            {
                Token = token,
                Email = user.Email!,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = role
            };
        }
        catch (Exception ex)
        {
            throw new Exception($"Google girişi başarısız: {ex.Message}");
        }
    }

    private async Task<string> GenerateJwtTokenAsync(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        
        // appsettings.json'dan environment variable isimlerini al
        var secretKeyVar = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JwtSettings:SecretKey not found in appsettings.json");
        var issuerVar = jwtSettings["Issuer"] ?? throw new InvalidOperationException("JwtSettings:Issuer not found in appsettings.json");
        var audienceVar = jwtSettings["Audience"] ?? throw new InvalidOperationException("JwtSettings:Audience not found in appsettings.json");
        var durationVar = jwtSettings["DurationInMinutes"] ?? throw new InvalidOperationException("JwtSettings:DurationInMinutes not found in appsettings.json");
        
        // .env dosyasından gerçek değerleri al
        var secretKey = Environment.GetEnvironmentVariable(secretKeyVar)
            ?? throw new InvalidOperationException($"{secretKeyVar} environment variable is required. Please check your .env file.");
        var issuer = Environment.GetEnvironmentVariable(issuerVar)
            ?? throw new InvalidOperationException($"{issuerVar} environment variable is required. Please check your .env file.");
        var audience = Environment.GetEnvironmentVariable(audienceVar)
            ?? throw new InvalidOperationException($"{audienceVar} environment variable is required. Please check your .env file.");
        var durationMinutes = Environment.GetEnvironmentVariable(durationVar)
            ?? throw new InvalidOperationException($"{durationVar} environment variable is required. Please check your .env file.");
        
        var key = Encoding.UTF8.GetBytes(secretKey);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Add Roles
        var roles = await _userManager.GetRolesAsync(user);
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(double.Parse(durationMinutes)),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
            Issuer = issuer,
            Audience = audience
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public async Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            // Güvenlik için kullanıcı bulunamasa bile başarılı mesaj döndür
            return new ForgotPasswordResponse
            {
                Success = true,
                Message = "Eğer bu e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir."
            };
        }

        // Daha önce kullanılmamış token'ları pasif yap
        var oldTokens = await _context.PasswordResets
            .Where(pr => pr.UserId == user.Id && !pr.IsUsed)
            .ToListAsync();
        
        foreach (var oldToken in oldTokens)
        {
            oldToken.IsUsed = true;
        }

        // Yeni token oluştur
        var resetToken = GenerateSecureToken();
        var passwordReset = new PasswordReset
        {
            UserId = user.Id,
            Token = resetToken,
            ExpiresAt = DateTime.UtcNow.AddHours(1), // 1 saat geçerli
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.PasswordResets.Add(passwordReset);
        await _context.SaveChangesAsync();

        // Production'da burada email gönderilir
        // Şimdilik token'ı response'da döndürüyoruz (development için)
        
        return new ForgotPasswordResponse
        {
            Success = true,
            Message = "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.",
            ResetToken = resetToken // Development aşamasında göster, production'da kaldır!
        };
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var passwordReset = await _context.PasswordResets
            .Include(pr => pr.User)
            .FirstOrDefaultAsync(pr => pr.Token == request.Token && !pr.IsUsed);

        if (passwordReset == null)
            throw new Exception("Geçersiz veya kullanılmış token.");

        if (passwordReset.ExpiresAt < DateTime.UtcNow)
            throw new Exception("Token'ın süresi dolmuş. Lütfen yeni bir şifre sıfırlama talebi oluşturun.");

        var user = passwordReset.User;
        
        // UserManager ile şifreyi güncelle (best practice)
        // RemovePasswordAsync + AddPasswordAsync kullanarak eski şifreyi kaldırıp yenisini ekliyoruz
        var removeResult = await _userManager.RemovePasswordAsync(user);
        if (!removeResult.Succeeded)
        {
            var errors = string.Join(", ", removeResult.Errors.Select(e => e.Description));
            throw new Exception($"Eski şifre kaldırılamadı: {errors}");
        }

        var addResult = await _userManager.AddPasswordAsync(user, request.NewPassword);
        if (!addResult.Succeeded)
        {
            var errors = string.Join(", ", addResult.Errors.Select(e => e.Description));
            throw new Exception($"Yeni şifre eklenemedi: {errors}");
        }

        // Token'ı kullanılmış olarak işaretle
        passwordReset.IsUsed = true;
        await _context.SaveChangesAsync();

        return true;
    }

    private string GenerateSecureToken()
    {
        var randomBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
    }
}
