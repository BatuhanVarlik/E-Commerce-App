using ETicaret.Application.DTOs.Shipment;

namespace ETicaret.Application.Interfaces;

public interface IShippingService
{
    Task<ShipmentDto> CreateShipmentAsync(CreateShipmentDto dto);
    Task<ShipmentDto?> GetShipmentByOrderIdAsync(Guid orderId);
    Task<ShipmentDto?> GetShipmentByTrackingNumberAsync(string trackingNumber);
    Task<ShipmentDto> UpdateShipmentStatusAsync(Guid shipmentId, UpdateShipmentStatusDto dto);
    Task<List<ShipmentDto>> GetShipmentsByUserIdAsync(string userId);
}
