# Phase 17: Ürün Önerileri & Kişiselleştirme - Backend Tamamlandı

## 📋 Genel Bakış

Phase 17'de akıllı ürün öneri sistemi backend altyapısı tamamlandı. Kullanıcı davranışlarına göre kişiselleştirilmiş öneriler sunabilecek sistem hazır.

## ✅ Tamamlanan İşlemler - Backend

### 1. Veritabanı Entity'leri

#### ViewHistory.cs

- Purpose: Kullanıcı görüntüleme geçmişi takibi
- Fields:
  - UserId (string?, nullable for guests)
  - SessionId (string?, for guest users)
  - ProductId (Guid)
  - ViewedAt (DateTime)
  - IpAddress (string?)
  - UserAgent (string?)
- Relations: User, Product

### 2. DTOs

#### RecommendedProductDto.cs

```csharp
- Id, Name, Slug
- Price, ImageUrl
- CategoryName, BrandName
- AverageRating, ReviewCount, Stock
- RecommendationReason (string) // Öneri sebebi
```

#### ProductRecommendationsDto.cs

```csharp
- SimilarProducts: List<RecommendedProductDto>
- FrequentlyBoughtTogether: List<RecommendedProductDto>
- PersonalizedForYou: List<RecommendedProductDto>
```

### 3. Service Layer

#### IRecommendationService Interface

5 metod:

1. **GetSimilarProductsAsync** - Benzer ürünler
2. **GetFrequentlyBoughtTogetherAsync** - Sıkça birlikte alınanlar
3. **GetPersonalizedRecommendationsAsync** - Kişiselleştirilmiş öneriler
4. **GetAllRecommendationsAsync** - Tüm öneriler
5. **TrackProductViewAsync** - Görüntüleme kaydı

#### RecommendationService Implementation (~340 LOC)

**1. Benzer Ürünler (Similar Products)**

- Algoritma:
  - Aynı kategori
  - Benzer fiyat aralığı (±30%)
  - Stokta mevcut
  - Yüksek rating öncelikli
- Örnek Sonuç: 6 ürün

**2. Sıkça Birlikte Alınanlar (Frequently Bought Together)**

- Algoritma:
  - Aynı siparişte birlikte alınan ürünler analizi
  - OrderItems join query
  - Frekans bazlı sıralama
- Örnek Sonuç: 6 ürün

**3. Kişiselleştirilmiş Öneriler (Personalized)**

- Veri Kaynakları:
  a) **Görüntüleme Geçmişi** (Son 30 gün)
  - Görüntülenen ürünlerin kategorilerinden öneriler
  - Yüksek rating ve review sayısı öncelikli

  b) **Wishlist Analizi** (Sadece kayıtlı kullanıcılar)
  - Favori ürünlerin kategorilerinden öneriler
  - Çakışma kontrolü (duplicate engelleme)

  c) **Popüler Ürünler** (Fallback)
  - Kalan slot için en çok yorumlanan ürünler
  - Yüksek rating öncelikli

- Örnek Sonuç: 12 ürün (dinamik dağılım)

**4. Görüntüleme Takibi**

- Duplicate önleme: 1 saat içinde tekrar kaydetme
- Eski kayıt temizleme: 90 gün geçmiş otomatik silinir
- Guest support: SessionId ile misafir kullanıcılar
- IP ve UserAgent tracking

### 4. API Endpoints

#### RecommendationsController (5 endpoint)

```http
GET /api/Recommendations/similar/{productId}?count=6
GET /api/Recommendations/frequently-bought-together/{productId}?count=6
GET /api/Recommendations/personalized?sessionId=abc&count=12
GET /api/Recommendations/all/{productId}?sessionId=abc
POST /api/Recommendations/track-view/{productId}
```

**Örnekler:**

```bash
# Benzer ürünler
curl http://localhost:5162/api/Recommendations/similar/{productId}?count=6

# Sıkça birlikte alınanlar
curl http://localhost:5162/api/Recommendations/frequently-bought-together/{productId}

# Kişisel öneriler (giriş yapmış)
curl -H "Authorization: Bearer {token}" \
     http://localhost:5162/api/Recommendations/personalized?count=12

# Kişisel öneriler (misafir)
curl http://localhost:5162/api/Recommendations/personalized?sessionId=guest_123

# Tüm öneriler
curl http://localhost:5162/api/Recommendations/all/{productId}?sessionId=guest_123

# Görüntüleme kaydı
curl -X POST http://localhost:5162/api/Recommendations/track-view/{productId} \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"guest_123"}'
```

### 5. Veritabanı Migration

**Migration:** `20260131205856_AddViewHistoryAndRecommendations`

**SQL Schema:**

```sql
CREATE TABLE "ViewHistories" (
  "Id" uuid PRIMARY KEY,
  "UserId" text NULL,
  "SessionId" text NULL,
  "ProductId" uuid NOT NULL,
  "ViewedAt" timestamp with time zone NOT NULL,
  "IpAddress" text NULL,
  "UserAgent" text NULL,
  "CreatedAt" timestamp with time zone NOT NULL,
  "UpdatedAt" timestamp with time zone NULL,
  FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id"),
  FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_ViewHistories_ProductId" ON "ViewHistories" ("ProductId");
CREATE INDEX "IX_ViewHistories_UserId" ON "ViewHistories" ("UserId");
```

