using ETicaret.Domain.Common;

namespace ETicaret.Domain.Entities;

public class Order : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Paid, Shipped, Cancelled
    public string PaymentId { get; set; } = string.Empty; // Iyzico PaymentId
    
    // Address Info (Simplified for now, could be separate entity)
    public string ShippingAddress { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;

    public List<OrderItem> Items { get; set; } = new();
}

public class OrderItem : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public Guid ProductId { get; set; } // Reference to product
    public string ProductName { get; set; } = string.Empty;
    public decimal Price { get; set; } // Historical price
    public int Quantity { get; set; }
}
