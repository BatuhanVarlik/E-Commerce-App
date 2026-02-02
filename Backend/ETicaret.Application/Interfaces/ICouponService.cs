using ETicaret.Application.DTOs.Coupon;

namespace ETicaret.Application.Interfaces;

public interface ICouponService
{
    Task<CouponValidationResult> ValidateCouponAsync(string code, decimal cartTotal, string userId);
    Task<CouponValidationResult> ApplyCouponAsync(string code, decimal cartTotal, string userId);
    Task<IEnumerable<CouponDto>> GetActiveCouponsAsync();
    Task<IEnumerable<UserCouponDto>> GetUserCouponHistoryAsync(string userId);
    
    // Admin operations
    Task<CouponDto> CreateCouponAsync(CreateCouponDto dto);
    Task<CouponDto> UpdateCouponAsync(Guid id, UpdateCouponDto dto);
    Task<bool> DeleteCouponAsync(Guid id);
    Task<CouponDto?> GetCouponByIdAsync(Guid id);
    Task<IEnumerable<CouponDto>> GetAllCouponsAsync();
}
