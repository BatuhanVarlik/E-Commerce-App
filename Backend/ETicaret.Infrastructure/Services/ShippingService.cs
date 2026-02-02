using ETicaret.Application.DTOs.Shipment;
using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ETicaret.Infrastructure.Services;

public class ShippingService : IShippingService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ShippingService> _logger;
    private readonly IEmailService _emailService;

    public ShippingService(
        ApplicationDbContext context, 
        ILogger<ShippingService> logger,
        IEmailService emailService)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
    }

    public async Task<ShipmentDto> CreateShipmentAsync(CreateShipmentDto dto)
    {
        // Verify order exists
        var order = await _context.Orders.FindAsync(dto.OrderId);
        if (order == null)
        {
            throw new Exception("Sipariş bulunamadı");
        }

        // Check if shipment already exists
        var existingShipment = await _context.Shipments
            .FirstOrDefaultAsync(s => s.OrderId == dto.OrderId);
        
        if (existingShipment != null)
        {
            throw new Exception("Bu sipariş için zaten kargo kaydı oluşturulmuş");
        }

        var shipment = new Shipment
        {
            OrderId = dto.OrderId,
            TrackingNumber = GenerateTrackingNumber(),
            ShippingCompany = (ShippingCompany)dto.ShippingCompany,
            Status = ShipmentStatus.Processing,
            ShippingAddress = dto.ShippingAddress,
            City = dto.City,
            District = dto.District,
            PostalCode = dto.PostalCode,
            ShippingCost = dto.ShippingCost,
            EstimatedDeliveryDate = DateTime.UtcNow.AddDays(dto.EstimatedDaysForDelivery)
        };

        // Add initial tracking entry
        shipment.TrackingHistory.Add(new ShipmentTracking
        {
            ShipmentId = shipment.Id,
            Status = ShipmentStatus.Processing,
            Location = "Depo",
            Description = "Sipariş hazırlanıyor",
            Timestamp = DateTime.UtcNow
        });

        _context.Shipments.Add(shipment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Shipment created for Order {OrderId} with tracking number {TrackingNumber}", 
            dto.OrderId, shipment.TrackingNumber);

        return await GetShipmentDtoAsync(shipment.Id);
    }

    public async Task<ShipmentDto?> GetShipmentByOrderIdAsync(Guid orderId)
    {
        var shipment = await _context.Shipments
            .Include(s => s.TrackingHistory.OrderBy(t => t.Timestamp))
            .FirstOrDefaultAsync(s => s.OrderId == orderId);

        return shipment != null ? MapToDto(shipment) : null;
    }

    public async Task<ShipmentDto?> GetShipmentByTrackingNumberAsync(string trackingNumber)
    {
        var shipment = await _context.Shipments
            .Include(s => s.TrackingHistory.OrderBy(t => t.Timestamp))
            .FirstOrDefaultAsync(s => s.TrackingNumber == trackingNumber);

        return shipment != null ? MapToDto(shipment) : null;
    }

    public async Task<ShipmentDto> UpdateShipmentStatusAsync(Guid shipmentId, UpdateShipmentStatusDto dto)
    {
        var shipment = await _context.Shipments
            .Include(s => s.TrackingHistory)
            .FirstOrDefaultAsync(s => s.Id == shipmentId);

        if (shipment == null)
        {
            throw new Exception("Kargo kaydı bulunamadı");
        }

        var newStatus = (ShipmentStatus)dto.Status;
        shipment.Status = newStatus;

        // Get order for email
        var order = await _context.Orders.FindAsync(shipment.OrderId);

        // Update dates based on status
        if (newStatus == ShipmentStatus.Shipped && !shipment.ShippedDate.HasValue)
        {
            shipment.ShippedDate = DateTime.UtcNow;
            
            // Send shipped email
            if (order != null)
            {
                try
                {
                    await _emailService.SendOrderShippedEmailAsync(
                        order.UserEmail,
                        order.OrderNumber,
                        shipment.TrackingNumber,
                        shipment.ShippingCompany.ToString()
                    );
                    _logger.LogInformation("Shipped email sent for order {OrderNumber}", order.OrderNumber);
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Failed to send shipped email for order {OrderNumber}", order.OrderNumber);
                }
            }
        }
        else if (newStatus == ShipmentStatus.Delivered && !shipment.ActualDeliveryDate.HasValue)
        {
            shipment.ActualDeliveryDate = DateTime.UtcNow;
            
            // Send delivered email
            if (order != null)
            {
                try
                {
                    await _emailService.SendOrderDeliveredEmailAsync(
                        order.UserEmail,
                        order.OrderNumber
                    );
                    _logger.LogInformation("Delivered email sent for order {OrderNumber}", order.OrderNumber);
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Failed to send delivered email for order {OrderNumber}", order.OrderNumber);
                }
            }
        }

        // Add tracking entry
        shipment.TrackingHistory.Add(new ShipmentTracking
        {
            ShipmentId = shipmentId,
            Status = newStatus,
            Location = dto.Location,
            Description = dto.Description,
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        _logger.LogInformation("Shipment {ShipmentId} status updated to {Status}", 
            shipmentId, newStatus);

        return await GetShipmentDtoAsync(shipmentId);
    }

    public async Task<List<ShipmentDto>> GetShipmentsByUserIdAsync(string userId)
    {
        var shipments = await _context.Shipments
            .Include(s => s.Order)
            .Include(s => s.TrackingHistory.OrderBy(t => t.Timestamp))
            .Where(s => s.Order.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return shipments.Select(MapToDto).ToList();
    }

    private async Task<ShipmentDto> GetShipmentDtoAsync(Guid shipmentId)
    {
        var shipment = await _context.Shipments
            .Include(s => s.TrackingHistory.OrderBy(t => t.Timestamp))
            .FirstAsync(s => s.Id == shipmentId);

        return MapToDto(shipment);
    }

    private static ShipmentDto MapToDto(Shipment s)
    {
        return new ShipmentDto
        {
            Id = s.Id,
            OrderId = s.OrderId,
            TrackingNumber = s.TrackingNumber,
            ShippingCompany = s.ShippingCompany.ToString(),
            Status = s.Status.ToString(),
            StatusDescription = GetStatusDescription(s.Status),
            ShippingAddress = s.ShippingAddress,
            City = s.City,
            District = s.District,
            PostalCode = s.PostalCode,
            ShippedDate = s.ShippedDate,
            EstimatedDeliveryDate = s.EstimatedDeliveryDate,
            ActualDeliveryDate = s.ActualDeliveryDate,
            ShippingCost = s.ShippingCost,
            Notes = s.Notes,
            TrackingHistory = s.TrackingHistory.Select(t => new ShipmentTrackingDto
            {
                Id = t.Id,
                Status = t.Status.ToString(),
                StatusDescription = GetStatusDescription(t.Status),
                Location = t.Location,
                Description = t.Description,
                Timestamp = t.Timestamp
            }).ToList()
        };
    }

    private static string GetStatusDescription(ShipmentStatus status)
    {
        return status switch
        {
            ShipmentStatus.Processing => "Sipariş hazırlanıyor",
            ShipmentStatus.ReadyToShip => "Kargoya hazır",
            ShipmentStatus.Shipped => "Kargoya verildi",
            ShipmentStatus.InTransit => "Dağıtım merkezinde",
            ShipmentStatus.OutForDelivery => "Dağıtımda",
            ShipmentStatus.Delivered => "Teslim edildi",
            ShipmentStatus.Returned => "İade edildi",
            ShipmentStatus.Cancelled => "İptal edildi",
            _ => status.ToString()
        };
    }

    private static string GenerateTrackingNumber()
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var random = new Random().Next(1000, 9999);
        return $"TRK{timestamp}{random}";
    }
}
