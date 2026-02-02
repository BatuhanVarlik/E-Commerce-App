using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ETicaret.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] // Only logged in users for now
public class CheckoutController : ControllerBase
{
    private readonly ICartService _cartService;
    private readonly IPaymentService _paymentService;
    private readonly IEmailService _emailService;
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly ILogger<CheckoutController> _logger;

    public CheckoutController(
        ICartService cartService, 
        IPaymentService paymentService, 
        IEmailService emailService,
        ApplicationDbContext context, 
        UserManager<User> userManager,
        ILogger<CheckoutController> logger)
    {
        _cartService = cartService;
        _paymentService = paymentService;
        _emailService = emailService;
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    private static string GenerateOrderNumber()
    {
        var date = DateTime.UtcNow.ToString("yyyyMMdd");
        var random = new Random().Next(1000, 9999);
        return $"ORD-{date}-{random}";
    }

    [HttpPost]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
    {
        // 1. Get User
        var userEmail = User.FindFirstValue(ClaimTypes.Email);
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);

        if (user == null) return Unauthorized();

        // 2. Get Cart
        var cart = await _cartService.GetCartAsync(userEmail!); // Assuming cart ID is email for logged in users
        if (cart == null || cart.Items.Count == 0)
        {
            return BadRequest("Sepet boş.");
        }

        // 3. Process Payment via Iyzico
        try
        {
            var paymentRequest = new PaymentRequestDto
            {
                Amount = cart.TotalPrice,
                CardHolderName = request.CardHolderName,
                CardNumber = request.CardNumber,
                ExpireMonth = request.ExpireMonth,
                ExpireYear = request.ExpireYear,
                Cvc = request.Cvc,
                
                BuyerId = user.Id,
                BuyerEmail = user.Email!,
                BuyerName = user.FirstName,
                BuyerSurname = user.LastName,
                BuyerAddress = request.Address,
                BuyerCity = request.City,
                BuyerIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1"
            };

            var paymentId = await _paymentService.ProcessPaymentAsync(paymentRequest);

            // 4. Create Order
            // 4. Create Order and Deduct Stock
            var orderItems = new List<OrderItem>();
            foreach (var item in cart.Items)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product == null)
                {
                    return BadRequest($"Ürün bulunamadı: {item.ProductName}");
                }

                if (product.Stock < item.Quantity)
                {
                    return BadRequest($"Yetersiz stok: {item.ProductName}. Mevcut: {product.Stock}");
                }

                // Deduct stock
                product.Stock -= item.Quantity;

                orderItems.Add(new OrderItem
                {
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    Price = item.Price,
                    Quantity = item.Quantity
                });
            }

            var order = new Order
            {
                UserId = user.Id,
                UserEmail = user.Email!,
                OrderNumber = GenerateOrderNumber(),
                TotalAmount = cart.TotalPrice,
                Status = "Paid",
                PaymentId = paymentId,
                ShippingAddress = request.Address,
                City = request.City,
                Country = "Turkey",
                ZipCode = request.ZipCode,
                Items = orderItems
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // 5. Send Order Confirmation Email
            try
            {
                await _emailService.SendOrderConfirmationEmailAsync(
                    user.Email!,
                    order.OrderNumber,
                    order.TotalAmount
                );
                _logger.LogInformation("Order confirmation email sent to {Email}", user.Email);
            }
            catch (Exception emailEx)
            {
                _logger.LogError(emailEx, "Failed to send order confirmation email to {Email}", user.Email);
                // Don't fail the order if email fails
            }

            // 6. Clear Cart
            await _cartService.DeleteCartAsync(userEmail!);

            return Ok(new { OrderId = order.Id, Message = "Sipariş başarıyla oluşturuldu." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = "Ödeme başarısız.", Details = ex.Message });
        }
    }
}

public class CheckoutRequest
{
    // Payment Info
    public string CardHolderName { get; set; } = string.Empty;
    public string CardNumber { get; set; } = string.Empty;
    public string ExpireMonth { get; set; } = string.Empty;
    public string ExpireYear { get; set; } = string.Empty;
    public string Cvc { get; set; } = string.Empty;

    // Address Info
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;
}
