# Phase 10: Kupon & İndirim Sistemi - Implementation Plan

## 🎯 Amaç

E-ticaret platformuna kapsamlı bir kupon ve indirim sistemi eklemek, kullanıcıların sepet tutarlarına indirim uygulamalarını sağlamak ve admin kullanıcılarının kuponları yönetebilmesini mağlumun kılmak.

## 📋 Gereksinimler

### Functional Requirements

- Farklı tiplerde kupon desteği (yüzde, sabit tutar, ücretsiz kargo, hediye ürün)
- Minimum sepet tutarı kontrolü
- Kullanım limiti takibi
- Geçerlilik tarihi kontrolü
- Kategori/Ürün bazlı özel kuponlar
- Kullanıcı kupon geçmişi
- Admin kupon CRUD işlemleri

### Non-Functional Requirements

- Performans: Kupon validasyonu < 100ms
- Güvenlik: Kupon kodları case-insensitive
- Usability: Kullanıcı dostu hata mesajları
- Scalability: Yüksek hacimli kupon kullanımına hazır

## 🏗️ Sistem Mimarisi

### Backend Architecture

```
Controllers/
├── CouponController.cs          # Kupon endpoint'leri
│   ├── POST /validate           # Kupon validasyonu
│   ├── POST /apply              # Kupon uygulama
│   ├── GET /active              # Aktif kuponlar
│   └── Admin endpoints (CRUD)

Services/
├── CouponService.cs             # Business logic
│   ├── ValidateCouponAsync()
│   ├── ApplyCouponAsync()
│   ├── CalculateDiscount()
│   └── CRUD operations

Domain/Entities/
├── Coupon.cs                    # Kupon entity
│   ├── Code (string)
│   ├── Type (enum)
│   ├── Value (decimal)
│   ├── MinimumAmount
│   ├── MaxUsage / CurrentUsage
│   ├── StartDate / ExpiryDate
│   └── CategoryId / ProductId (optional)
└── UserCoupon.cs                # Kullanım geçmişi
    ├── UserId
    ├── CouponId
    ├── UsedAt
    └── DiscountAmount
```

### Frontend Architecture

```
Pages/
├── /coupons/page.tsx            # Kullanılabilir kuponlar
├── /admin/coupons/page.tsx      # Admin kupon yönetimi
└── /cart/page.tsx               # Kupon uygulama UI

Context/
└── CartContext.tsx              # Kupon state management
    ├── applyCoupon()
    ├── removeCoupon()
    └── Cart state (subtotal, discount, total)

API/
└── lib/api.ts
    └── couponApi
        ├── validate()
        ├── apply()
        ├── getActive()
        └── Admin CRUD methods
```

## 🔄 Veri Akışı

### Kupon Uygulama Akışı

```
1. Kullanıcı Aksiyon
   └─> Input'a kupon kodu girer
       └─> "Uygula" butonuna tıklar

2. Frontend Validation
   └─> Kod boş değil mi?
       └─> API request gönder

3. Backend Validation
   ├─> Kupon var mı? (DB lookup)
   ├─> Aktif mi? (IsActive)
   ├─> Tarih geçerli mi? (StartDate/ExpiryDate)
   ├─> Kullanım limiti doldu mu? (CurrentUsage < MaxUsage)
   ├─> Minimum tutar koşulu sağlanıyor mu?
   └─> İndirim hesapla (CalculateDiscount)

4. Database Update
   ├─> UserCoupon kaydı oluştur
   └─> Coupon.CurrentUsage++

5. Frontend Update
   ├─> Cart state güncelle
   ├─> Subtotal / Discount / Total göster
   └─> Success mesajı
```

## 💾 Database Schema

### Coupons Table

```sql
CREATE TABLE "Coupons" (
    "Id" uuid PRIMARY KEY,
    "Code" text NOT NULL,              -- Kupon kodu (UPPERCASE)
    "Type" integer NOT NULL,           -- 0:Percentage, 1:Fixed, 2:FreeShip, 3:Gift
    "Value" numeric NOT NULL,          -- İndirim değeri
    "MinimumAmount" numeric NOT NULL,  -- Min sepet tutarı
    "MaxUsage" integer NOT NULL,       -- Max kullanım
    "CurrentUsage" integer NOT NULL,   -- Mevcut kullanım
    "StartDate" timestamptz NOT NULL,
    "ExpiryDate" timestamptz NOT NULL,
    "IsActive" boolean NOT NULL,
    "CategoryId" uuid NULL,            -- Opsiyonel kategori kısıtı
    "ProductId" uuid NULL,             -- Opsiyonel ürün kısıtı
    "CreatedAt" timestamptz NOT NULL,
    "UpdatedAt" timestamptz NULL
);
```

