using ETicaret.Application.DTOs.Order;

namespace ETicaret.Application.Interfaces;

public interface IOrderService
{
    Task<List<OrderDto>> GetOrdersByUserIdAsync(string userId);
    Task<(List<OrderDto> Orders, int TotalCount)> GetUserOrdersPaginatedAsync(string userId, int page, int pageSize);
    Task<List<OrderDto>> GetAllOrdersAsync();
    Task<OrderDto?> GetOrderByIdAsync(Guid orderId);
    Task<OrderDetailDto?> GetOrderDetailAsync(Guid orderId, string userId);
    Task<bool> CancelOrderAsync(Guid orderId, string userId);
    Task<Guid?> ReorderAsync(Guid orderId, string userId);
}
