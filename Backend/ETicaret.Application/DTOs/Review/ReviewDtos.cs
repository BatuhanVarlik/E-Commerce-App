namespace ETicaret.Application.DTOs.Review;

public class CreateReviewDto
{
    public string ProductId { get; set; } = string.Empty;
    public int Rating { get; set; } // 1-5
    public string Comment { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}

public class UpdateReviewDto
{
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}

public class ReviewDto
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string ProductId { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public bool IsApproved { get; set; }
    public int HelpfulCount { get; set; }
    public int NotHelpfulCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class MarkReviewHelpfulDto
{
    public string ReviewId { get; set; } = string.Empty;
    public bool IsHelpful { get; set; }
}

public class ProductReviewsDto
{
    public List<ReviewDto> Reviews { get; set; } = new();
    public int TotalCount { get; set; }
    public double AverageRating { get; set; }
    public Dictionary<int, int> RatingDistribution { get; set; } = new(); // Örn: {5: 10, 4: 5, 3: 2, 2: 1, 1: 0}
}
