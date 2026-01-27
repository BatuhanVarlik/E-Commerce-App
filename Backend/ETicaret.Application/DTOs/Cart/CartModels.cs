namespace ETicaret.Application.DTOs.Cart;

public class CartItem
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
}

public class CustomerCart
{
    public string Id { get; set; } = string.Empty; // UserId or GuestId
    public List<CartItem> Items { get; set; } = new();

    public CustomerCart() { }
    public CustomerCart(string id)
    {
        Id = id;
    }

    public decimal TotalPrice => Items.Sum(i => i.Price * i.Quantity);
}
