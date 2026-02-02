using ETicaret.Application.DTOs.Product;
using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ETicaret.Infrastructure.Services;

public class RecommendationService : IRecommendationService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<RecommendationService> _logger;

    public RecommendationService(ApplicationDbContext context, ILogger<RecommendationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<RecommendedProductDto>> GetSimilarProductsAsync(Guid productId, int count = 6)
    {
        try
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Brand)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
                return new List<RecommendedProductDto>();

            // Find similar products: same category, similar price range (±30%)
            var minPrice = product.Price * 0.7m;
            var maxPrice = product.Price * 1.3m;

            var similarProducts = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Brand)
                .Include(p => p.Reviews)
                .Where(p => p.Id != productId &&
                           p.CategoryId == product.CategoryId &&
                           p.Price >= minPrice &&
                           p.Price <= maxPrice &&
                           p.Stock > 0)
                .OrderByDescending(p => p.Reviews.Average(r => (double?)r.Rating) ?? 0)
                .ThenByDescending(p => p.Reviews.Count)
                .Take(count)
                .Select(p => new RecommendedProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Slug = p.Slug,
                    Price = p.Price,
                    ImageUrl = p.ImageUrl,
                    CategoryName = p.Category!.Name,
                    BrandName = p.Brand!.Name,
                    AverageRating = p.Reviews.Average(r => (double?)r.Rating) ?? 0,
                    ReviewCount = p.Reviews.Count,
                    Stock = p.Stock,
                    RecommendationReason = "Benzer Ürün"
                })
                .ToListAsync();

            return similarProducts;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting similar products for product {ProductId}", productId);
            return new List<RecommendedProductDto>();
        }
    }

    public async Task<List<RecommendedProductDto>> GetFrequentlyBoughtTogetherAsync(Guid productId, int count = 6)
    {
        try
        {
            // Find products that were bought together in the same orders
            var frequentlyBoughtWith = await _context.OrderItems
                .Where(oi => oi.ProductId == productId)
                .Join(_context.OrderItems,
                    oi1 => oi1.OrderId,
                    oi2 => oi2.OrderId,
                    (oi1, oi2) => oi2)
                .Where(oi => oi.ProductId != productId)
                .GroupBy(oi => oi.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    Count = g.Count()
                })
                .OrderByDescending(x => x.Count)
                .Take(count)
                .Join(_context.Products
                        .Include(p => p.Category)
                        .Include(p => p.Brand)
                        .Include(p => p.Reviews),
                    x => x.ProductId,
                    p => p.Id,
                    (x, p) => new RecommendedProductDto
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Slug = p.Slug,
                        Price = p.Price,
                        ImageUrl = p.ImageUrl,
                        CategoryName = p.Category!.Name,
                        BrandName = p.Brand!.Name,
                        AverageRating = p.Reviews.Average(r => (double?)r.Rating) ?? 0,
                        ReviewCount = p.Reviews.Count,
                        Stock = p.Stock,
                        RecommendationReason = "Sıkça Birlikte Alınan"
                    })
                .ToListAsync();

            return frequentlyBoughtWith;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting frequently bought together products for product {ProductId}", productId);
            return new List<RecommendedProductDto>();
        }
    }

    public async Task<List<RecommendedProductDto>> GetPersonalizedRecommendationsAsync(Guid? userId, string? sessionId, int count = 12)
    {
        try
        {
            var recommendations = new List<RecommendedProductDto>();
            var userIdString = userId?.ToString();

            // 1. Based on view history (last 30 days)
            var viewedCategoryIds = await _context.ViewHistories
                .Where(vh => (userId.HasValue && vh.UserId == userIdString) ||
                           (!userId.HasValue && vh.SessionId == sessionId))
                .Where(vh => vh.ViewedAt >= DateTime.UtcNow.AddDays(-30))
                .Join(_context.Products, vh => vh.ProductId, p => p.Id, (vh, p) => p.CategoryId)
                .Distinct()
                .ToListAsync();

            if (viewedCategoryIds.Any())
            {
                var categoryBasedProducts = await _context.Products
                    .Include(p => p.Category)
                    .Include(p => p.Brand)
                    .Include(p => p.Reviews)
                    .Where(p => viewedCategoryIds.Contains(p.CategoryId) && p.Stock > 0)
                    .OrderByDescending(p => p.Reviews.Average(r => (double?)r.Rating) ?? 0)
                    .ThenByDescending(p => p.Reviews.Count)
                    .Take(count / 2)
                    .Select(p => new RecommendedProductDto
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Slug = p.Slug,
                        Price = p.Price,
                        ImageUrl = p.ImageUrl,
                        CategoryName = p.Category!.Name,
                        BrandName = p.Brand!.Name,
                        AverageRating = p.Reviews.Average(r => (double?)r.Rating) ?? 0,
                        ReviewCount = p.Reviews.Count,
                        Stock = p.Stock,
                        RecommendationReason = "Görüntüleme Geçmişinize Göre"
                    })
                    .ToListAsync();

                recommendations.AddRange(categoryBasedProducts);
            }

            // 2. Based on wishlist
            if (userId.HasValue)
            {
                var wishlistCategoryIds = await _context.Wishlists
                    .Where(w => w.UserId == userId.Value.ToString())
                    .Join(_context.Products, w => w.ProductId, p => p.Id, (w, p) => p.CategoryId)
                    .Distinct()
                    .ToListAsync();

                if (wishlistCategoryIds.Any())
                {
                    var wishlistBasedProducts = await _context.Products
                        .Include(p => p.Category)
                        .Include(p => p.Brand)
                        .Include(p => p.Reviews)
                        .Where(p => wishlistCategoryIds.Contains(p.CategoryId) && 
                                   p.Stock > 0 &&
                                   !recommendations.Select(r => r.Id).Contains(p.Id))
                        .OrderByDescending(p => p.Reviews.Average(r => (double?)r.Rating) ?? 0)
                        .Take(count / 4)
                        .Select(p => new RecommendedProductDto
                        {
                            Id = p.Id,
                            Name = p.Name,
                            Slug = p.Slug,
                            Price = p.Price,
                            ImageUrl = p.ImageUrl,
                            CategoryName = p.Category!.Name,
                            BrandName = p.Brand!.Name,
                            AverageRating = p.Reviews.Average(r => (double?)r.Rating) ?? 0,
                            ReviewCount = p.Reviews.Count,
                            Stock = p.Stock,
                            RecommendationReason = "Favori Listenize Göre"
                        })
                        .ToListAsync();

                    recommendations.AddRange(wishlistBasedProducts);
                }
            }

            // 3. Fill remaining with popular products
            var remainingCount = count - recommendations.Count;
            if (remainingCount > 0)
            {
                var popularProducts = await _context.Products
                    .Include(p => p.Category)
                    .Include(p => p.Brand)
                    .Include(p => p.Reviews)
                    .Where(p => p.Stock > 0 && !recommendations.Select(r => r.Id).Contains(p.Id))
                    .OrderByDescending(p => p.Reviews.Count)
                    .ThenByDescending(p => p.Reviews.Average(r => (double?)r.Rating) ?? 0)
                    .Take(remainingCount)
                    .Select(p => new RecommendedProductDto
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Slug = p.Slug,
                        Price = p.Price,
                        ImageUrl = p.ImageUrl,
                        CategoryName = p.Category!.Name,
                        BrandName = p.Brand!.Name,
                        AverageRating = p.Reviews.Average(r => (double?)r.Rating) ?? 0,
                        ReviewCount = p.Reviews.Count,
                        Stock = p.Stock,
                        RecommendationReason = "Popüler Ürünler"
                    })
                    .ToListAsync();

                recommendations.AddRange(popularProducts);
            }

            return recommendations.Take(count).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting personalized recommendations for user {UserId} / session {SessionId}", userId, sessionId);
            
            // Fallback: Return popular products
            return await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Brand)
                .Include(p => p.Reviews)
                .Where(p => p.Stock > 0)
                .OrderByDescending(p => p.Reviews.Count)
                .Take(count)
                .Select(p => new RecommendedProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Slug = p.Slug,
                    Price = p.Price,
                    ImageUrl = p.ImageUrl,
                    CategoryName = p.Category!.Name,
                    BrandName = p.Brand!.Name,
                    AverageRating = p.Reviews.Average(r => (double?)r.Rating) ?? 0,
                    ReviewCount = p.Reviews.Count,
                    Stock = p.Stock,
                    RecommendationReason = "Önerilen Ürünler"
                })
                .ToListAsync();
        }
    }

    public async Task<ProductRecommendationsDto> GetAllRecommendationsAsync(Guid productId, Guid? userId, string? sessionId)
    {
        var similar = await GetSimilarProductsAsync(productId, 6);
        var frequentlyBought = await GetFrequentlyBoughtTogetherAsync(productId, 6);
        var personalized = await GetPersonalizedRecommendationsAsync(userId, sessionId, 12);

        return new ProductRecommendationsDto
        {
            SimilarProducts = similar,
            FrequentlyBoughtTogether = frequentlyBought,
            PersonalizedForYou = personalized
        };
    }

    public async Task TrackProductViewAsync(Guid productId, Guid? userId, string? sessionId, string? ipAddress, string? userAgent)
    {
        try
        {
            // Don't track if product doesn't exist
            var productExists = await _context.Products.AnyAsync(p => p.Id == productId);
            if (!productExists)
                return;

            var userIdString = userId?.ToString();

            // Check if already viewed in last hour (prevent duplicate tracking)
            var oneHourAgo = DateTime.UtcNow.AddHours(-1);
            var recentView = await _context.ViewHistories
                .AnyAsync(vh => vh.ProductId == productId &&
                               ((userId.HasValue && vh.UserId == userIdString) ||
                                (!userId.HasValue && vh.SessionId == sessionId)) &&
                               vh.ViewedAt >= oneHourAgo);

            if (recentView)
                return;

            var viewHistory = new ViewHistory
            {
                ProductId = productId,
                UserId = userIdString,
                SessionId = sessionId,
                ViewedAt = DateTime.UtcNow,
                IpAddress = ipAddress,
                UserAgent = userAgent
            };

            _context.ViewHistories.Add(viewHistory);
            await _context.SaveChangesAsync();

            // Clean old view history (keep last 90 days)
            var ninetyDaysAgo = DateTime.UtcNow.AddDays(-90);
            var oldViews = await _context.ViewHistories
                .Where(vh => vh.ViewedAt < ninetyDaysAgo)
                .ToListAsync();

            if (oldViews.Any())
            {
                _context.ViewHistories.RemoveRange(oldViews);
                await _context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking product view for product {ProductId}", productId);
        }
    }
}