### UserCoupons Table

```sql
CREATE TABLE "UserCoupons" (
    "Id" uuid PRIMARY KEY,
    "UserId" text NOT NULL,
    "CouponId" uuid NOT NULL,
    "UsedAt" timestamptz NOT NULL,
    "DiscountAmount" numeric NOT NULL,
    "CreatedAt" timestamptz NOT NULL,
    "UpdatedAt" timestamptz NULL,
    FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id"),
    FOREIGN KEY ("CouponId") REFERENCES "Coupons" ("Id")
);
```

## 🎨 UI/UX Tasarımı

### Sepet Sayfası - Kupon Bölümü

```
┌─────────────────────────────────────┐
│ 📋 İndirim Kuponu                   │
├─────────────────────────────────────┤
│                                     │
│ [INDIRIM10        ] [Uygula]       │
│                                     │
│ ✓ Kupon başarıyla uygulandı        │
│                                     │
└─────────────────────────────────────┘

Ara Toplam:     2,000₺
İndirim:         -200₺  (Yeşil)
Toplam:         1,800₺  (Büyük, kırmızı)
```

### Kuponlar Sayfası

```
┌──────────────────────────────────────────┐
│  Kullanılabilir Kuponlar                 │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────────┐  ┌───────────────┐│
│  │  %10 İNDİRİM     │  │  50₺ İNDİRİM  ││
│  │  INDIRIM10       │  │  YENI50       ││
│  │  Min: 1000₺      │  │  Min: 500₺    ││
│  │  [Kopyala]       │  │  [Kopyala]    ││
│  └──────────────────┘  └───────────────┘│
│                                          │
└──────────────────────────────────────────┘
```

### Admin Kupon Yönetimi

```
┌─────────────────────────────────────────────┐
│  Kupon Yönetimi             [+ Yeni Kupon] │
├─────────────────────────────────────────────┤
│ Kod      | Tip    | Değer | Kullanım | ... │
├─────────────────────────────────────────────┤
│ INDIRIM10| %      | 10    | 5/100    | ⚙️ 🗑️│
│ YENI50   | Sabit  | 50₺   | 2/50     | ⚙️ 🗑️│
└─────────────────────────────────────────────┘
```

## 🔌 API Endpoints

### Public Endpoints

```typescript
GET / api / Coupon / active;
// Response: Coupon[]

POST / api / Coupon / validate;
// Body: { code: string, cartTotal: number }
// Response: { isValid: boolean, message: string, discountAmount: number }

POST / api / Coupon / apply;
// Body: { code: string, cartTotal: number }
// Response: { isValid: boolean, message: string, discountAmount: number }

GET / api / Coupon / history;
// Response: UserCoupon[]
```

### Admin Endpoints

```typescript
POST / api / Coupon;
// Body: CreateCouponDto
// Response: CouponDto

GET / api / Coupon;
// Response: Coupon[]

GET / api / Coupon / { id };
// Response: CouponDto

PUT / api / Coupon / { id };
// Body: UpdateCouponDto
// Response: CouponDto

DELETE / api / Coupon / { id };
// Response: 204 No Content
```

## 🧪 Test Senaryoları

### Backend Tests

```csharp
[Fact]
public async Task ValidateCoupon_ValidCode_ReturnsSuccess()
{
    // Arrange
    var code = "INDIRIM10";
    var cartTotal = 2000m;

    // Act
    var result = await _service.ValidateCouponAsync(code, cartTotal, userId);

    // Assert
    Assert.True(result.IsValid);
    Assert.Equal(200m, result.DiscountAmount); // %10 of 2000
}

[Fact]
public async Task ValidateCoupon_ExpiredCoupon_ReturnsError()
{
    // Kuponun süresi dolmuşsa
    Assert.False(result.IsValid);
    Assert.Contains("süresi dolmuş", result.Message);
}

[Fact]
public async Task ApplyCoupon_IncreasesUsageCount()
{
    // Kupon kullanıldığında CurrentUsage artar
    var before = coupon.CurrentUsage;
    await _service.ApplyCouponAsync(code, cartTotal, userId);
    var after = await GetCouponUsage(code);

    Assert.Equal(before + 1, after);
}
```

### Frontend Tests

```typescript
describe("Coupon Application", () => {
  it("should apply valid coupon successfully", async () => {
    const result = await applyCoupon("INDIRIM10");
    expect(result.success).toBe(true);
    expect(cart.discountAmount).toBeGreaterThan(0);
  });

  it("should show error for invalid coupon", async () => {
    const result = await applyCoupon("INVALID");
    expect(result.success).toBe(false);
    expect(result.message).toContain("bulunamadı");
  });
});
```

