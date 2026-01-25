using System.Text.Json;
using ETicaret.Application.DTOs.Cart;
using ETicaret.Application.Interfaces;
using StackExchange.Redis;

namespace ETicaret.Infrastructure.Services;

public class CartService : ICartService
{
    private readonly IDatabase _redis;

    public CartService(IConnectionMultiplexer redis)
    {
        _redis = redis.GetDatabase();
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
}
