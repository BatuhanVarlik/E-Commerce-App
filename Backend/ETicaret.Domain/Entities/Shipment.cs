using ETicaret.Domain.Common;

namespace ETicaret.Domain.Entities;

public enum ShipmentStatus
{
    Processing = 0,      // Sipariş hazırlanıyor
    ReadyToShip = 1,     // Kargoya hazır
    Shipped = 2,         // Kargoya verildi
    InTransit = 3,       // Dağıtım merkezinde
    OutForDelivery = 4,  // Dağıtımda
    Delivered = 5,       // Teslim edildi
    Returned = 6,        // İade edildi
    Cancelled = 7        // İptal edildi
}

public enum ShippingCompany
{
    Aras = 1,
    Yurtici = 2,
    MNG = 3,
    PTT = 4,
    UPS = 5,
    DHL = 6
}

public class Shipment : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    
    public string TrackingNumber { get; set; } = string.Empty;
    public ShippingCompany ShippingCompany { get; set; }
    public ShipmentStatus Status { get; set; } = ShipmentStatus.Processing;
    
    // Addresses
    public string ShippingAddress { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    
    // Dates
    public DateTime? ShippedDate { get; set; }
    public DateTime? EstimatedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    
    // Additional Info
    public string? Notes { get; set; }
    public decimal ShippingCost { get; set; }
    
    // Tracking History
    public List<ShipmentTracking> TrackingHistory { get; set; } = new();
}

public class ShipmentTracking : BaseEntity
{
    public Guid ShipmentId { get; set; }
    public Shipment Shipment { get; set; } = null!;
    
    public ShipmentStatus Status { get; set; }
    public string Location { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
