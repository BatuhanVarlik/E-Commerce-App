namespace ETicaret.Application.DTOs;

public class StockCheckDto
{
    public Guid ProductId { get; set; }
    public int RequestedQuantity { get; set; }
    public int AvailableStock { get; set; }
    public bool IsAvailable { get; set; }
    public string? Message { get; set; }
}

public class StockCheckRequest
{
    public List<CartItemDto> Items { get; set; } = new();
}

public class StockCheckResponse
{
    public bool AllItemsAvailable { get; set; }
    public List<StockCheckDto> Results { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

public class CartItemDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
}