**Durum**: ✅ Başarıyla uygulandı

### 6. DependencyInjection

```csharp
services.AddScoped<IRecommendationService, RecommendationService>();
```

## 🔧 Düzeltilen Hatalar

### 1. Product.Reviews Navigation Property

**Sorun:** Product entity'de Reviews collection yoktu
**Çözüm:** `public List<Review> Reviews { get; set; } = new();` eklendi

### 2. ViewHistory.UserId Type Mismatch

**Sorun:** UserId Guid olarak tanımlandı ama User.Id string (Identity)
**Çözüm:** `public string? UserId { get; set; }` olarak değiştirildi

### 3. Wishlist.UserId String Comparison

**Sorun:** Guid userId ile string UserId karşılaştırması
**Çözüm:** `userId.Value.ToString()` kullanıldı

### 4. Compare Page Syntax Error

**Sorun:** Suspense boundary düzenleme hatası
**Çözüm:** Component hiyerarşisi düzeltildi:

```typescript
function ComparisonPageContent() {
  const searchParams = useSearchParams();
  // ... content
}

export default function ComparePage() {
  return (
    <Suspense>
      <ComparisonPageContent />
    </Suspense>
  );
}
```

## 📊 Algoritma Detayları

### Benzer Ürünler

```
1. Ürünü al
2. Fiyat aralığı hesapla (±30%)
3. Aynı kategoriden filtrele
4. Fiyat aralığında filtrele
5. Stokta olanları al
6. Rating'e göre sırala
7. En iyi 6'yı döndür
```

### Sıkça Birlikte Alınanlar

```
1. Ürünün olduğu siparişleri bul
2. Aynı siparişlerdeki diğer ürünleri getir
3. Frekansa göre grupla
4. Sayıya göre sırala
5. En sık alınan 6'yı döndür
```

### Kişiselleştirilmiş

```
1. Son 30 günlük görüntülemeleri al
2. Görüntülenen kategorileri bul
3. O kategorilerden öneri ekle (count/2)
4. Wishlist kategorilerini al
5. O kategorilerden öneri ekle (count/4)
6. Kalan slotları popüler ürünlerle doldur
```

## 🎯 Öneri Sebepleri

Sistem her öneri için neden önerildiğini belirtir:

- "Benzer Ürün"
- "Sıkça Birlikte Alınan"
- "Görüntüleme Geçmişinize Göre"
- "Favori Listenize Göre"
- "Popüler Ürünler"
- "Önerilen Ürünler"

## 📈 Performans Optimizasyonları

1. **Eager Loading:** Include() ile N+1 problemi önlendi
2. **Indexing:** ProductId ve UserId index'leri
3. **Duplicate Prevention:** 1 saat içinde tekrar tracking yok
4. **Old Data Cleanup:** 90 gün önceki kayıtlar otomatik silinir
5. **Fallback Strategy:** Hata durumunda popüler ürünler döner

## 🔄 Sonraki Adımlar - Frontend (Phase 17.1)

### Gerekli Bileşenler

1. **ProductCarousel.tsx** - Yatay kaydırılabilir ürün listesi
2. **SimilarProducts.tsx** - "Benzer Ürünler" bölümü
3. **FrequentlyBoughtTogether.tsx** - "Sıkça Birlikte Alınanlar"
4. **PersonalizedRecommendations.tsx** - "Size Özel" bölümü
5. **ViewHistoryTracker.tsx** - Otomatik tracking hook

### Entegrasyon Noktaları

- Ürün detay sayfası (SimilarProducts + FrequentlyBoughtTogether)
- Ana sayfa (PersonalizedRecommendations)
- Sepet sayfası (FrequentlyBoughtTogether)
- useEffect ile otomatik view tracking

## 📝 API Response Örnekleri

### Similar Products Response

```json
[
  {
    "id": "...",
    "name": "iPhone 14 Pro",
    "slug": "iphone-14-pro",
    "price": 45000,
    "imageUrl": "...",
    "categoryName": "Cep Telefonu",
    "brandName": "Apple",
    "averageRating": 4.8,
    "reviewCount": 156,
    "stock": 25,
    "recommendationReason": "Benzer Ürün"
  }
]
```

### All Recommendations Response

```json
{
  "similarProducts": [...],
  "frequentlyBoughtTogether": [...],
  "personalizedForYou": [...]
}
```

## ✅ Test Edilenler

- [x] Migration uygulandı
- [x] Backend build başarılı
- [x] Frontend build başarılı (compare page düzeltildi)
- [x] ViewHistory entity doğru tip
- [x] RecommendationService compile oldu
- [x] API endpoints kayıtlı

## 🚀 Durum

**Backend:** ✅ TAMAMLANDI
**Frontend:** 🔄 Devam edecek (Phase 17.1)

---

**Tarih:** 31 Ocak 2026
**Tamamlanan Kod:** ~500 LOC (Backend)
**API Endpoints:** 5 adet
**Migration:** Uygulandı
