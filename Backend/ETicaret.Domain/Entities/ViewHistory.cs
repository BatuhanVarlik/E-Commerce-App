using ETicaret.Domain.Common;

namespace ETicaret.Domain.Entities;

public class ViewHistory : BaseEntity
{
    public string? UserId { get; set; } // User.Id is string (Identity)
    public string? SessionId { get; set; } // For guest users
    public Guid ProductId { get; set; }
    public DateTime ViewedAt { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    
    // Navigation properties
    public virtual User? User { get; set; }
    public virtual Product Product { get; set; } = null!;
}
