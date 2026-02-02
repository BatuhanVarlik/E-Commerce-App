using ETicaret.Application.DTOs.Product;

namespace ETicaret.Application.Interfaces;

public interface IRecommendationService
{
    Task<List<RecommendedProductDto>> GetSimilarProductsAsync(Guid productId, int count = 6);
    Task<List<RecommendedProductDto>> GetFrequentlyBoughtTogetherAsync(Guid productId, int count = 6);
    Task<List<RecommendedProductDto>> GetPersonalizedRecommendationsAsync(Guid? userId, string? sessionId, int count = 12);
    Task<ProductRecommendationsDto> GetAllRecommendationsAsync(Guid productId, Guid? userId, string? sessionId);
    Task TrackProductViewAsync(Guid productId, Guid? userId, string? sessionId, string? ipAddress, string? userAgent);
}
