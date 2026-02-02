namespace ETicaret.Application.DTOs.Order;

public class OrderDetailDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PaymentId { get; set; } = string.Empty;
    
    // Address Info
    public string ShippingAddress { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;
    
    // User Info
    public string UserEmail { get; set; } = string.Empty;
    
    // Items with extended info
    public List<OrderItemDetailDto> Items { get; set; } = new();
    
    // Computed
    public bool CanCancel => Status == "Pending" || Status == "Paid";
    public bool CanReorder => Status != "Cancelled";
}

public class OrderItemDetailDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductImageUrl { get; set; } = string.Empty;
    public string ProductSlug { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal Subtotal => Price * Quantity;
}
