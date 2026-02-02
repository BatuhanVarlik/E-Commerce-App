using ETicaret.Application.DTOs.Order;
using ETicaret.Application.Interfaces;
using ETicaret.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ETicaret.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<OrderService> _logger;

    public OrderService(ApplicationDbContext context, ILogger<OrderService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<OrderDto>> GetOrdersByUserIdAsync(string userId)
    {
        var orders = await _context.Orders
            .Include(o => o.Items)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();

        return orders.Select(MapToDto).ToList();
    }

    public async Task<List<OrderDto>> GetAllOrdersAsync()
    {
        var orders = await _context.Orders
            .Include(o => o.Items)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();

        return orders.Select(MapToDto).ToList();
    }

    public async Task<OrderDto?> GetOrderByIdAsync(Guid orderId)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) return null;

        return MapToDto(order);
    }

    public async Task<(List<OrderDto> Orders, int TotalCount)> GetUserOrdersPaginatedAsync(string userId, int page, int pageSize)
    {
        var query = _context.Orders
            .Include(o => o.Items)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.OrderDate);

        var totalCount = await query.CountAsync();
        var orders = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (orders.Select(MapToDto).ToList(), totalCount);
    }

    public async Task<OrderDetailDto?> GetOrderDetailAsync(Guid orderId, string userId)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (order == null)
        {
            _logger.LogWarning("Order {OrderId} not found for user {UserId}", orderId, userId);
            return null;
        }

        // Get product details for order items
        var productIds = order.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p);

        return new OrderDetailDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            OrderDate = order.OrderDate,
            TotalAmount = order.TotalAmount,
            Status = order.Status,
            PaymentId = order.PaymentId,
            ShippingAddress = order.ShippingAddress,
            City = order.City,
            Country = order.Country,
            ZipCode = order.ZipCode,
            UserEmail = order.UserEmail,
            Items = order.Items.Select(i =>
            {
                products.TryGetValue(i.ProductId, out var product);
                return new OrderItemDetailDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    ProductImageUrl = product?.ImageUrl ?? "",
                    ProductSlug = product?.Slug ?? "",
                    Price = i.Price,
                    Quantity = i.Quantity
                };
            }).ToList()
        };
    }

    public async Task<bool> CancelOrderAsync(Guid orderId, string userId)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (order == null)
        {
            _logger.LogWarning("Order {OrderId} not found for user {UserId}", orderId, userId);
            return false;
        }

        if (order.Status != "Pending" && order.Status != "Paid")
        {
            _logger.LogWarning("Order {OrderId} cannot be cancelled. Status: {Status}", orderId, order.Status);
            return false;
        }

        // Restore stock for cancelled items
        var productIds = order.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();

        foreach (var item in order.Items)
        {
            var product = products.FirstOrDefault(p => p.Id == item.ProductId);
            if (product != null)
            {
                product.Stock += item.Quantity;
                _logger.LogInformation("Restored {Quantity} units to product {ProductId}", item.Quantity, item.ProductId);
            }
        }

        order.Status = "Cancelled";
        await _context.SaveChangesAsync();

        _logger.LogInformation("Order {OrderId} cancelled by user {UserId}", orderId, userId);
        return true;
    }

    public async Task<Guid?> ReorderAsync(Guid orderId, string userId)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (order == null)
        {
            _logger.LogWarning("Order {OrderId} not found for user {UserId}", orderId, userId);
            return null;
        }

        if (order.Status == "Cancelled")
        {
            _logger.LogWarning("Cannot reorder cancelled order {OrderId}", orderId);
            return null;
        }

        // Check stock availability
        var productIds = order.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p);

        var unavailableItems = new List<string>();
        foreach (var item in order.Items)
        {
            if (!products.TryGetValue(item.ProductId, out var product) || product.Stock < item.Quantity)
            {
                unavailableItems.Add(item.ProductName);
            }
        }

        if (unavailableItems.Any())
        {
            _logger.LogWarning("Cannot reorder {OrderId}. Unavailable items: {Items}", 
                orderId, string.Join(", ", unavailableItems));
            return null;
        }

        // Create new order
        var newOrder = new ETicaret.Domain.Entities.Order
        {
            Id = Guid.NewGuid(),
            UserId = order.UserId,
            UserEmail = order.UserEmail,
            OrderNumber = GenerateOrderNumber(),
            OrderDate = DateTime.UtcNow,
            Status = "Pending",
            ShippingAddress = order.ShippingAddress,
            City = order.City,
            Country = order.Country,
            ZipCode = order.ZipCode,
            TotalAmount = 0
        };

        decimal totalAmount = 0;
        foreach (var item in order.Items)
        {
            var product = products[item.ProductId];
            var newItem = new ETicaret.Domain.Entities.OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = newOrder.Id,
                ProductId = item.ProductId,
                ProductName = product.Name,
                Price = product.Price, // Use current price
                Quantity = item.Quantity
            };
            newOrder.Items.Add(newItem);
            totalAmount += newItem.Price * newItem.Quantity;

            // Reduce stock
            product.Stock -= item.Quantity;
        }

        newOrder.TotalAmount = totalAmount;
        _context.Orders.Add(newOrder);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Reordered {OrderId} as {NewOrderId} for user {UserId}", 
            orderId, newOrder.Id, userId);
        return newOrder.Id;
    }

    private static string GenerateOrderNumber()
    {
        var date = DateTime.UtcNow;
        var random = new Random().Next(1000, 9999);
        return $"ORD-{date:yyyyMMdd}-{random}";
    }

    private static OrderDto MapToDto(ETicaret.Domain.Entities.Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            OrderDate = order.OrderDate,
            TotalAmount = order.TotalAmount,
            Status = order.Status,
            PaymentId = order.PaymentId,
            ShippingAddress = order.ShippingAddress,
            City = order.City,
            Items = order.Items.Select(i => new OrderItemDto
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Price = i.Price,
                Quantity = i.Quantity
            }).ToList()
        };
    }
}