## ⚠️ Edge Cases & Error Handling

### Potential Issues

1. **Race Condition**: Aynı anda birden fazla kullanıcı son kuponu kullanırsa?
   - Solution: Database transaction + optimistic locking

2. **Cart Update**: Kupon uygulandıktan sonra sepet güncellenirse?
   - Solution: Minimum tutar kontrolü her sepet değişikliğinde

3. **Case Sensitivity**: "indirim10" vs "INDIRIM10"
   - Solution: Backend'de ToUpper() ile normalizasyon

4. **Network Failure**: Apply isteği gönderildi ama yanıt alınamadı?
   - Solution: İdempotent endpoint + retry logic

### Validation Rules

```typescript
interface CouponValidation {
  code: string; // Required, min 3 chars
  type: CouponType; // Enum validation
  value: number; // > 0
  minimumAmount: number; // >= 0
  maxUsage: number; // > 0
  startDate: Date; // <= expiryDate
  expiryDate: Date; // > today
}
```

## 📊 Metrics & Analytics

### Tracking Metrics

- Kupon kullanım oranı: `UsedCoupons / TotalCoupons`
- Ortalama indirim tutarı: `AVG(DiscountAmount)`
- En popüler kuponlar: `COUNT(*) GROUP BY CouponCode`
- Dönüşüm oranı artışı: `With Coupon vs Without`

### Business KPIs

- Sepet değeri artışı (kupon sayesinde)
- Yeni müşteri kazanımı (hoşgeldin kuponları)
- Tekrar satın alma oranı
- Kategori bazlı satış artışı

## 🚀 Deployment Checklist

### Pre-Deployment

- [x] Migration dosyaları oluşturuldu
- [x] Seed data hazır (test kuponları)
- [x] API endpoint'leri test edildi
- [x] Frontend UI responsive
- [x] Error handling eksiksiz
- [x] Validation rules tamamlandı

### Post-Deployment

- [ ] Production kuponları oluştur
- [ ] Monitoring kurulumu (Application Insights)
- [ ] Performance test (1000+ eş zamanlı kullanım)
- [ ] A/B testing hazırlığı
- [ ] Email template'leri (kupon bildirimleri için)

## 🔐 Security Considerations

### Threats & Mitigations

1. **Brute Force**: Rastgele kod denemeleri
   - Mitigation: Rate limiting (5 deneme/dakika)

2. **Code Guessing**: Tahmin edilebilir kodlar
   - Mitigation: Karmaşık kod önerileri (UI hint)

3. **Double Usage**: Aynı kullanıcı birden fazla kullanım
   - Mitigation: UserCoupon tablosu + unique constraint

4. **SQL Injection**: Kod input'u
   - Mitigation: Parametreli sorgular (EF Core)

## 📚 Bağımlılıklar

### NuGet Packages

- `Microsoft.EntityFrameworkCore` (v8.0.0)
- `Npgsql.EntityFrameworkCore.PostgreSQL` (v8.0.0)

### NPM Packages

- `react-icons` (v5.0.1) - FaTag, FaCopy icons
- `axios` (v1.6.5) - API requests

## 🎓 Öğrenilen Dersler

### Best Practices Applied

1. **DRY Principle**: Helper methods (MapToDto, CalculateDiscount)
2. **Single Responsibility**: Her servis tek bir iş yapar
3. **Clean Architecture**: Katmanlar arası net ayrım
4. **SOLID**: Interface segregation, dependency injection

### Gelecek İyileştirmeler

1. Kupon kombinasyonu (birden fazla kupon)
2. Referral kuponları (arkadaşını davet et)
3. Dinamik kupon oluşturma (AI tabanlı)
4. Gamification (puzzle kuponları)
5. Social media entegrasyonu (paylaş kazan)

## 📅 Timeline

| Gün | Aktivite                   | Durum |
| --- | -------------------------- | ----- |
| 1   | Backend Entity & Migration | ✅    |
| 2   | Service & Controller       | ✅    |
| 3   | Frontend Cart Integration  | ✅    |
| 4   | Kuponlar Sayfası           | ✅    |
| 5   | Admin Panel                | ✅    |
| 6   | Testing & Bug Fixes        | ✅    |

**Toplam Süre**: 6 gün
**Gerçek Süre**: 6 gün (tahmin doğru!)

---

**Hazırlayan**: GitHub Copilot  
**Tarih**: 28 Ocak 2026  
**Version**: 1.0
