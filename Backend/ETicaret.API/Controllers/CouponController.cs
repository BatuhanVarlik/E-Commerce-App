using ETicaret.Application.DTOs.Coupon;
using ETicaret.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ETicaret.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CouponController : ControllerBase
{
    private readonly ICouponService _couponService;
    private readonly ILogger<CouponController> _logger;

    public CouponController(ICouponService couponService, ILogger<CouponController> logger)
    {
        _couponService = couponService;
        _logger = logger;
    }

    private string GetCurrentUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            throw new UnauthorizedAccessException("Kullanıcı girişi gerekli");
        }
        return userId;
    }

    [HttpPost("validate")]
    [Authorize]
    public async Task<ActionResult<CouponValidationResult>> ValidateCoupon([FromBody] ApplyCouponRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _couponService.ValidateCouponAsync(request.Code, request.CartTotal, userId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kupon doğrulanırken hata oluştu. Kod: {Code}", request.Code);
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpPost("apply")]
    [Authorize]
    public async Task<ActionResult<CouponValidationResult>> ApplyCoupon([FromBody] ApplyCouponRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _couponService.ApplyCouponAsync(request.Code, request.CartTotal, userId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kupon uygulanırken hata oluştu. Kod: {Code}", request.Code);
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<CouponDto>>> GetActiveCoupons()
    {
        try
        {
            var coupons = await _couponService.GetActiveCouponsAsync();
            return Ok(coupons);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Aktif kuponlar listelenirken hata oluştu");
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpGet("history")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<UserCouponDto>>> GetUserCouponHistory()
    {
        try
        {
            var userId = GetCurrentUserId();
            var history = await _couponService.GetUserCouponHistoryAsync(userId);
            return Ok(history);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kupon geçmişi alınırken hata oluştu");
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    // Admin endpoints
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CouponDto>> CreateCoupon([FromBody] CreateCouponDto dto)
    {
        try
        {
            var coupon = await _couponService.CreateCouponAsync(dto);
            return CreatedAtAction(nameof(GetCouponById), new { id = coupon.Id }, coupon);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kupon oluşturulurken hata oluştu. Kod: {Code}", dto.Code);
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CouponDto>> GetCouponById(Guid id)
    {
        try
        {
            var coupon = await _couponService.GetCouponByIdAsync(id);
            if (coupon == null)
            {
                return NotFound(new { message = "Kupon bulunamadı" });
            }
            return Ok(coupon);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kupon getirilirken hata oluştu. ID: {Id}", id);
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<CouponDto>>> GetAllCoupons()
    {
        try
        {
            var coupons = await _couponService.GetAllCouponsAsync();
            return Ok(coupons);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kuponlar listelenirken hata oluştu");
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CouponDto>> UpdateCoupon(Guid id, [FromBody] UpdateCouponDto dto)
    {
        try
        {
            var coupon = await _couponService.UpdateCouponAsync(id, dto);
            return Ok(coupon);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kupon güncellenirken hata oluştu. ID: {Id}", id);
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteCoupon(Guid id)
    {
        try
        {
            var result = await _couponService.DeleteCouponAsync(id);
            if (!result)
            {
                return NotFound(new { message = "Kupon bulunamadı" });
            }
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kupon silinirken hata oluştu. ID: {Id}", id);
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }
}
