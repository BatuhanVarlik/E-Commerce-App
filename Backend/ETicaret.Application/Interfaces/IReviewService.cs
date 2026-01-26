using ETicaret.Application.DTOs.Review;

namespace ETicaret.Application.Interfaces;

public interface IReviewService
{
    Task<ReviewDto> CreateReviewAsync(string userId, CreateReviewDto dto);
    Task<ReviewDto> UpdateReviewAsync(string userId, string reviewId, UpdateReviewDto dto);
    Task DeleteReviewAsync(string userId, string reviewId);
    Task<ProductReviewsDto> GetProductReviewsAsync(string productId, int page = 1, int pageSize = 10);
    Task<ReviewDto?> GetReviewByIdAsync(string reviewId);
    Task<List<ReviewDto>> GetUserReviewsAsync(string userId);
    Task MarkReviewHelpfulAsync(string userId, string reviewId, bool isHelpful);
    
    // Admin
    Task ApproveReviewAsync(string reviewId);
    Task RejectReviewAsync(string reviewId);
    Task<List<ReviewDto>> GetPendingReviewsAsync();
    Task<List<ReviewDto>> GetAllReviewsAsync();
}
