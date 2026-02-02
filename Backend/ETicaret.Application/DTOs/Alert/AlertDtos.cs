namespace ETicaret.Application.DTOs.Alert;

public class PriceAlertDto
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal CurrentPrice { get; set; }
    public decimal TargetPrice { get; set; }
    public bool IsActive { get; set; }
    public DateTime? NotifiedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePriceAlertDto
{
    public Guid ProductId { get; set; }
    public decimal TargetPrice { get; set; }
}

public class StockAlertDto
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public bool IsActive { get; set; }
    public DateTime? NotifiedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateStockAlertDto
{
    public Guid ProductId { get; set; }
}
