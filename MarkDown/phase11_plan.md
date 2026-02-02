# Phase 11: Gelişmiş Sepet Özellikleri - Implementation Plan

## 🎯 Amaç

Sepet deneyimini geliştirmek, kullanıcıların sepetlerini daha kolay yönetmelerini sağlamak ve dönüşüm oranını artırmak.

## 📋 Özellikler

### 1. Mini Cart (Sepet Önizlemesi) 🔴

**Öncelik**: Yüksek

**Açıklama**: Navbar'da hover/click ile açılan küçük sepet önizlemesi

**Gereksinimler**:

- Navbar'da sepet ikonuna tıklandığında dropdown açılır
- Son 3 ürün gösterilir
- Toplam fiyat gösterilir
- "Sepete Git" ve "Ödemeye Geç" butonları
- Animasyonlu açılış/kapanış

**UI Tasarımı**:

```
┌─────────────────────────────┐
│ Sepetiniz (3 ürün)         │
├─────────────────────────────┤
│ [IMG] iPhone 15            │
│       75,000₺      x1  [X] │
├─────────────────────────────┤
│ [IMG] Samsung S24          │
│       60,000₺      x1  [X] │
├─────────────────────────────┤
│ Toplam: 135,000₺           │
│                             │
│ [Sepete Git] [Ödemeye Geç]│
└─────────────────────────────┘
```

**Backend**: Mevcut Cart API yeterli

**Frontend**:

- `components/MiniCart.tsx` komponenti
- useOutsideClick hook (click outside to close)
- Framer Motion animasyonları
- Navbar'a entegrasyon

### 2. Sepet Kaydetme (Persistence) 🔴

**Öncelik**: Yüksek

**Açıklama**: Misafir kullanıcılar için localStorage, üye kullanıcılar için Redis

**Gereksinimler**:

- Misafir: localStorage + Redis (guestId ile)
- Üye: Redis (userId ile)
- Tarayıcı kapatılsa bile sepet korunsun
- Cihazlar arası senkronizasyon (üyeler için)

**Teknik Detaylar**:

```typescript
// localStorage backup (misafir için)
const saveCartToLocalStorage = (cart: Cart) => {
  localStorage.setItem("cart", JSON.stringify(cart));
};

const loadCartFromLocalStorage = (): Cart | null => {
  const saved = localStorage.getItem("cart");
  return saved ? JSON.parse(saved) : null;
};

// CartContext'te
useEffect(() => {
  if (!user) {
    // Misafir: localStorage backup
    saveCartToLocalStorage(cart);
  }
}, [cart, user]);
```

**Backend**: Mevcut Redis implementation yeterli

### 3. Sepet Paylaşma 🟡

**Öncelik**: Orta

**Açıklama**: Sepeti URL ile paylaşma

**Gereksinimler**:

- "Sepeti Paylaş" butonu
- Unique shareable URL oluşturma
- URL'den sepet yükleme
- Paylaşılan sepet readonly (kopyalanabilir)

**Backend**:

```csharp
// Entities/SharedCart.cs
public class SharedCart : BaseEntity
{
    public string ShareId { get; set; }  // Unique code (7 chars)
    public string CartJson { get; set; } // Serialized cart
    public DateTime ExpiresAt { get; set; }
}

// Controllers/CartController.cs
[HttpPost("share")]
public async Task<ActionResult<string>> ShareCart([FromBody] CustomerCart cart)
{
    var shareId = GenerateShareId();
    var sharedCart = new SharedCart
    {
        ShareId = shareId,
        CartJson = JsonSerializer.Serialize(cart),
        ExpiresAt = DateTime.UtcNow.AddDays(7)
    };

    _context.SharedCarts.Add(sharedCart);
    await _context.SaveChangesAsync();

    return Ok(new { shareUrl = $"/cart/shared/{shareId}" });
}

[HttpGet("shared/{shareId}")]
public async Task<ActionResult<CustomerCart>> GetSharedCart(string shareId)
{
    var shared = await _context.SharedCarts
        .FirstOrDefaultAsync(s => s.ShareId == shareId && s.ExpiresAt > DateTime.UtcNow);

    if (shared == null) return NotFound();

    return Ok(JsonSerializer.Deserialize<CustomerCart>(shared.CartJson));
}
```

**Frontend**:

