namespace ETicaret.Application.DTOs.Shipment;

public class ShipmentDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public string ShippingCompany { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StatusDescription { get; set; } = string.Empty;
    
    public string ShippingAddress { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    
    public DateTime? ShippedDate { get; set; }
    public DateTime? EstimatedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    
    public decimal ShippingCost { get; set; }
    public string? Notes { get; set; }
    
    public List<ShipmentTrackingDto> TrackingHistory { get; set; } = new();
}

public class ShipmentTrackingDto
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string StatusDescription { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class CreateShipmentDto
{
    public Guid OrderId { get; set; }
    public int ShippingCompany { get; set; } // Enum as int
    public string ShippingAddress { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public decimal ShippingCost { get; set; }
    public int EstimatedDaysForDelivery { get; set; } = 3;
}

public class UpdateShipmentStatusDto
{
    public int Status { get; set; } // ShipmentStatus as int
    public string Location { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
