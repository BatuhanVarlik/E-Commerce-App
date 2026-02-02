namespace ETicaret.Application.DTOs.Product;

public class RecommendedProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public int Stock { get; set; }
    public string RecommendationReason { get; set; } = string.Empty; // "Benzer Ürün", "Sıkça Birlikte Alınan", "Size Özel"
}

public class ProductRecommendationsDto
{
    public List<RecommendedProductDto> SimilarProducts { get; set; } = new();
    public List<RecommendedProductDto> FrequentlyBoughtTogether { get; set; } = new();
    public List<RecommendedProductDto> PersonalizedForYou { get; set; } = new();
}
