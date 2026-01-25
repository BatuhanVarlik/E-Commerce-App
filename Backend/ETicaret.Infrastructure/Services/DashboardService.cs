using ETicaret.Application.DTOs.Admin;
using ETicaret.Application.DTOs.Order;
using ETicaret.Application.Interfaces;
using ETicaret.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ETicaret.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync()
    {
        var totalSales = await _context.Orders.SumAsync(o => o.TotalAmount);
        var totalOrders = await _context.Orders.CountAsync();
        // Assuming "Ödendi" (Paid) is what we have, or maybe we want checking "Pending" if we had that status.
        // The user mentioned "Bekleyen Siparişler" (Pending Orders).
        // In our CheckoutController, we set status to "Ödendi".
        // Let's assume anything NOT "Teslim Edildi" (Delivered) or "İptal" (Cancelled) is sorta pending processing?
        // Or if we specifically look for a status.
        // For now, let's count orders that are "Ödendi" as pending shipment if we don't have "Hazırlanıyor" etc.
        // Actually, let's just count all for now if status logic isn't complex, 
        // OR better: let's introduce a standard status check.
        // Since we only have "Ödendi" right now, let's count "Ödendi" as Pending for shipment.
        var pendingOrders = await _context.Orders.CountAsync(o => o.Status == "Ödendi");
        
        var totalProducts = await _context.Products.CountAsync();

        var recentOrders = await _context.Orders
            .Include(o => o.Items)
            .OrderByDescending(o => o.OrderDate)
            .Take(5)
            .Select(o => new OrderDto
            {
                Id = o.Id,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                PaymentId = o.PaymentId,
                ShippingAddress = o.ShippingAddress,
                City = o.City,
                Items = o.Items.Select(i => new OrderItemDto
                {
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    Price = i.Price,
                    Quantity = i.Quantity
                }).ToList()
            })
            .ToListAsync();

        return new DashboardStatsDto
        {
            TotalSales = totalSales,
            TotalOrders = totalOrders,
            PendingOrders = pendingOrders,
            TotalProducts = totalProducts,
            RecentOrders = recentOrders
        };
    }
}
