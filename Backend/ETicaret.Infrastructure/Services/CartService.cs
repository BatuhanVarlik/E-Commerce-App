using System.Text.Json;
using ETicaret.Application.DTOs;
using ETicaret.Application.DTOs.Cart;
using ETicaret.Application.Interfaces;
using ETicaret.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;

namespace ETicaret.Infrastructure.Services;

public class CartService : ICartService
{
    private readonly IDatabase _redis;
    private readonly ApplicationDbContext _context;

    public CartService(IConnectionMultiplexer redis, ApplicationDbContext context)
    {
        _redis = redis.GetDatabase();
        _context = context;
    }

    public async Task<CustomerCart?> GetCartAsync(string cartId)
    {
        var data = await _redis.StringGetAsync(cartId);
        return data.IsNullOrEmpty ? null : JsonSerializer.Deserialize<CustomerCart>(data!);
    }

    public async Task<CustomerCart?> UpdateCartAsync(CustomerCart cart)
    {
        var created = await _redis.StringSetAsync(cart.Id, JsonSerializer.Serialize(cart), TimeSpan.FromDays(30));
        if (!created) return null;
        return await GetCartAsync(cart.Id);
    }

    public async Task<bool> DeleteCartAsync(string cartId)
    {
        return await _redis.KeyDeleteAsync(cartId);
    }

    public async Task<StockCheckResponse> CheckStockAvailabilityAsync(List<CartItemDto> items)
    {
        var response = new StockCheckResponse
        {
            AllItemsAvailable = true,
            Results = new List<StockCheckDto>(),
            Warnings = new List<string>()
        };

        // Batch query to avoid N+1 problem
        var productIds = items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _context.Products
            .AsNoTracking()
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        foreach (var item in items)
        {
            var product = products.GetValueOrDefault(item.ProductId);

            if (product == null)
            {
                response.AllItemsAvailable = false;
                response.Results.Add(new StockCheckDto
                {
                    ProductId = item.ProductId,
                    RequestedQuantity = item.Quantity,
                    AvailableStock = 0,
                    IsAvailable = false,
                    Message = "Ürün bulunamadı"
                });
                response.Warnings.Add($"Ürün ID {item.ProductId} bulunamadı");
                continue;
            }

            var isAvailable = product.Stock >= item.Quantity;

            response.Results.Add(new StockCheckDto
            {
                ProductId = item.ProductId,
                RequestedQuantity = item.Quantity,
                AvailableStock = product.Stock,
                IsAvailable = isAvailable,
                Message = isAvailable 
                    ? "Stok uygun" 
                    : $"Yetersiz stok. Sadece {product.Stock} adet mevcut"
            });

            if (!isAvailable)
            {
                response.AllItemsAvailable = false;
                response.Warnings.Add($"{product.Name}: Sadece {product.Stock} adet mevcut (talep edilen: {item.Quantity})");
            }
        }

        return response;
    }

    // Constants can be moved to configuration in future
    private const decimal FREE_SHIPPING_THRESHOLD = 500m;
    private const decimal STANDARD_SHIPPING_COST = 29.99m;

    public ShippingCalculationDto CalculateShipping(decimal cartSubtotal)
    {
        const decimal freeShippingThreshold = FREE_SHIPPING_THRESHOLD;
        const decimal standardShippingCost = STANDARD_SHIPPING_COST;

        var qualifiesForFreeShipping = cartSubtotal >= freeShippingThreshold;
        var shippingCost = qualifiesForFreeShipping ? 0m : standardShippingCost;
        var remainingForFreeShipping = qualifiesForFreeShipping 
            ? 0m 
            : freeShippingThreshold - cartSubtotal;

        return new ShippingCalculationDto
        {
            CartSubtotal = cartSubtotal,
            ShippingCost = shippingCost,
            FreeShippingThreshold = freeShippingThreshold,
            RemainingForFreeShipping = remainingForFreeShipping,
            QualifiesForFreeShipping = qualifiesForFreeShipping,
            Total = cartSubtotal + shippingCost
        };
    }
}