```tsx
// app/cart/shared/[shareId]/page.tsx
export default function SharedCartPage({
  params,
}: {
  params: { shareId: string };
}) {
  const [sharedCart, setSharedCart] = useState<Cart | null>(null);

  useEffect(() => {
    fetchSharedCart(params.shareId);
  }, [params.shareId]);

  const copyToMyCart = () => {
    // Shared cart'ı kendi sepetine kopyala
  };

  return (
    <div>
      <h1>Paylaşılan Sepet</h1>
      {/* Cart items (readonly) */}
      <button onClick={copyToMyCart}>Bu Sepeti Kopyala</button>
    </div>
  );
}
```

### 4. Stok Kontrolü (Real-time) 🔴

**Öncelik**: Yüksek

**Açıklama**: Sepete ekleme ve checkout sırasında gerçek zamanlı stok kontrolü

**Gereksinimler**:

- Sepete ekleme sırasında stok kontrolü
- Miktar artırma sırasında stok kontrolü
- Checkout sırasında final stok kontrolü
- Stok yetersizse uyarı göster

**Backend**:

```csharp
// Services/CartService.cs (veya yeni StockService)
public async Task<StockCheckResult> CheckStockAvailability(List<CartItem> items)
{
    var results = new List<StockCheckResult>();

    foreach (var item in items)
    {
        var product = await _context.Products.FindAsync(item.ProductId);

        if (product == null)
        {
            results.Add(new StockCheckResult
            {
                ProductId = item.ProductId,
                IsAvailable = false,
                Message = "Ürün bulunamadı"
            });
            continue;
        }

        if (product.Stock < item.Quantity)
        {
            results.Add(new StockCheckResult
            {
                ProductId = item.ProductId,
                IsAvailable = false,
                AvailableStock = product.Stock,
                RequestedQuantity = item.Quantity,
                Message = $"Sadece {product.Stock} adet stokta"
            });
        }
        else
        {
            results.Add(new StockCheckResult
            {
                ProductId = item.ProductId,
                IsAvailable = true
            });
        }
    }

    return new StockCheckResult
    {
        AllAvailable = results.All(r => r.IsAvailable),
        Items = results
    };
}

// Controllers/CartController.cs
[HttpPost("check-stock")]
public async Task<ActionResult<StockCheckResult>> CheckStock([FromBody] CustomerCart cart)
{
    var result = await _cartService.CheckStockAvailability(cart.Items);
    return Ok(result);
}
```

**Frontend**:

```tsx
// app/checkout/page.tsx
const handleCheckout = async () => {
  setLoading(true);

  // Stok kontrolü
  const stockCheck = await api.post("/api/Cart/check-stock", cart);

  if (!stockCheck.data.allAvailable) {
    setErrors(stockCheck.data.items.filter((i) => !i.isAvailable));
    alert("Bazı ürünlerin stoğu yetersiz!");
    return;
  }

  // Devam et
  proceedToPayment();
};
```

### 5. Kargo Ücreti Hesaplama 🟡

**Öncelik**: Orta

**Açıklama**: Sepet tutarına göre tahmini kargo ücreti

**Gereksinimler**:

- Sabit kargo ücreti (örn: 29.99₺)
- Ücretsiz kargo eşiği (örn: 500₺ üzeri)
- Sepet sayfasında gösterim
- Progress bar (ücretsiz kargoya ne kadar kaldı?)

**Backend**:

```csharp
// DTOs/Cart/CartModels.cs
public class CartSummary
{
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal Total { get; set; }
    public bool FreeShipping { get; set; }
    public decimal RemainingForFreeShipping { get; set; }
}

// Services/CartService.cs
public CartSummary CalculateCartSummary(CustomerCart cart)
{
    const decimal SHIPPING_COST = 29.99m;
    const decimal FREE_SHIPPING_THRESHOLD = 500m;

    var subtotal = cart.Subtotal;
    var discount = cart.DiscountAmount;
    var totalBeforeShipping = subtotal - discount;

    var freeShipping = totalBeforeShipping >= FREE_SHIPPING_THRESHOLD;
    var shippingCost = freeShipping ? 0 : SHIPPING_COST;
    var remaining = freeShipping ? 0 : FREE_SHIPPING_THRESHOLD - totalBeforeShipping;

    return new CartSummary
    {
        Subtotal = subtotal,
        DiscountAmount = discount,
        ShippingCost = shippingCost,
        Total = totalBeforeShipping + shippingCost,
        FreeShipping = freeShipping,
        RemainingForFreeShipping = remaining
    };
}
```

**Frontend**:

