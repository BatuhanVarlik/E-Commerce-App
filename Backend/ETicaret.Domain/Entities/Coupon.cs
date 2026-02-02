using ETicaret.Domain.Common;

namespace ETicaret.Domain.Entities;

public enum CouponType
{
    Percentage,      // Yüzde indirim
    FixedAmount,     // Sabit tutar indirim
    FreeShipping,    // Ücretsiz kargo
    GiftProduct      // Hediye ürün
}

public class Coupon : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public CouponType Type { get; set; }
    public decimal Value { get; set; } // Percentage için 10 = %10, FixedAmount için direkt tutar
    public decimal MinimumAmount { get; set; } // Minimum sepet tutarı
    public int MaxUsage { get; set; } // Maksimum kullanım sayısı (0 = sınırsız)
    public int CurrentUsage { get; set; } = 0; // Şu ana kadar kullanılma sayısı
    public DateTime StartDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Opsiyonel: Belirli kategori veya ürünler için
    public Guid? CategoryId { get; set; }
    public Guid? ProductId { get; set; }
    
    // Navigation Properties
    public Category? Category { get; set; }
    public Product? Product { get; set; }
    public ICollection<UserCoupon> UserCoupons { get; set; } = new List<UserCoupon>();
}
