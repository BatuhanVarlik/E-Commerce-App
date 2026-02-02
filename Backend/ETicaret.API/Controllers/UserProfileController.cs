using ETicaret.Application.DTOs.Address;
using ETicaret.Application.DTOs.Order;
using ETicaret.Application.DTOs.UserProfile;
using ETicaret.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ETicaret.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserProfileController : ControllerBase
{
    private readonly IUserProfileService _userProfileService;
    private readonly IOrderService _orderService;
    private readonly ILogger<UserProfileController> _logger;

    public UserProfileController(
        IUserProfileService userProfileService,
        IOrderService orderService,
        ILogger<UserProfileController> logger)
    {
        _userProfileService = userProfileService;
        _orderService = orderService;
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

    // Profile Endpoints
    [HttpGet("profile")]
    public async Task<ActionResult<UserProfileDto>> GetProfile()
    {
        try
        {
            var userId = GetCurrentUserId();
            var profile = await _userProfileService.GetUserProfileAsync(userId);
            return Ok(profile);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Profil bilgileri alınırken hata oluştu");
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpPut("profile")]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var profile = await _userProfileService.UpdateUserProfileAsync(userId, dto);
            return Ok(profile);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Profil güncellenirken hata oluştu");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _userProfileService.ChangePasswordAsync(userId, dto);
            return Ok(new { message = "Şifre başarıyla değiştirildi" });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Şifre değiştirilirken hata oluştu");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("account")]
    public async Task<IActionResult> DeleteAccount([FromBody] string password)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _userProfileService.DeleteAccountAsync(userId, password);
            
            if (result)
            {
                return Ok(new { message = "Hesap başarıyla silindi" });
            }
            
            return BadRequest(new { message = "Hesap silinemedi" });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Hesap silinirken hata oluştu");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("upload-photo")]
    public async Task<ActionResult<object>> UploadProfilePhoto([FromBody] UploadPhotoRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var photoUrl = await _userProfileService.UploadProfilePhotoAsync(userId, request.Base64Image);
            return Ok(new { photoUrl, message = "Profil fotoğrafı güncellendi" });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Profil fotoğrafı yüklenirken hata oluştu");
            return BadRequest(new { message = ex.Message });
        }
    }

    // Preferences Endpoints
    [HttpGet("preferences")]
    public async Task<ActionResult<UserPreferencesDto>> GetPreferences()
    {
        try
        {
            var userId = GetCurrentUserId();
            var preferences = await _userProfileService.GetUserPreferencesAsync(userId);
            return Ok(preferences);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kullanıcı tercihleri alınırken hata oluştu");
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpPut("preferences")]
    public async Task<ActionResult<UserPreferencesDto>> UpdatePreferences([FromBody] UpdatePreferencesDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var preferences = await _userProfileService.UpdateUserPreferencesAsync(userId, dto);
            return Ok(preferences);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kullanıcı tercihleri güncellenirken hata oluştu");
            return BadRequest(new { message = ex.Message });
        }
    }

    // Address Endpoints
    [HttpGet("addresses")]
    public async Task<ActionResult<List<AddressDto>>> GetAddresses()
    {
        try
        {
            var userId = GetCurrentUserId();
            var addresses = await _userProfileService.GetUserAddressesAsync(userId);
            return Ok(addresses);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Adresler alınırken hata oluştu");
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpGet("addresses/{id}")]
    public async Task<ActionResult<AddressDto>> GetAddress(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var address = await _userProfileService.GetAddressAsync(userId, id);
            
            if (address == null)
            {
                return NotFound(new { message = "Adres bulunamadı" });
            }
            
            return Ok(address);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Adres alınırken hata oluştu. ID: {Id}", id);
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpPost("addresses")]
    public async Task<ActionResult<AddressDto>> CreateAddress([FromBody] CreateAddressDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var address = await _userProfileService.CreateAddressAsync(userId, dto);
            return CreatedAtAction(nameof(GetAddress), new { id = address.Id }, address);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Adres oluşturulurken hata oluştu");
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpPut("addresses/{id}")]
    public async Task<ActionResult<AddressDto>> UpdateAddress(Guid id, [FromBody] UpdateAddressDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var address = await _userProfileService.UpdateAddressAsync(userId, id, dto);
            return Ok(address);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Adres güncellenirken hata oluştu. ID: {Id}", id);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("addresses/{id}")]
    public async Task<IActionResult> DeleteAddress(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _userProfileService.DeleteAddressAsync(userId, id);
            
            if (!result)
            {
                return NotFound(new { message = "Adres bulunamadı" });
            }
            
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Adres silinirken hata oluştu. ID: {Id}", id);
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpPatch("addresses/{id}/set-default")]
    public async Task<IActionResult> SetDefaultAddress(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _userProfileService.SetDefaultAddressAsync(userId, id);
            return Ok(new { message = "Varsayılan adres güncellendi" });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Varsayılan adres ayarlanırken hata oluştu. ID: {Id}", id);
            return BadRequest(new { message = ex.Message });
        }
    }

    // Order Endpoints
    [HttpGet("orders")]
    public async Task<ActionResult<object>> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var userId = GetCurrentUserId();
            var (orders, totalCount) = await _orderService.GetUserOrdersPaginatedAsync(userId, page, pageSize);
            
            return Ok(new
            {
                orders,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Siparişler alınırken hata oluştu");
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpGet("orders/{orderId}")]
    public async Task<ActionResult<OrderDetailDto>> GetOrderDetail(Guid orderId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var order = await _orderService.GetOrderDetailAsync(orderId, userId);
            
            if (order == null)
            {
                return NotFound(new { message = "Sipariş bulunamadı" });
            }
            
            return Ok(order);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sipariş detayı alınırken hata oluştu. OrderId: {OrderId}", orderId);
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpPost("orders/{orderId}/cancel")]
    public async Task<IActionResult> CancelOrder(Guid orderId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _orderService.CancelOrderAsync(orderId, userId);
            
            if (!result)
            {
                return BadRequest(new { message = "Sipariş iptal edilemedi. Sipariş durumunu kontrol edin." });
            }
            
            return Ok(new { message = "Sipariş başarıyla iptal edildi" });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sipariş iptal edilirken hata oluştu. OrderId: {OrderId}", orderId);
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }

    [HttpPost("orders/{orderId}/reorder")]
    public async Task<ActionResult<object>> Reorder(Guid orderId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var newOrderId = await _orderService.ReorderAsync(orderId, userId);
            
            if (newOrderId == null)
            {
                return BadRequest(new { message = "Sipariş tekrarlanamadı. Stok durumunu kontrol edin." });
            }
            
            return Ok(new { message = "Sipariş başarıyla tekrarlandı", orderId = newOrderId });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sipariş tekrarlanırken hata oluştu. OrderId: {OrderId}", orderId);
            return StatusCode(500, new { message = "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
    }
}

// DTOs
public record UploadPhotoRequest(string Base64Image);
