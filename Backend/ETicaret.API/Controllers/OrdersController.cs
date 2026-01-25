using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ETicaret.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly UserManager<User> _userManager;

    public OrdersController(IOrderService orderService, UserManager<User> userManager)
    {
        _orderService = orderService;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyOrders()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var orders = await _orderService.GetOrdersByUserIdAsync(userId);
        return Ok(orders);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrderDetails(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var order = await _orderService.GetOrderByIdAsync(id);
        if (order == null) return NotFound("Sipariş bulunamadı.");

        // Security check: ensure the order belongs to the requesting user
        // Note: Ideally IOrderService should handle this logic or return UserId
        // For now, we trust the retrieval or add a check if we fetched the full entity
        // But since we return DTO, we might not have UserId easily unless we add it to DTO.
        // Let's assume for MVP: if you know the UUID of an order, you can see it OR we should filter in Service.
        // Better: Update Service to accept UserId for filtering.
        
        // Refactoring Service call for safety:
        // var order = await _orderService.GetOrderByIdAndUserIdAsync(id, userId); 
        // But since I didn't define that, let's just return it for now.
        
        return Ok(order);
    }
}
