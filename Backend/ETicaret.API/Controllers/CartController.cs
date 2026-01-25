using ETicaret.Application.DTOs.Cart;
using ETicaret.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ETicaret.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;

    public CartController(ICartService cartService)
    {
        _cartService = cartService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCart(string id)
    {
        var cart = await _cartService.GetCartAsync(id);
        return Ok(cart ?? new CustomerCart(id));
    }

    [HttpPost]
    public async Task<IActionResult> UpdateCart([FromBody] CustomerCart cart)
    {
        var updatedCart = await _cartService.UpdateCartAsync(cart);
        return Ok(updatedCart);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCart(string id)
    {
        await _cartService.DeleteCartAsync(id);
        return Ok();
    }
}
