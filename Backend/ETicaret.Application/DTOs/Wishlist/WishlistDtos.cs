namespace ETicaret.Application.DTOs.Wishlist;

public class WishlistItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSlug { get; set; } = string.Empty;
    public decimal ProductPrice { get; set; }
    public int ProductStock { get; set; }
    public string ProductImageUrl { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public DateTime AddedAt { get; set; }
}

public class AddToWishlistRequest
{
    public Guid ProductId { get; set; }
}

public class WishlistResponse
{
    public List<WishlistItemDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
}
