using ETicaret.Application.DTOs;
using ETicaret.Application.DTOs.Cart;

namespace ETicaret.Application.Interfaces;

public interface ICartService
{
    Task<CustomerCart?> GetCartAsync(string cartId);
    Task<CustomerCart?> UpdateCartAsync(CustomerCart cart);
    Task<bool> DeleteCartAsync(string cartId);
    Task<StockCheckResponse> CheckStockAvailabilityAsync(List<CartItemDto> items);
    ShippingCalculationDto CalculateShipping(decimal cartSubtotal);
}
