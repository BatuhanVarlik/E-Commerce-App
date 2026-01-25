using ETicaret.Domain.Common;

namespace ETicaret.Domain.Entities;

public class Review : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public Guid ProductId { get; set; }
    public int Rating { get; set; } // 1-5 yıldız
    public string Comment { get; set; } = string.Empty;
    public string? ImageUrl { get; set; } // Opsiyonel resim
    public bool IsApproved { get; set; } = false; // Admin onayı
    public int HelpfulCount { get; set; } = 0;
    public int NotHelpfulCount { get; set; } = 0;

    // Navigation Properties
    public User User { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
