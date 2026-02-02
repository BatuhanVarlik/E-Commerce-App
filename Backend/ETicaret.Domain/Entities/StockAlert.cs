using ETicaret.Domain.Common;

namespace ETicaret.Domain.Entities;

public class StockAlert : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? NotifiedAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
