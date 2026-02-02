using ETicaret.Application.DTOs.Coupon;
using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ETicaret.Infrastructure.Services;

public class CouponService : ICouponService
{
    private readonly ApplicationDbContext _context;

    public CouponService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CouponValidationResult> ValidateCouponAsync(string code, decimal cartTotal, string userId)
    {
        var upperCode = code.ToUpper();
        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Code == upperCode);

        if (coupon == null)
        {
            return new CouponValidationResult
            {
                IsValid = false,
                Message = "Kupon kodu bulunamadı"
            };
        }

        if (!coupon.IsActive)
        {
            return new CouponValidationResult
            {
                IsValid = false,
                Message = "Bu kupon aktif değil"
            };
        }

        var now = DateTime.UtcNow;
        if (now < coupon.StartDate)
        {
            return new CouponValidationResult
            {
                IsValid = false,
                Message = "Bu kupon henüz kullanıma açılmadı"
            };
        }

        if (now > coupon.ExpiryDate)
        {
            return new CouponValidationResult
            {
                IsValid = false,
                Message = "Bu kuponun süresi dolmuş"
            };
        }

        if (coupon.CurrentUsage >= coupon.MaxUsage)
        {
            return new CouponValidationResult
            {
                IsValid = false,
                Message = "Bu kuponun kullanım limiti dolmuş"
            };
        }

        if (cartTotal < coupon.MinimumAmount)
        {
            return new CouponValidationResult
            {
                IsValid = false,
                Message = $"Bu kuponu kullanmak için minimum {coupon.MinimumAmount:C} tutarında alışveriş yapmalısınız"
            };
        }

        var discountAmount = CalculateDiscount(coupon, cartTotal);

        return new CouponValidationResult
        {
            IsValid = true,
            Message = "Kupon başarıyla uygulandı",
            DiscountAmount = discountAmount,
            Coupon = MapToDto(coupon)
        };
    }

    public async Task<CouponValidationResult> ApplyCouponAsync(string code, decimal cartTotal, string userId)
    {
        var validationResult = await ValidateCouponAsync(code, cartTotal, userId);
        
        if (!validationResult.IsValid || validationResult.Coupon == null)
        {
            return validationResult;
        }

        // Create user coupon record
        var userCoupon = new UserCoupon
        {
            UserId = userId,
            CouponId = validationResult.Coupon.Id,
            UsedAt = DateTime.UtcNow,
            DiscountAmount = validationResult.DiscountAmount
        };

        _context.UserCoupons.Add(userCoupon);

        // Increment current usage
        var coupon = await _context.Coupons.FindAsync(validationResult.Coupon.Id);
        if (coupon != null)
        {
            coupon.CurrentUsage++;
            await _context.SaveChangesAsync();
        }

        return validationResult;
    }

    public async Task<IEnumerable<CouponDto>> GetActiveCouponsAsync()
    {
        var now = DateTime.UtcNow;
        var coupons = await _context.Coupons
            .Where(c => c.IsActive && 
                       c.StartDate <= now && 
                       c.ExpiryDate >= now &&
                       c.CurrentUsage < c.MaxUsage)
            .ToListAsync();

        return coupons.Select(MapToDto);
    }

    public async Task<IEnumerable<UserCouponDto>> GetUserCouponHistoryAsync(string userId)
    {
        var userCoupons = await _context.UserCoupons
            .Include(uc => uc.Coupon)
            .Where(uc => uc.UserId == userId)
            .OrderByDescending(uc => uc.UsedAt)
            .ToListAsync();

        return userCoupons.Select(uc => new UserCouponDto
        {
            Id = uc.Id,
            UserId = uc.UserId,
            CouponId = uc.CouponId,
            UsedAt = uc.UsedAt,
            DiscountAmount = uc.DiscountAmount,
            Coupon = uc.Coupon != null ? MapToDto(uc.Coupon) : null
        });
    }

    public async Task<CouponDto> CreateCouponAsync(CreateCouponDto dto)
    {
        var coupon = new Domain.Entities.Coupon
        {
            Code = dto.Code.ToUpper(),
            Type = dto.Type,
            Value = dto.Value,
            MinimumAmount = dto.MinimumAmount,
            MaxUsage = dto.MaxUsage,
            CurrentUsage = 0,
            StartDate = dto.StartDate,
            ExpiryDate = dto.ExpiryDate,
            IsActive = true,
            CategoryId = dto.CategoryId,
            ProductId = dto.ProductId
        };

        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync();

        return MapToDto(coupon);
    }

    public async Task<CouponDto> UpdateCouponAsync(Guid id, UpdateCouponDto dto)
    {
        var coupon = await _context.Coupons.FindAsync(id);
        if (coupon == null)
        {
            throw new Exception("Kupon bulunamadı");
        }

        if (dto.Type.HasValue) coupon.Type = dto.Type.Value;
        if (dto.Value.HasValue) coupon.Value = dto.Value.Value;
        if (dto.MinimumAmount.HasValue) coupon.MinimumAmount = dto.MinimumAmount.Value;
        if (dto.MaxUsage.HasValue) coupon.MaxUsage = dto.MaxUsage.Value;
        if (dto.StartDate.HasValue) coupon.StartDate = dto.StartDate.Value;
        if (dto.ExpiryDate.HasValue) coupon.ExpiryDate = dto.ExpiryDate.Value;
        if (dto.IsActive.HasValue) coupon.IsActive = dto.IsActive.Value;
        if (dto.CategoryId.HasValue) coupon.CategoryId = dto.CategoryId.Value;
        if (dto.ProductId.HasValue) coupon.ProductId = dto.ProductId.Value;

        await _context.SaveChangesAsync();

        return MapToDto(coupon);
    }

    public async Task<bool> DeleteCouponAsync(Guid id)
    {
        var coupon = await _context.Coupons.FindAsync(id);
        if (coupon == null)
        {
            return false;
        }

        _context.Coupons.Remove(coupon);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<CouponDto?> GetCouponByIdAsync(Guid id)
    {
        var coupon = await _context.Coupons.FindAsync(id);
        return coupon != null ? MapToDto(coupon) : null;
    }

    public async Task<IEnumerable<CouponDto>> GetAllCouponsAsync()
    {
        var coupons = await _context.Coupons.ToListAsync();
        return coupons.Select(MapToDto);
    }

    private static decimal CalculateDiscount(Domain.Entities.Coupon coupon, decimal cartTotal)
    {
        return coupon.Type switch
        {
            CouponType.Percentage => cartTotal * (coupon.Value / 100),
            CouponType.FixedAmount => coupon.Value,
            CouponType.FreeShipping => 0, // Shipping cost should be handled separately
            CouponType.GiftProduct => 0, // Gift product should be handled separately
            _ => 0
        };
    }

    private static CouponDto MapToDto(Domain.Entities.Coupon coupon)
    {
        return new CouponDto
        {
            Id = coupon.Id,
            Code = coupon.Code,
            Type = coupon.Type,
            Value = coupon.Value,
            MinimumAmount = coupon.MinimumAmount,
            MaxUsage = coupon.MaxUsage,
            CurrentUsage = coupon.CurrentUsage,
            StartDate = coupon.StartDate,
            ExpiryDate = coupon.ExpiryDate,
            IsActive = coupon.IsActive,
            CategoryId = coupon.CategoryId,
            ProductId = coupon.ProductId
        };
    }
}
