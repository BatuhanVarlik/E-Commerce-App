using ETicaret.Application.DTOs.Wishlist;
using ETicaret.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ETicaret.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class WishlistController : ControllerBase
{
    private readonly IWishlistService _wishlistService;

    public WishlistController(IWishlistService wishlistService)
    {
        _wishlistService = wishlistService;
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    [HttpGet]
    public async Task<IActionResult> GetWishlist()
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var wishlist = await _wishlistService.GetUserWishlistAsync(userId);
        return Ok(wishlist);
    }

    [HttpPost]
    public async Task<IActionResult> AddToWishlist([FromBody] AddToWishlistRequest request)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            var item = await _wishlistService.AddToWishlistAsync(userId, request.ProductId);
            return Ok(item);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{productId}")]
    public async Task<IActionResult> RemoveFromWishlist(Guid productId)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        try
        {
            await _wishlistService.RemoveFromWishlistAsync(userId, productId);
            return Ok(new { message = "Ürün favorilerden kaldırıldı" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("check/{productId}")]
    public async Task<IActionResult> IsInWishlist(Guid productId)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var isInWishlist = await _wishlistService.IsInWishlistAsync(userId, productId);
        return Ok(new { isInWishlist });
    }

    [HttpDelete]
    public async Task<IActionResult> ClearWishlist()
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        await _wishlistService.ClearWishlistAsync(userId);
        return Ok(new { message = "Favoriler temizlendi" });
    }
}
