# Cookie Kullanım Kılavuzu

Bu projede cookie yönetimi için `js-cookie` kütüphanesi kullanılmaktadır.

## 📦 Kurulum

```bash
npm install js-cookie @types/js-cookie
```

## 🔧 Kullanım

### 1. **cookieStorage Helper** (`lib/cookieStorage.ts`)

Tüm cookie işlemleri için merkezi helper:

```typescript
import { cookieStorage } from "@/lib/cookieStorage";

// Token kaydet (7 gün geçerli)
cookieStorage.setToken("your-jwt-token", 7);

// Token oku
const token = cookieStorage.getToken();

// Token sil
cookieStorage.removeToken();

// Kullanıcı bilgisi kaydet
cookieStorage.setUser({ name: "John", email: "john@example.com" });

// Kullanıcı bilgisi oku
const user = cookieStorage.getUser();

// Tüm auth cookie'lerini temizle
cookieStorage.clearAuth();

// Genel cookie işlemleri
cookieStorage.set("key", "value", { expires: 30 });
const value = cookieStorage.get("key");
cookieStorage.remove("key");
```

### 2. **API Client** (`lib/api.ts`)

Otomatik token ekleme ve error handling:

```typescript
import { authApi, productsApi } from "@/lib/api";

// Login
const response = await authApi.login("email@example.com", "password");

// Ürünleri getir (otomatik token eklenir)
const products = await productsApi.getAll();

// Ürün oluştur (admin - otomatik token eklenir)
const newProduct = await productsApi.create(productData);
```

### 3. **AuthContext Entegrasyonu**

AuthContext artık cookie kullanıyor:

```typescript
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { user, login, logout } = useAuth();

  // Login (otomatik cookie'ye kaydeder)
  const handleLogin = async () => {
    const response = await authApi.login(email, password);
    login(response.data); // Cookie'ye kaydedilir
  };

  // Logout (cookie'leri temizler)
  const handleLogout = () => {
    logout();
  };
}
```

## 🛡️ Güvenlik Özellikleri

### Client-Side Cookies (Mevcut)

- ✅ Otomatik expire (7 gün)
- ✅ SameSite: 'strict' (CSRF koruması)
- ✅ Secure flag (Production'da HTTPS only)
- ❌ JavaScript'ten erişilebilir (XSS riski var)

### HTTP-Only Cookies (Önerilen - Production için)

Daha güvenli bir yaklaşım için backend'den HTTP-only cookie ayarlayın:

**Backend (C#) Örneği:**

```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    var result = await _authService.LoginAsync(request);

    // HTTP-only cookie ayarla
    Response.Cookies.Append("auth_token", result.Token, new CookieOptions
    {
        HttpOnly = true,  // JavaScript erişemez (XSS koruması)
        Secure = true,    // Sadece HTTPS
        SameSite = SameSiteMode.Strict,
        Expires = DateTimeOffset.UtcNow.AddDays(7)
    });

    return Ok(new { success = true });
}
```

**Frontend Axios Config:**

```typescript
api.defaults.withCredentials = true; // Cookie'leri otomatik gönder
```

## 📝 Cookie vs LocalStorage vs SessionStorage

| Özellik             | Cookie             | LocalStorage     | SessionStorage  |
| ------------------- | ------------------ | ---------------- | --------------- |
| Kapasite            | ~4KB               | ~5-10MB          | ~5-10MB         |
| Expire              | Ayarlanabilir      | Manuel temizleme | Sekme kapanınca |
| HTTP ile gönderilir | ✅ Evet            | ❌ Hayır         | ❌ Hayır        |
| XSS koruması        | ✅ (HTTP-only ile) | ❌ Hayır         | ❌ Hayır        |
| CSRF koruması       | ⚠️ Token gerekli   | ✅ Otomatik      | ✅ Otomatik     |

## 🎯 Ne Zaman Hangisini Kullanmalı?

### Cookie Kullan:

- ✅ Authentication token (özellikle HTTP-only ile)
- ✅ Kullanıcı tercihleri (theme, language)
- ✅ Shopping cart (sepet)
- ✅ Session tracking

### LocalStorage Kullan:

- ✅ Offline data caching
- ✅ Büyük JSON verileri
- ✅ User preferences (non-sensitive)

### SessionStorage Kullan:

- ✅ Form draft'ları
- ✅ Geçici wizard/stepper verileri
- ✅ Single-session data

## 🔍 Debug ve İnceleme

**Chrome DevTools:**

1. F12 → Application → Cookies
2. Tüm cookie'leri görebilirsiniz

**Console'da Test:**

```javascript
// Tüm cookie'leri göster
document.cookie;

// Cookie'leri kontrol et
import { cookieStorage } from "@/lib/cookieStorage";
console.log(cookieStorage.getAll());
```

## 🚀 Kullanım Örnekleri

### Sepet Verisi Cookie'de Sakla

```typescript
import { cookieStorage } from "@/lib/cookieStorage";

// Sepeti kaydet (30 gün)
cookieStorage.set("cart", cartItems, { expires: 30 });

// Sepeti oku
const cart = cookieStorage.get("cart") || [];

// Sepeti güncelle
const updatedCart = [...cart, newItem];
cookieStorage.set("cart", updatedCart, { expires: 30 });
```

### Kullanıcı Tercihlerini Sakla

```typescript
// Theme kaydet
cookieStorage.set("theme", "dark", { expires: 365 });

// Language kaydet
cookieStorage.set("language", "tr", { expires: 365 });

// Tercihleri oku
const theme = cookieStorage.get("theme") || "light";
const language = cookieStorage.get("language") || "tr";
```

### Remember Me Özelliği

```typescript
const handleLogin = async (rememberMe: boolean) => {
  const response = await authApi.login(email, password);

  // Remember me işaretliyse 30 gün, değilse 1 gün
  const expires = rememberMe ? 30 : 1;
  cookieStorage.setToken(response.data.token, expires);
  cookieStorage.setUser(response.data, expires);
};
```

## ⚙️ Environment Variables

`.env.local` dosyasında:

```env
NEXT_PUBLIC_API_URL=http://localhost:5162
NODE_ENV=development
```

Production'da `secure` flag otomatik aktif olur.
