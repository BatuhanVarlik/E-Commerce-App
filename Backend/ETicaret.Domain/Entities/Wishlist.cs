using ETicaret.Domain.Common;

namespace ETicaret.Domain.Entities;

public class Wishlist : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public Guid ProductId { get; set; }

    // Navigation Properties
    public User User { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
