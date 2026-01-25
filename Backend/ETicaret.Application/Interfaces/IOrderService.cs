using ETicaret.Application.DTOs.Order;

namespace ETicaret.Application.Interfaces;

public interface IOrderService
{
    Task<List<OrderDto>> GetOrdersByUserIdAsync(string userId);
    Task<List<OrderDto>> GetAllOrdersAsync();
    Task<OrderDto?> GetOrderByIdAsync(Guid orderId);
}
