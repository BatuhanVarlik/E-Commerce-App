using ETicaret.Application.DTOs.Order;

namespace ETicaret.Application.DTOs.Admin;

public class DashboardStatsDto
{
    public decimal TotalSales { get; set; }
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public int TotalProducts { get; set; }
    public List<OrderDto> RecentOrders { get; set; } = new();
}
