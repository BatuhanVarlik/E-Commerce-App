# Google OAuth 2.0 Entegrasyonu - Güvenli Kimlik Doğrulama Rehberi

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Güvenlik Özellikleri](#güvenlik-özellikleri)
3. [Kurulum ve Yapılandırma](#kurulum-ve-yapılandırma)
4. [Mimari ve Akış](#mimari-ve-akış)
5. [Kod Açıklamaları](#kod-açıklamaları)
6. [Sorun Giderme](#sorun-giderme)
7. [Üretim Ortamı İçin Öneriler](#üretim-ortamı-için-öneriler)

---

## 🎯 Genel Bakış

Bu proje, Google OAuth 2.0 kullanarak **güvenli** ve **profesyonel** bir kimlik doğrulama sistemi içerir. Kullanıcılar Google hesaplarıyla tek tıkla giriş yapabilir.

### Temel Özellikler

- ✅ **Kriptografik Token Doğrulama**: ID token'lar Google.Apis.Auth kütüphanesi ile doğrulanır
- ✅ **Email Doğrulama Kontrolü**: Sadece doğrulanmış email adreslerine izin verilir
- ✅ **Otomatik Kullanıcı Oluşturma**: İlk girişte kullanıcı otomatik olarak veritabanına eklenir
- ✅ **JWT Token Entegrasyonu**: Google girişinden sonra kendi JWT token'ımız üretilir
- ✅ **Role-Based Access Control**: Kullanıcılara otomatik "Customer" rolü atanır
- ✅ **One Tap Sign-In**: Google'ın One Tap özelliği ile hızlı giriş

---

## 🔒 Güvenlik Özellikleri

### 1. ID Token Kullanımı (Access Token DEĞİL!)

**Neden güvenli?**

- ID token'lar kriptografik olarak imzalanır (JWT)
- Google'ın public key'leri ile doğrulanır
- Manipüle edilemez
- Kısa ömürlüdür (genellikle 1 saat)

```csharp
// ❌ GÜVENSİZ (Eski implementasyon)
// Access token ile userinfo endpoint'e HTTP request
var userInfo = await httpClient.GetAsync($"https://www.googleapis.com/oauth2/v3/userinfo?access_token={token}");

// ✅ GÜVENLİ (Şu anki implementasyon)
// ID token kriptografik doğrulama
var payload = await GoogleJsonWebSignature.ValidateAsync(
    request.IdToken,
    new GoogleJsonWebSignature.ValidationSettings
    {
        Audience = new[] { googleClientId },
        IssuedAtClockTolerance = TimeSpan.FromMinutes(5),
        ExpirationTimeClockTolerance = TimeSpan.FromMinutes(5)
    }
);
```

### 2. Audience (aud) Claim Kontrolü

Google Client ID ile token'ın hedef kitle (audience) claim'i karşılaştırılır. Bu, token'ın başka bir uygulama için üretilip bizim uygulamamızda kullanılmasını engeller.

### 3. Email Doğrulama Kontrolü

```csharp
if (!payload.EmailVerified)
{
    throw new Exception("Google hesabınızın email adresi doğrulanmamış.");
}
```

### 4. Environment Variable Kullanımı

Hassas bilgiler (Client ID, Client Secret) kod içinde değil, environment variable'larda saklanır:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
```

---

## ⚙️ Kurulum ve Yapılandırma

### Adım 1: Google Cloud Console Ayarları

1. **Google Cloud Console'a gidin**: https://console.cloud.google.com/
2. **Yeni proje oluşturun** veya mevcut projeyi seçin
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
4. **Application type**: Web application
5. **Authorized JavaScript origins** ekleyin:
   ```
   http://localhost:3000
   https://yourdomain.com (production için)
   ```
6. **Authorized redirect URIs** bölümünü **BOŞ BIRAKIN** (One Tap popup kullandığımız için gerekmiyor)
7. **Client ID** ve **Client Secret**'ı kaydedin

### Adım 2: Backend Yapılandırması

#### 2.1. NuGet Paketleri

```bash
cd Backend/ETicaret.Infrastructure
dotnet add package Google.Apis.Auth
```

#### 2.2. Environment Variables (Backend/.env)

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=737966311176-xxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
```

#### 2.3. appsettings.json

```json
{
  "Google": {
    "ClientId": "GOOGLE_CLIENT_ID"
  }
}
```

**Not**: appsettings.json'da **environment variable adını** yazıyoruz, gerçek değeri değil.

#### 2.4. DTO Oluşturma

`Backend/ETicaret.Application/DTOs/Auth/GoogleLoginRequest.cs`:

```csharp
namespace ETicaret.Application.DTOs.Auth;

public class GoogleLoginRequest
{
    public string IdToken { get; set; } = string.Empty;
}
```

#### 2.5. Interface Güncelleme

`Backend/ETicaret.Application/Interfaces/IAuthService.cs`:

```csharp
public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> GoogleLoginAsync(GoogleLoginRequest request); // YENİ
    Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request);
}
```

#### 2.6. Service Implementation

`Backend/ETicaret.Infrastructure/Services/AuthService.cs`:

```csharp
using Google.Apis.Auth;

public async Task<AuthResponse> GoogleLoginAsync(GoogleLoginRequest request)
{
    try
    {
        // Environment variable adını appsettings'den al
        var googleClientIdVar = _configuration["Google:ClientId"]
            ?? throw new InvalidOperationException("Google:ClientId configuration is required.");

        // Gerçek değeri environment variable'dan oku
        var googleClientId = Environment.GetEnvironmentVariable(googleClientIdVar)
            ?? throw new InvalidOperationException($"{googleClientIdVar} environment variable is required.");

        // ID Token'ı kriptografik olarak doğrula
        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                request.IdToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { googleClientId },
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

        // Email doğrulama kontrolü
        if (!payload.EmailVerified)
        {
            throw new Exception("Google hesabınızın email adresi doğrulanmamış.");
        }

        // Kullanıcıyı email ile bul
        var user = await _userManager.FindByEmailAsync(payload.Email);

        // Kullanıcı yoksa yeni oluştur
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
```

#### 2.7. Controller Endpoint

`Backend/ETicaret.API/Controllers/AuthController.cs`:

```csharp
[HttpPost("google")]
public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
{
    try
    {
        var result = await _authService.GoogleLoginAsync(request);
        return Ok(result);
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}
```

### Adım 3: Frontend Yapılandırması

#### 3.1. NPM Paketleri

```bash
cd Frontend
npm install @react-oauth/google
```

#### 3.2. Environment Variables (Frontend/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5162
NEXT_PUBLIC_GOOGLE_CLIENT_ID=737966311176-xxxxxx.apps.googleusercontent.com
```

#### 3.3. GoogleOAuthProvider Wrapper

`Frontend/app/layout.tsx`:

```tsx
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <html lang="tr">
      <body>
        <GoogleOAuthProvider clientId={googleClientId}>
          <AuthProvider>
            <CartProvider>
              <Navbar />
              {children}
            </CartProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
```

#### 3.4. API Helper

`Frontend/lib/api.ts`:

```typescript
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/Auth/login", { email, password }),

  register: (data: RegisterData) => api.post("/api/Auth/register", data),

  googleLogin: (idToken: string) => api.post("/api/Auth/google", { idToken }),

  forgotPassword: (email: string) =>
    api.post("/api/Auth/forgot-password", { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post("/api/Auth/reset-password", { token, newPassword }),
};
```

#### 3.5. Login Page

`Frontend/app/login/page.tsx`:

```tsx
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState("");

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    try {
      setError("");

      if (!credentialResponse.credential) {
        throw new Error("Google credential alınamadı");
      }

      // Backend'e ID token gönder
      const response = await authApi.googleLogin(credentialResponse.credential);

      // Context'e login yap
      login(response.data);

      if (response.data.role === "Admin") {
        router.push("/admin");
      } else {
        router.push("/profile");
      }
    } catch (err: unknown) {
      console.error("Google login error:", err);
      setError("Google ile giriş başarısız.");
    }
  };

  const handleGoogleError = () => {
    setError("Google ile giriş başarısız oldu.");
  };

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap
        text="signin_with"
        size="large"
        theme="outline"
        shape="rectangular"
      />
    </div>
  );
}
```

---

## 🔄 Mimari ve Akış

### Akış Diyagramı

```
┌─────────────┐
│   Kullanıcı │
└──────┬──────┘
       │ 1. "Google ile Giriş Yap" butonuna tıklar
       ▼
┌─────────────────────┐
│  Google OAuth Popup │
└──────┬──────────────┘
       │ 2. Google hesabı seçer ve izin verir
       ▼
┌────────────────────┐
│   Google Servers   │
└──────┬─────────────┘
       │ 3. ID Token (JWT) üretir ve Frontend'e gönderir
       ▼
┌─────────────────────┐
│  Frontend (Next.js) │
└──────┬──────────────┘
       │ 4. ID Token'ı Backend'e POST eder
       │    POST /api/Auth/google { idToken: "..." }
       ▼
┌─────────────────────┐
│  Backend (.NET)     │
│  AuthController     │
└──────┬──────────────┘
       │ 5. AuthService.GoogleLoginAsync() çağrılır
       ▼
┌──────────────────────────────────┐
│  GoogleJsonWebSignature.         │
│  ValidateAsync()                 │
└──────┬───────────────────────────┘
       │ 6. Google'ın public key'leri ile ID Token doğrulanır
       │    - Signature kontrolü
       │    - Audience (aud) kontrolü
       │    - Expiration (exp) kontrolü
       │    - Issuer (iss) kontrolü
       ▼
┌────────────────────┐
│  Token Geçerli mi? │
└──────┬─────────────┘
       │ 7a. Evet ✓
       ▼
┌─────────────────────────┐
│  Kullanıcı var mı?      │
│  (Email ile arama)      │
└──────┬──────────────────┘
       │
       ├─── 8a. Hayır → Yeni User oluştur + "Customer" rolü ata
       │
       └─── 8b. Evet → Mevcut kullanıcıyı al
       │
       ▼
┌──────────────────────┐
│  JWT Token Üret      │
│  (Kendi sistemimiz)  │
└──────┬───────────────┘
       │ 9. AuthResponse döndür
       │    { token, email, firstName, lastName, role }
       ▼
┌─────────────────────┐
│  Frontend           │
└──────┬──────────────┘
       │ 10. Token'ı cookie/localStorage'a kaydet
       │ 11. Kullanıcıyı yönlendir (profile veya admin)
       ▼
┌────────────────┐
│  Giriş Başarılı│
└────────────────┘
```

### Güvenlik Katmanları

```
Layer 1: HTTPS/TLS
    ↓
Layer 2: Google OAuth 2.0 (Google'ın güvenliği)
    ↓
Layer 3: ID Token Kriptografik Doğrulama (Backend)
    ↓
Layer 4: Email Verification Check
    ↓
Layer 5: JWT Token (Kendi sistemimiz)
    ↓
Layer 6: ASP.NET Identity & Role-Based Authorization
```

---

## 💻 Kod Açıklamaları

### Backend - ID Token Doğrulama

```csharp
var payload = await GoogleJsonWebSignature.ValidateAsync(
    request.IdToken,
    new GoogleJsonWebSignature.ValidationSettings
    {
        // Audience: Token'ın bu uygulama için üretildiğini doğrular
        Audience = new[] { googleClientId },

        // Clock Tolerance: Sunucu saati farklarını tolere eder (5 dakika)
        IssuedAtClockTolerance = TimeSpan.FromMinutes(5),
        ExpirationTimeClockTolerance = TimeSpan.FromMinutes(5)
    }
);
```

**Doğrulama Adımları:**

1. **Signature Verification**: Token'ın Google tarafından imzalandığını doğrular
2. **Issuer (iss) Check**: Token'ın Google'dan geldiğini doğrular (`accounts.google.com`)
3. **Audience (aud) Check**: Token'ın bizim Client ID'miz için üretildiğini doğrular
4. **Expiration (exp) Check**: Token'ın süresinin dolmadığını doğrular
5. **Issued At (iat) Check**: Token'ın ne zaman üretildiğini kontrol eder

### Frontend - GoogleLogin Component Props

```tsx
<GoogleLogin
  onSuccess={handleGoogleSuccess} // Başarılı giriş callback'i
  onError={handleGoogleError} // Hata callback'i
  useOneTap // One Tap özelliğini aktifleştirir
  text="signin_with" // Buton metni: "Sign in with Google"
  size="large" // Buton boyutu
  theme="outline" // Buton teması
  shape="rectangular" // Buton şekli
/>
```

**CredentialResponse Yapısı:**

```typescript
interface CredentialResponse {
  credential?: string; // ID Token (JWT)
  select_by?: string; // Seçim yöntemi ("auto" | "user" | "user_1tap")
  clientId?: string; // Google Client ID
}
```

---

## 🛠️ Sorun Giderme

### Sık Karşılaşılan Hatalar

#### 1. "JWT contains untrusted 'aud' claim"

**Neden?**

- Backend'deki Client ID ile frontend'deki Client ID eşleşmiyor
- Environment variable yanlış okunuyor

**Çözüm:**

```bash
# Backend/.env kontrol edin
GOOGLE_CLIENT_ID=737966311176-xxx.apps.googleusercontent.com  # Doğru ✓
# GOOGLE_CLIENT_ID=737966311176-xxx.apps.googleusercontent.com.apps.googleusercontent.com  # Yanlış ✗ (çift yazılmış)

# Frontend/.env.local kontrol edin
NEXT_PUBLIC_GOOGLE_CLIENT_ID=737966311176-xxx.apps.googleusercontent.com  # Aynı olmalı
```

#### 2. "The given origin is not allowed" (403 Error)

**Neden?**

- Google Cloud Console'da Authorized JavaScript origins eksik

**Çözüm:**

1. Google Cloud Console → Credentials
2. OAuth 2.0 Client ID'nizi seçin
3. "Authorized JavaScript origins" kısmına ekleyin:
   ```
   http://localhost:3000
   ```
4. Save butonuna basın
5. 1-2 dakika bekleyin (cache temizlenmesi için)

#### 3. "FedCM get() rejects with AbortError"

**Önemli mi?**

- Hayır, bu sadece tarayıcının FedCM (Federated Credential Management) özelliğiyle ilgili bir uyarıdır
- Giriş işlevselliğini etkilemez
- Chrome'un yeni bir özelliği olduğu için bazı uyarılar normal

**Çözüm:**

- Göz ardı edebilirsiniz veya `useOneTap={false}` yaparak One Tap özelliğini kapatabilirsiniz

#### 4. "Cross-Origin-Opener-Policy policy would block"

**Önemli mi?**

- Hayır, bu sadece bilgilendirme amaçlıdır
- Google OAuth popup'ı normal çalışır

**Çözüm:**

- Göz ardı edebilirsiniz

#### 5. Console.error çıktıları

```
[GSI_LOGGER]: Various messages...
```

**Önemli mi?**

- Hayır, bunlar Google'ın internal log mesajlarıdır
- Production'da gösterilmez

---

## 🚀 Üretim Ortamı İçin Öneriler

### 1. Environment Variables

**Development (.env):**

```env
GOOGLE_CLIENT_ID=dev-client-id.apps.googleusercontent.com
```

**Production (Azure App Service, AWS, etc.):**

- Environment variable'ları hosting platformunun settings panelinden ayarlayın
- `.env` dosyasını asla production'a deploy etmeyin
- `.gitignore`'a ekleyin:
  ```gitignore
  .env
  .env.local
  .env.*.local
  ```

### 2. HTTPS Zorunlu

Production'da **mutlaka HTTPS** kullanın:

```
https://yourdomain.com
```

Google Cloud Console Authorized JavaScript origins:

```
https://yourdomain.com
```

### 3. Secret Management

**Azure Key Vault / AWS Secrets Manager kullanın:**

```csharp
// Program.cs
if (builder.Environment.IsProduction())
{
    builder.Configuration.AddAzureKeyVault(
        new Uri($"https://{keyVaultName}.vault.azure.net/"),
        new DefaultAzureCredential()
    );
}
```

### 4. Rate Limiting

Google API rate limit'lerini göz önünde bulundurun:

- 10,000 requests/day (ücretsiz tier)
- Gerekirse caching mekanizması ekleyin

### 5. Logging & Monitoring

```csharp
try
{
    payload = await GoogleJsonWebSignature.ValidateAsync(...);
}
catch (Exception ex)
{
    _logger.LogError(ex, "Google token validation failed for user: {Email}", request.IdToken);
    throw;
}
```

### 6. CORS Politikası

Production için CORS'u sıkılaştırın:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("Production",
        policy => policy
            .WithOrigins("https://yourdomain.com")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});
```

### 7. Token Süreleri

```csharp
// JWT Token süresi
Expires = DateTime.UtcNow.AddMinutes(60), // 1 saat (production için uygun)

// Refresh Token ekleyin (opsiyonel)
RefreshToken = GenerateRefreshToken(),
RefreshTokenExpiry = DateTime.UtcNow.AddDays(7)
```

---

## 📊 Performans Metrikleri

### Beklenen Yanıt Süreleri

- **Google token validation**: ~200-500ms (Google API'ye request atıyor)
- **Kullanıcı oluşturma**: ~50-100ms (database write)
- **JWT token generation**: ~10-20ms
- **Toplam**: ~300-700ms (ilk giriş için kabul edilebilir)

### Optimizasyon İpuçları

1. **Caching**: Google public key'lerini cache'leyin (Google.Apis.Auth bunu otomatik yapar)
2. **Database Index**: `Users.Email` alanına index ekleyin
3. **Connection Pooling**: Database bağlantılarını pool'layın

---

## 🧪 Test Senaryoları

### Manuel Test Adımları

1. **İlk Kez Giriş**
   - Google hesabı seçin
   - Yeni kullanıcı oluşturulmalı
   - "Customer" rolü atanmalı
   - Profile sayfasına yönlendirilmeli

2. **Tekrar Giriş**
   - Aynı Google hesabı ile giriş yapın
   - Mevcut kullanıcı kullanılmalı
   - Yeni kayıt oluşturulmamalı

3. **Email Doğrulama**
   - Doğrulanmamış email ile hesap test edin (zor)
   - Hata mesajı almalısınız

4. **Token Süresi**
   - Çok eski bir token ile test edin
   - "Token expired" hatası almalısınız

### Unit Test Örneği

```csharp
[Fact]
public async Task GoogleLogin_ValidToken_ReturnsAuthResponse()
{
    // Arrange
    var mockToken = "valid-google-id-token";
    var request = new GoogleLoginRequest { IdToken = mockToken };

    // Act
    var result = await _authService.GoogleLoginAsync(request);

    // Assert
    Assert.NotNull(result);
    Assert.NotEmpty(result.Token);
    Assert.Equal("test@gmail.com", result.Email);
}
```

---

## 📚 Ek Kaynaklar

- [Google Identity Documentation](https://developers.google.com/identity)
- [Google.Apis.Auth NuGet Package](https://www.nuget.org/packages/Google.Apis.Auth/)
- [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google)
- [JWT.io - Token Debugger](https://jwt.io/)

---

## 📝 Sürüm Geçmişi

### v1.0.0 (27 Ocak 2026)

- ✅ Google OAuth 2.0 entegrasyonu tamamlandı
- ✅ ID token doğrulama implementasyonu
- ✅ Email verification kontrolü eklendi
- ✅ Otomatik kullanıcı oluşturma
- ✅ JWT token entegrasyonu
- ✅ One Tap sign-in desteği

---

## 🤝 Katkıda Bulunma

Öneriler ve geliştirmeler için:

1. Issue açın
2. Pull request gönderin
3. Güvenlik açığı bulursanız özel olarak bildirin

---

## 📄 Lisans

Bu proje MIT lisansı ile lisanslanmıştır.

---

**Geliştirici Notları:**

- ✅ Güvenlik en önemli öncelik
- ✅ Environment variable'lar asla commit edilmemeli
- ✅ Token'lar log'lanmamalı
- ✅ Error mesajları kullanıcıya hassas bilgi vermemeli
- ✅ Rate limiting ve monitoring eklenmeliçalıştırmalısınız