```tsx
// components/ShippingProgressBar.tsx
export function ShippingProgressBar({ remaining }: { remaining: number }) {
  const FREE_SHIPPING_THRESHOLD = 500;
  const progress =
    ((FREE_SHIPPING_THRESHOLD - remaining) / FREE_SHIPPING_THRESHOLD) * 100;

  return (
    <div className="shipping-progress">
      {remaining > 0 ? (
        <>
          <div className="progress-bar">
            <div className="fill" style={{ width: `${progress}%` }} />
          </div>
          <p>Ücretsiz kargo için {remaining.toFixed(2)}₺ daha ekleyin!</p>
        </>
      ) : (
        <div className="success">✅ Ücretsiz Kargo Kazandınız!</div>
      )}
    </div>
  );
}
```

### 6. "Sepetinizde Unutulanlar" Hatırlatıcısı 🟢

**Öncelik**: Düşük

**Açıklama**: Sepeti terk eden kullanıcılara email hatırlatıcısı

**Gereksinimler**:

- 24 saat sonra email gönder
- Email'de sepet özeti
- "Sepete Dön" linki
- Hangfire background job

**Backend**:

```csharp
// Jobs/AbandonedCartJob.cs
public class AbandonedCartJob
{
    public async Task CheckAbandonedCarts()
    {
        var yesterday = DateTime.UtcNow.AddDays(-1);

        // Redis'ten 24 saat önce güncellenen sepetleri bul
        var abandonedCarts = await _redis.GetAbandonedCarts(yesterday);

        foreach (var cart in abandonedCarts)
        {
            var user = await _userManager.FindByEmailAsync(cart.Id);
            if (user != null)
            {
                await _emailService.SendAbandonedCartEmail(user.Email, cart);
            }
        }
    }
}

// Startup.cs (Hangfire)
RecurringJob.AddOrUpdate<AbandonedCartJob>(
    "check-abandoned-carts",
    job => job.CheckAbandonedCarts(),
    Cron.Hourly
);
```

### 7. Ürün Önerileri 🟡

**Öncelik**: Orta

**Açıklama**: Sepete göre ilgili ürün önerileri

**Gereksinimler**:

- Sepetteki ürünlerle ilgili ürünler
- "Sıkça Birlikte Alınanlar"
- Sepet sayfasında slider

**Backend**:

```csharp
// Services/RecommendationService.cs
public async Task<List<Product>> GetRelatedProducts(List<Guid> productIds)
{
    // Aynı kategorideki ürünler
    var categories = await _context.Products
        .Where(p => productIds.Contains(p.Id))
        .Select(p => p.CategoryId)
        .Distinct()
        .ToListAsync();

    var related = await _context.Products
        .Where(p => categories.Contains(p.CategoryId) && !productIds.Contains(p.Id))
        .OrderByDescending(p => p.Stock > 0)
        .ThenBy(p => p.Price)
        .Take(6)
        .ToListAsync();

    return related;
}
```

**Frontend**:

```tsx
// components/CartRecommendations.tsx
export function CartRecommendations({
  cartProductIds,
}: {
  cartProductIds: string[];
}) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  useEffect(() => {
    fetchRecommendations();
  }, [cartProductIds]);

  return (
    <div className="recommendations">
      <h3>Bunları da Beğenebilirsiniz</h3>
      <div className="product-slider">
        {recommendations.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

## 🗓️ Timeline

| Özellik         | Süre    | Öncelik |
| --------------- | ------- | ------- |
| Mini Cart       | 0.5 gün | 🔴      |
| Sepet Kaydetme  | 0.5 gün | 🔴      |
| Stok Kontrolü   | 1 gün   | 🔴      |
| Kargo Hesaplama | 0.5 gün | 🟡      |
| Sepet Paylaşma  | 1 gün   | 🟡      |
| Unutulan Sepet  | 0.5 gün | 🟢      |
| Ürün Önerileri  | 1 gün   | 🟡      |

**Toplam**: 5 gün

## 🎯 Başarı Kriterleri

1. Mini cart açılış süresi < 200ms
2. Stok kontrolü < 100ms
3. Sepet paylaşma çalışıyor
4. Kargo progress bar doğru hesaplıyor
5. Email hatırlatıcısı 24 saatte gidiyor
6. Ürün önerileri alakalı

## 📦 Bağımlılıklar

### Backend

- Hangfire (background jobs)
- Email service (SendGrid/SMTP)

### Frontend

- Framer Motion (animasyonlar)
- React Hooks (useOutsideClick)

---

**Hazırlayan**: GitHub Copilot  
**Tarih**: 28 Ocak 2026  
**Version**: 1.0
