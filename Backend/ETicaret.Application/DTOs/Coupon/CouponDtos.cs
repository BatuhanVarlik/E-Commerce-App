using ETicaret.Domain.Entities;

namespace ETicaret.Application.DTOs.Coupon;

public class CouponDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public CouponType Type { get; set; }
    public decimal Value { get; set; }
    public decimal MinimumAmount { get; set; }
    public int MaxUsage { get; set; }
    public int CurrentUsage { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public bool IsActive { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? ProductId { get; set; }
}

public class CreateCouponDto
{
    public string Code { get; set; } = string.Empty;
    public CouponType Type { get; set; }
    public decimal Value { get; set; }
    public decimal MinimumAmount { get; set; }
    public int MaxUsage { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? ProductId { get; set; }
}

public class UpdateCouponDto
{
    public CouponType? Type { get; set; }
    public decimal? Value { get; set; }
    public decimal? MinimumAmount { get; set; }
    public int? MaxUsage { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public bool? IsActive { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? ProductId { get; set; }
}

public class ApplyCouponRequest
{
    public string Code { get; set; } = string.Empty;
    public decimal CartTotal { get; set; }
}

public class CouponValidationResult
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
    public CouponDto? Coupon { get; set; }
}

public class UserCouponDto
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public Guid CouponId { get; set; }
    public DateTime UsedAt { get; set; }
    public decimal DiscountAmount { get; set; }
    public CouponDto? Coupon { get; set; }
}
