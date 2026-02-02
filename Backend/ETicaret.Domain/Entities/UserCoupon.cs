using ETicaret.Domain.Common;

namespace ETicaret.Domain.Entities;

public class UserCoupon : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public Guid CouponId { get; set; }
    public DateTime UsedAt { get; set; }
    public decimal DiscountAmount { get; set; } // Kullanıldığında ne kadar indirim sağladı
    
    // Navigation Properties
    public User User { get; set; } = null!;
    public Coupon Coupon { get; set; } = null!;
}
