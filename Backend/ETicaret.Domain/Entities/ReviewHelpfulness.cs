using ETicaret.Domain.Common;

namespace ETicaret.Domain.Entities;

public class ReviewHelpfulness : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public Guid ReviewId { get; set; }
    public bool IsHelpful { get; set; } // true = yararlı, false = yararsız

    // Navigation Properties
    public User User { get; set; } = null!;
    public Review Review { get; set; } = null!;
}
