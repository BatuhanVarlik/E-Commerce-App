using ETicaret.Domain.Common;

namespace ETicaret.Domain.Entities;

public class PasswordReset : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    
    // Navigation
    public User User { get; set; } = null!;
}
