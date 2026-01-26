# Cookie Kullanım Kılavuzu

Bu projede cookie yönetimi için `js-cookie` kütüphanesi kullanılmaktadır. Aşağıda mevcut uygulamanın nasıl çalıştığı, güvenlik değerlendirmesi ve production için önerilen değişiklikler yer alıyor.

## 📦 Kurulum

```bash
npm install js-cookie @types/js-cookie
```

## 🔧 Mevcut Uygulama (Ne yapıyor?)

- Frontend `lib/cookieStorage.ts` içinde bir yardımcı (helper) bulunmaktadır. Bu helper, token (`auth_token`) ve kullanıcı verisini (`user_data`) client-side cookie olarak yönetir.
- API istekleri `lib/api.ts` içinde oluşturulan Axios `api` instance'ına yapılır. Bu instance'ın request interceptor'ı her istekte `cookieStorage.getToken()` ile token'ı okuyup `Authorization: Bearer <token>` header'ına ekler.

Kısa örnekler:

```typescript
// cookieStorage (örnek)
cookieStorage.setToken("your-jwt-token", 7); // token'ı cookie'ye kaydeder (7 gün)
const token = cookieStorage.getToken(); // cookie'den token okur
cookieStorage.clearAuth(); // token + user verisini siler

// api.ts (ön işlemci)
api.interceptors.request.use((config) => {
  const token = cookieStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

## 🛡️ Güvenlik Değerlendirmesi

- Mevcut: Client-side cookie (js-cookie) ile token saklanıyor.
  - ✅ SameSite: 'strict' kullanılıyor (CSRF riskini azaltır).
  - ✅ `secure` flag production'da etkinleştiriliyor (HTTPS gerektirir).
  - ❌ Ancak JavaScript erişimi mümkün olduğundan XSS riskine açıktır. Eğer sayfada XSS zaafiyeti olursa token çalınabilir.

- Önerilen (daha güvenli): HTTP-only cookie ile token kaydetmek. Bu sayede JavaScript üzerinden okunamaz (XSS riskini minimize eder). Ancak HTTP-only cookie'ler CSRF riskini tekrar gündeme getirir; bu nedenle:
  - Use SameSite=strict or Lax (depending on your need)
  - Consider adding CSRF tokens for state-changing requests (POST/PUT/DELETE) or use double-submit cookie pattern

## ✅ Production için Önerilen Akış (Örnekler & Kod)

1. Backend login endpoint'i JWT üretip HTTP-only cookie olarak gönderir:

```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    var result = await _authService.LoginAsync(request);

    Response.Cookies.Append("auth_token", result.Token, new CookieOptions
    {
        HttpOnly = true, // JavaScript erişemez
        Secure = true,   // Sadece HTTPS (production)
        SameSite = SameSiteMode.Strict,
        Expires = DateTimeOffset.UtcNow.AddDays(7)
    });

    return Ok(new { success = true });
}
```

2. Frontend Axios: cookie'leri otomatik gönderecek şekilde yapılandırın:

```typescript
// lib/api.ts
authApi.defaults.withCredentials = true;
api.defaults.withCredentials = true; // HTTP-only cookie'lerin gönderilmesi için (CORS ayarları ile uyumlu olmalı)
```

3. Backend: CORS ve cookie okuma

- CORS policy'nizde credentials'a izin verin ve origin'i açıkça belirtin:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowCredentials()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

app.UseCors("DevCors");
```

- JWT middleware'ini cookie'den token okumak üzere genişletebilirsiniz (ör. JwtBearer `OnMessageReceived`):

```csharp
.AddJwtBearer(options =>
{
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (context.Request.Cookies.ContainsKey("auth_token"))
            {
                context.Token = context.Request.Cookies["auth_token"];
            }
            return Task.CompletedTask;
        }
    };
});
```

4. CSRF önlemleri

- `SameSite=strict`/`lax` ile büyük ölçüde koruma sağlanır.
- Çok kritik işlemler için CSRF token (double submit) veya custom header kontrolü ekleyin.

## 🧭 Geçiş Adımları (Checklist)

- [ ] Backend: Login endpoint'i HTTP-only cookie eklesin
- [ ] Backend: JwtBearer olayına cookie üzerinden token alma desteği ekleyin
- [ ] Backend: CORS policy `AllowCredentials()` ile güncellensin ve origin'ler açıkça tanımlansın
- [ ] Frontend: `api.defaults.withCredentials = true` ayarlansın
- [ ] Frontend: `cookieStorage` helper'ını auth için read-only (HTTP-only) fallback ile güncelleyin (optional)
- [ ] Test: Login, token renewal, logout akışlarını test edin

## 🔍 Debug & İnceleme

**Güncel (Client-side cookie) debug:**

1. F12 → Application → Cookies → `auth_token`, `user_data` kontrol edin
2. Console:

```javascript
import { cookieStorage } from "@/lib/cookieStorage";
console.log(cookieStorage.getToken());
console.log(cookieStorage.getUser());
```

**HTTP-only cookie ile debug:**

- HTTP-only cookie JavaScript tarafından okunamaz (`cookieStorage.getToken()` boş döner). Sunucuya gelen isteklerde oturum doğrulama yapılıyorsa cookie devreye girer.
- Network tab: request headers/cookies sekmesinde cookie'lerin gönderilip gönderilmediğini kontrol edin (withCredentials=true olmalı).

## 🔁 Mevcut Kod Parçacıkları (Referans)

- `lib/cookieStorage.ts` — token ve user verisini client-side cookie olarak yönetir (Secure ve SameSite: strict kullanır).
- `lib/api.ts` — request interceptor her isteğe `Authorization` header'ı ekler (mevcut akış için). Eğer production'da HTTP-only cookie kullanırsanız bu header'a artık gerek kalmayabilir (sunucu cookie'den token okuyorsa).

## 🎯 Özet

- Şu an: _client-side_ cookie ile token saklanıyor (js-cookie).
- Daha güvenli: _HTTP-only cookie_ kullanımı önerilir — backend'de cookie ekleyin, frontend'de `withCredentials` açın, backend CORS ve JwtBearer'ı buna göre yapılandırın.

Eğer istersen, production-ready adımların kod değişikliklerini ben uygulayıp test edebilirim (backend login, JwtBearer olayları, frontend axios config ve e2e test önerileri).
