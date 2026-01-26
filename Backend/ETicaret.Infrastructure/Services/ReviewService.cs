using ETicaret.Application.DTOs.Review;
using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ETicaret.Infrastructure.Services;

public class ReviewService : IReviewService
{
    private readonly ApplicationDbContext _context;

    public ReviewService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ReviewDto> CreateReviewAsync(string userId, CreateReviewDto dto)
    {
        var productGuid = Guid.Parse(dto.ProductId);
        
        // Kullanıcının bu ürünü zaten değerlendirip değerlendirmediğini kontrol et
        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.UserId == userId && r.ProductId == productGuid);

        if (existingReview != null)
        {
            throw new InvalidOperationException("Bu ürünü zaten değerlendirdiniz.");
        }

        var review = new Review
        {
            UserId = userId,
            ProductId = productGuid,
            Rating = dto.Rating,
            Comment = dto.Comment ?? string.Empty,
            ImageUrl = dto.ImageUrl,
            // Eğer yorum boşsa (sadece rating varsa) otomatik onayla
            IsApproved = string.IsNullOrEmpty(dto.Comment?.Trim())
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        return await GetReviewDtoAsync(review.Id.ToString());
    }

    public async Task<ReviewDto> UpdateReviewAsync(string userId, string reviewId, UpdateReviewDto dto)
    {
        var reviewGuid = Guid.Parse(reviewId);
        
        var review = await _context.Reviews.FindAsync(reviewGuid);
        if (review == null || review.UserId != userId)
        {
            throw new UnauthorizedAccessException("Bu yorumu güncelleme yetkiniz yok.");
        }

        review.Rating = dto.Rating;
        review.Comment = dto.Comment;
        review.ImageUrl = dto.ImageUrl;
        review.IsApproved = false;

        await _context.SaveChangesAsync();
        return await GetReviewDtoAsync(review.Id.ToString());
    }

    public async Task DeleteReviewAsync(string userId, string reviewId)
    {
        var reviewGuid = Guid.Parse(reviewId);
        
        var review = await _context.Reviews.FindAsync(reviewGuid);
        if (review == null || review.UserId != userId)
        {
            throw new UnauthorizedAccessException("Bu yorumu silme yetkiniz yok.");
        }

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();
    }

    public async Task<ProductReviewsDto> GetProductReviewsAsync(string productId, int page = 1, int pageSize = 10)
    {
        var productGuid = Guid.Parse(productId);
        
        var query = _context.Reviews
            .Include(r => r.User)
            .Where(r => r.ProductId == productGuid && r.IsApproved)
            .OrderByDescending(r => r.CreatedAt);

        var totalCount = await query.CountAsync();
        var reviews = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Rating dağılımı hesapla
        var allRatings = await _context.Reviews
            .Where(r => r.ProductId == productGuid && r.IsApproved)
            .Select(r => r.Rating)
            .ToListAsync();

        var ratingDistribution = new Dictionary<int, int>
        {
            { 5, allRatings.Count(r => r == 5) },
            { 4, allRatings.Count(r => r == 4) },
            { 3, allRatings.Count(r => r == 3) },
            { 2, allRatings.Count(r => r == 2) },
            { 1, allRatings.Count(r => r == 1) }
        };

        var averageRating = allRatings.Any() ? allRatings.Average() : 0;

        return new ProductReviewsDto
        {
            Reviews = reviews.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            AverageRating = Math.Round(averageRating, 1),
            RatingDistribution = ratingDistribution
        };
    }

    public async Task<ReviewDto?> GetReviewByIdAsync(string reviewId)
    {
        var reviewGuid = Guid.Parse(reviewId);
        var review = await _context.Reviews
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == reviewGuid);

        return review != null ? MapToDto(review) : null;
    }

    public async Task<List<ReviewDto>> GetUserReviewsAsync(string userId)
    {
        var reviews = await _context.Reviews
            .Include(r => r.User)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return reviews.Select(MapToDto).ToList();
    }

    public async Task MarkReviewHelpfulAsync(string userId, string reviewId, bool isHelpful)
    {
        var reviewGuid = Guid.Parse(reviewId);
        
        // Kullanıcının daha önce oy verip vermediğini kontrol et
        var existingVote = await _context.ReviewHelpfulness
            .FirstOrDefaultAsync(h => h.UserId == userId && h.ReviewId == reviewGuid);

        if (existingVote != null)
        {
            // Oy değiştirme
            if (existingVote.IsHelpful != isHelpful)
            {
                var review = await _context.Reviews.FindAsync(reviewGuid);
                if (review != null)
                {
                    if (existingVote.IsHelpful)
                    {
                        review.HelpfulCount--;
                        review.NotHelpfulCount++;
                    }
                    else
                    {
                        review.NotHelpfulCount--;
                        review.HelpfulCount++;
                    }
                    existingVote.IsHelpful = isHelpful;
                }
            }
        }
        else
        {
            // Yeni oy
            var helpfulness = new ReviewHelpfulness
            {
                UserId = userId,
                ReviewId = reviewGuid,
                IsHelpful = isHelpful
            };

            _context.ReviewHelpfulness.Add(helpfulness);

            var review = await _context.Reviews.FindAsync(reviewGuid);
            if (review != null)
            {
                if (isHelpful)
                    review.HelpfulCount++;
                else
                    review.NotHelpfulCount++;
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task ApproveReviewAsync(string reviewId)
    {
        var reviewGuid = Guid.Parse(reviewId);
        var review = await _context.Reviews.FindAsync(reviewGuid);
        if (review == null)
        {
            throw new KeyNotFoundException("Yorum bulunamadı.");
        }

        review.IsApproved = true;
        await _context.SaveChangesAsync();
    }

    public async Task RejectReviewAsync(string reviewId)
    {
        var reviewGuid = Guid.Parse(reviewId);
        var review = await _context.Reviews.FindAsync(reviewGuid);
        if (review == null)
        {
            throw new KeyNotFoundException("Yorum bulunamadı.");
        }

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();
    }

    public async Task<List<ReviewDto>> GetPendingReviewsAsync()
    {
        var reviews = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.Product)
            .Where(r => !r.IsApproved)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();

        return reviews.Select(MapToDto).ToList();
    }

    public async Task<List<ReviewDto>> GetAllReviewsAsync()
    {
        var reviews = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.Product)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return reviews.Select(MapToDto).ToList();
    }

    private async Task<ReviewDto> GetReviewDtoAsync(string reviewId)
    {
        var reviewGuid = Guid.Parse(reviewId);
        var review = await _context.Reviews
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == reviewGuid);

        if (review == null)
        {
            throw new KeyNotFoundException("Yorum bulunamadı.");
        }

        return MapToDto(review);
    }

    private static ReviewDto MapToDto(Review review)
    {
        return new ReviewDto
        {
            Id = review.Id.ToString(),
            UserId = review.UserId,
            UserName = review.User?.UserName ?? "Anonim",
            ProductId = review.ProductId.ToString(),
            ProductName = review.Product?.Name,
            Rating = review.Rating,
            Comment = review.Comment,
            ImageUrl = review.ImageUrl,
            IsApproved = review.IsApproved,
            HelpfulCount = review.HelpfulCount,
            NotHelpfulCount = review.NotHelpfulCount,
            CreatedAt = review.CreatedAt
        };
    }
}
