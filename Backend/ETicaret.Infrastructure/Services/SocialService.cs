using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ETicaret.Application.DTOs.Social;
using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;

namespace ETicaret.Infrastructure.Services;

public class ReferralService : IReferralService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ReferralService> _logger;
    private const string BaseUrl = "https://example.com"; // Config'den alınabilir

    public ReferralService(ApplicationDbContext context, ILogger<ReferralService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CreateReferralResponse> CreateReferralCodeAsync(string userId)
    {
        // Mevcut aktif referral kodu var mı kontrol et
        var existingReferral = await _context.Set<Referral>()
            .FirstOrDefaultAsync(r => r.ReferrerId == userId && 
                                      r.Status == ReferralStatus.Pending &&
                                      (r.ExpiresAt == null || r.ExpiresAt > DateTime.UtcNow));

        if (existingReferral != null)
        {
            return new CreateReferralResponse
            {
                ReferralCode = existingReferral.ReferralCode,
                ReferralLink = $"{BaseUrl}/register?ref={existingReferral.ReferralCode}",
                ExpiresAt = existingReferral.ExpiresAt ?? DateTime.UtcNow.AddMonths(1)
            };
        }

        // Yeni referral kodu oluştur
        var referralCode = GenerateReferralCode();
        var expiresAt = DateTime.UtcNow.AddMonths(1);

        var referral = new Referral
        {
            ReferrerId = userId,
            ReferralCode = referralCode,
            Status = ReferralStatus.Pending,
            ExpiresAt = expiresAt
        };

        _context.Set<Referral>().Add(referral);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created referral code {Code} for user {UserId}", referralCode, userId);

        return new CreateReferralResponse
        {
            ReferralCode = referralCode,
            ReferralLink = $"{BaseUrl}/register?ref={referralCode}",
            ExpiresAt = expiresAt
        };
    }

    public async Task<ReferralDto?> GetReferralByCodeAsync(string code)
    {
        var referral = await _context.Set<Referral>()
            .Include(r => r.Referrer)
            .Include(r => r.ReferredUser)
            .FirstOrDefaultAsync(r => r.ReferralCode == code);

        if (referral == null) return null;

        return MapToDto(referral);
    }

    public async Task<bool> TrackReferralClickAsync(string code)
    {
        var referral = await _context.Set<Referral>()
            .FirstOrDefaultAsync(r => r.ReferralCode == code && 
                                      r.Status == ReferralStatus.Pending);

        if (referral == null) return false;

        referral.ClickCount++;
        if (referral.Status == ReferralStatus.Pending)
        {
            referral.Status = ReferralStatus.Clicked;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ApplyReferralAsync(string newUserId, string code)
    {
        var referral = await _context.Set<Referral>()
            .FirstOrDefaultAsync(r => r.ReferralCode == code &&
                                      (r.Status == ReferralStatus.Pending || r.Status == ReferralStatus.Clicked) &&
                                      (r.ExpiresAt == null || r.ExpiresAt > DateTime.UtcNow));

        if (referral == null)
        {
            _logger.LogWarning("Referral code {Code} not found or expired", code);
            return false;
        }

        // Kendi kendine referans kontrolü
        if (referral.ReferrerId == newUserId)
        {
            _logger.LogWarning("User {UserId} tried to use their own referral code", newUserId);
            return false;
        }

        referral.ReferredUserId = newUserId;
        referral.Status = ReferralStatus.Registered;

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {NewUserId} registered with referral code {Code}", newUserId, code);
        return true;
    }

    public async Task<bool> CompleteReferralAsync(string userId, Guid orderId)
    {
        var referral = await _context.Set<Referral>()
            .FirstOrDefaultAsync(r => r.ReferredUserId == userId && 
                                      r.Status == ReferralStatus.Registered);

        if (referral == null) return false;

        referral.Status = ReferralStatus.Completed;
        referral.CompletedAt = DateTime.UtcNow;
        referral.ReferrerPoints = PointsConfig.ReferrerBonus;
        referral.ReferredPoints = PointsConfig.ReferredBonus;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Referral {ReferralId} completed for user {UserId}", referral.Id, userId);
        return true;
    }

    public async Task<ReferralStatsDto> GetUserReferralStatsAsync(string userId)
    {
        var referrals = await _context.Set<Referral>()
            .Include(r => r.ReferredUser)
            .Where(r => r.ReferrerId == userId)
            .ToListAsync();

        var totalReferrals = referrals.Count;
        var pendingReferrals = referrals.Count(r => r.Status == ReferralStatus.Pending || r.Status == ReferralStatus.Clicked || r.Status == ReferralStatus.Registered);
        var completedReferrals = referrals.Count(r => r.Status == ReferralStatus.Completed);
        var totalClicks = referrals.Sum(r => r.ClickCount);
        var totalPoints = referrals.Where(r => r.Status == ReferralStatus.Completed).Sum(r => r.ReferrerPoints);

        return new ReferralStatsDto
        {
            TotalReferrals = totalReferrals,
            PendingReferrals = pendingReferrals,
            CompletedReferrals = completedReferrals,
            TotalPointsEarned = totalPoints,
            TotalClicks = totalClicks,
            ConversionRate = totalClicks > 0 ? (decimal)completedReferrals / totalClicks * 100 : 0,
            RecentReferrals = referrals.OrderByDescending(r => r.CreatedAt).Take(5).Select(MapToDto).ToList()
        };
    }

    public async Task<List<ReferralDto>> GetUserReferralsAsync(string userId)
    {
        var referrals = await _context.Set<Referral>()
            .Include(r => r.ReferredUser)
            .Where(r => r.ReferrerId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return referrals.Select(MapToDto).ToList();
    }

    public async Task<string?> GetUserReferralCodeAsync(string userId)
    {
        var referral = await _context.Set<Referral>()
            .FirstOrDefaultAsync(r => r.ReferrerId == userId && 
                                      r.Status == ReferralStatus.Pending &&
                                      (r.ExpiresAt == null || r.ExpiresAt > DateTime.UtcNow));

        return referral?.ReferralCode;
    }

    private static string GenerateReferralCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 8).Select(s => s[random.Next(s.Length)]).ToArray());
    }

    private static ReferralDto MapToDto(Referral referral)
    {
        return new ReferralDto
        {
            Id = referral.Id,
            ReferralCode = referral.ReferralCode,
            ReferralLink = $"{BaseUrl}/register?ref={referral.ReferralCode}",
            Status = referral.Status.ToString(),
            ClickCount = referral.ClickCount,
            ReferredUserName = referral.ReferredUser != null ? $"{referral.ReferredUser.FirstName} {referral.ReferredUser.LastName}" : null,
            ReferredUserEmail = referral.ReferredUser?.Email,
            ReferrerPoints = referral.ReferrerPoints,
            ReferredPoints = referral.ReferredPoints,
            CreatedAt = referral.CreatedAt,
            CompletedAt = referral.CompletedAt,
            ExpiresAt = referral.ExpiresAt
        };
    }
}

public class PointsService : IPointsService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PointsService> _logger;

    public PointsService(ApplicationDbContext context, ILogger<PointsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<UserPointsDto> GetUserPointsAsync(string userId)
    {
        var userPoints = await GetOrCreateUserPointsAsync(userId);
        var transactions = await GetPointTransactionsAsync(userId, 1, 5);

        var nextTier = GetNextTier(userPoints.Tier);
        var pointsToNextTier = GetPointsToNextTier(userPoints.TotalEarned, userPoints.Tier);

        return new UserPointsDto
        {
            TotalEarned = userPoints.TotalEarned,
            TotalSpent = userPoints.TotalSpent,
            CurrentBalance = userPoints.CurrentBalance,
            Tier = userPoints.Tier.ToString(),
            TierDisplayName = GetTierDisplayName(userPoints.Tier),
            TierDiscount = PointsConfig.GetTierDiscount(userPoints.Tier) * 100,
            PointsToNextTier = pointsToNextTier,
            NextTier = nextTier?.ToString() ?? "",
            PointsValue = userPoints.CurrentBalance * PointsConfig.TLPerPoint,
            RecentTransactions = transactions
        };
    }

    public async Task<List<PointTransactionDto>> GetPointTransactionsAsync(string userId, int page = 1, int pageSize = 20)
    {
        var transactions = await _context.Set<PointTransaction>()
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return transactions.Select(t => new PointTransactionDto
        {
            Id = t.Id,
            Type = t.Type.ToString(),
            TypeDisplayName = GetTransactionTypeDisplayName(t.Type),
            Points = t.Points,
            Description = t.Description,
            OrderId = t.OrderId,
            CreatedAt = t.CreatedAt
        }).ToList();
    }

    public async Task<int> EarnPointsFromOrderAsync(string userId, Guid orderId, decimal orderTotal)
    {
        var points = (int)(orderTotal * PointsConfig.PointsPerTL);
        if (points <= 0) return 0;

        await AddTransactionAsync(userId, PointTransactionType.OrderPurchase, points,
            $"Sipariş #{orderId.ToString()[..8]} için puan kazandınız", orderId);

        _logger.LogInformation("User {UserId} earned {Points} points from order {OrderId}", userId, points, orderId);
        return points;
    }

    public async Task<int> EarnPointsFromReferralAsync(string userId, Guid referralId, bool isReferrer)
    {
        var points = isReferrer ? PointsConfig.ReferrerBonus : PointsConfig.ReferredBonus;
        var description = isReferrer 
            ? "Referans bonusu - arkadaşınız ilk siparişini verdi!" 
            : "Hoş geldin bonusu - referans ile kayıt oldunuz!";

        await AddTransactionAsync(userId, PointTransactionType.ReferralBonus, points, description, null, referralId);

        _logger.LogInformation("User {UserId} earned {Points} referral points", userId, points);
        return points;
    }

    public async Task<int> EarnWelcomeBonusAsync(string userId)
    {
        // Zaten welcome bonus aldı mı kontrol et
        var hasBonus = await _context.Set<PointTransaction>()
            .AnyAsync(t => t.UserId == userId && t.Type == PointTransactionType.WelcomeBonus);

        if (hasBonus) return 0;

        await AddTransactionAsync(userId, PointTransactionType.WelcomeBonus, PointsConfig.WelcomeBonus,
            "Hoş geldin bonusu! E-Ticaret'e katıldığınız için teşekkürler.");

        _logger.LogInformation("User {UserId} earned welcome bonus", userId);
        return PointsConfig.WelcomeBonus;
    }

    public async Task<int> EarnReviewBonusAsync(string userId, Guid reviewId)
    {
        await AddTransactionAsync(userId, PointTransactionType.ReviewBonus, PointsConfig.ReviewBonus,
            "Yorum yazma bonusu - değerlendirmeniz için teşekkürler!");

        _logger.LogInformation("User {UserId} earned review bonus for review {ReviewId}", userId, reviewId);
        return PointsConfig.ReviewBonus;
    }

    public async Task<int> EarnBirthdayBonusAsync(string userId)
    {
        // Bu yıl birthday bonus aldı mı kontrol et
        var thisYear = DateTime.UtcNow.Year;
        var hasBonus = await _context.Set<PointTransaction>()
            .AnyAsync(t => t.UserId == userId && 
                          t.Type == PointTransactionType.BirthdayBonus &&
                          t.CreatedAt.Year == thisYear);

        if (hasBonus) return 0;

        await AddTransactionAsync(userId, PointTransactionType.BirthdayBonus, PointsConfig.BirthdayBonus,
            "Doğum günün kutlu olsun! 🎂 İşte hediye puanların.");

        _logger.LogInformation("User {UserId} earned birthday bonus", userId);
        return PointsConfig.BirthdayBonus;
    }

    public async Task<int> AddBonusPointsAsync(string userId, int points, string description)
    {
        await AddTransactionAsync(userId, PointTransactionType.SpecialPromotion, points, description);

        _logger.LogInformation("Added {Points} bonus points to user {UserId}", points, userId);
        return points;
    }

    public async Task<RedeemPointsResponse> RedeemPointsAsync(string userId, int points)
    {
        if (points < PointsConfig.MinRedeemPoints)
        {
            return new RedeemPointsResponse
            {
                Success = false,
                Message = $"Minimum {PointsConfig.MinRedeemPoints} puan kullanabilirsiniz."
            };
        }

        var userPoints = await GetOrCreateUserPointsAsync(userId);
        if (userPoints.CurrentBalance < points)
        {
            return new RedeemPointsResponse
            {
                Success = false,
                Message = "Yeterli puanınız bulunmamaktadır."
            };
        }

        var discountAmount = points * PointsConfig.TLPerPoint;

        await AddTransactionAsync(userId, PointTransactionType.OrderRedemption, -points,
            $"{points} puan kullanıldı ({discountAmount:C2} indirim)");

        return new RedeemPointsResponse
        {
            Success = true,
            Message = $"{points} puan başarıyla kullanıldı!",
            DiscountAmount = discountAmount,
            RemainingPoints = userPoints.CurrentBalance - points
        };
    }

    public async Task<bool> UsePointsForOrderAsync(string userId, Guid orderId, int points)
    {
        var result = await RedeemPointsAsync(userId, points);
        return result.Success;
    }

    public async Task UpdateUserTierAsync(string userId)
    {
        var userPoints = await GetOrCreateUserPointsAsync(userId);
        var newTier = PointsConfig.CalculateTier(userPoints.TotalEarned);

        if (userPoints.Tier != newTier)
        {
            userPoints.Tier = newTier;
            userPoints.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} tier updated to {Tier}", userId, newTier);
        }
    }

    public async Task<decimal> GetTierDiscountAsync(string userId)
    {
        var userPoints = await GetOrCreateUserPointsAsync(userId);
        return PointsConfig.GetTierDiscount(userPoints.Tier);
    }

    public async Task<LeaderboardDto> GetLeaderboardAsync(string? currentUserId = null, int limit = 10)
    {
        var topUsers = await _context.Set<UserPoints>()
            .Include(up => up.User)
            .OrderByDescending(up => up.TotalEarned)
            .Take(limit)
            .ToListAsync();

        var referralCounts = await _context.Set<Referral>()
            .Where(r => r.Status == ReferralStatus.Completed)
            .GroupBy(r => r.ReferrerId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count);

        var leaderboard = topUsers.Select((up, index) => new LeaderboardEntryDto
        {
            Rank = index + 1,
            UserName = $"{up.User.FirstName} {up.User.LastName?[0]}.",
            ProfilePhotoUrl = up.User.ProfilePhotoUrl,
            TotalPoints = up.TotalEarned,
            Tier = up.Tier.ToString(),
            ReferralCount = referralCounts.GetValueOrDefault(up.UserId, 0),
            IsCurrentUser = !string.IsNullOrEmpty(currentUserId) && up.UserId == currentUserId
        }).ToList();

        LeaderboardEntryDto? currentUserRank = null;
        if (!string.IsNullOrEmpty(currentUserId) && !leaderboard.Any(l => l.IsCurrentUser))
        {
            var currentUserPoints = await _context.Set<UserPoints>()
                .Include(up => up.User)
                .FirstOrDefaultAsync(up => up.UserId == currentUserId);

            if (currentUserPoints != null)
            {
                var rank = await _context.Set<UserPoints>()
                    .CountAsync(up => up.TotalEarned > currentUserPoints.TotalEarned) + 1;

                currentUserRank = new LeaderboardEntryDto
                {
                    Rank = rank,
                    UserName = $"{currentUserPoints.User.FirstName} {currentUserPoints.User.LastName?[0]}.",
                    ProfilePhotoUrl = currentUserPoints.User.ProfilePhotoUrl,
                    TotalPoints = currentUserPoints.TotalEarned,
                    Tier = currentUserPoints.Tier.ToString(),
                    ReferralCount = referralCounts.GetValueOrDefault(currentUserPoints.UserId, 0),
                    IsCurrentUser = true
                };
            }
        }

        return new LeaderboardDto
        {
            TopUsers = leaderboard,
            CurrentUserRank = currentUserRank,
            TotalParticipants = await _context.Set<UserPoints>().CountAsync()
        };
    }

    private async Task<UserPoints> GetOrCreateUserPointsAsync(string userId)
    {
        var userPoints = await _context.Set<UserPoints>().FirstOrDefaultAsync(up => up.UserId == userId);
        
        if (userPoints == null)
        {
            userPoints = new UserPoints { UserId = userId };
            _context.Set<UserPoints>().Add(userPoints);
            await _context.SaveChangesAsync();
        }

        return userPoints;
    }

    private async Task AddTransactionAsync(string userId, PointTransactionType type, int points, 
        string description, Guid? orderId = null, Guid? referralId = null)
    {
        var transaction = new PointTransaction
        {
            UserId = userId,
            Type = type,
            Points = points,
            Description = description,
            OrderId = orderId,
            ReferralId = referralId
        };

        _context.Set<PointTransaction>().Add(transaction);

        var userPoints = await GetOrCreateUserPointsAsync(userId);
        if (points > 0)
            userPoints.TotalEarned += points;
        else
            userPoints.TotalSpent += Math.Abs(points);

        userPoints.UpdatedAt = DateTime.UtcNow;

        // Tier güncelle
        var newTier = PointsConfig.CalculateTier(userPoints.TotalEarned);
        userPoints.Tier = newTier;

        await _context.SaveChangesAsync();
    }

    private static MembershipTier? GetNextTier(MembershipTier currentTier)
    {
        return currentTier switch
        {
            MembershipTier.Bronze => MembershipTier.Silver,
            MembershipTier.Silver => MembershipTier.Gold,
            MembershipTier.Gold => MembershipTier.Platinum,
            MembershipTier.Platinum => null,
            _ => null
        };
    }

    private static int GetPointsToNextTier(int totalEarned, MembershipTier currentTier)
    {
        return currentTier switch
        {
            MembershipTier.Bronze => PointsConfig.SilverThreshold - totalEarned,
            MembershipTier.Silver => PointsConfig.GoldThreshold - totalEarned,
            MembershipTier.Gold => PointsConfig.PlatinumThreshold - totalEarned,
            MembershipTier.Platinum => 0,
            _ => 0
        };
    }

    private static string GetTierDisplayName(MembershipTier tier)
    {
        return tier switch
        {
            MembershipTier.Bronze => "Bronz Üye",
            MembershipTier.Silver => "Gümüş Üye",
            MembershipTier.Gold => "Altın Üye",
            MembershipTier.Platinum => "Platin Üye",
            _ => "Üye"
        };
    }

    private static string GetTransactionTypeDisplayName(PointTransactionType type)
    {
        return type switch
        {
            PointTransactionType.OrderPurchase => "Sipariş Puanı",
            PointTransactionType.OrderRedemption => "Puan Kullanımı",
            PointTransactionType.ReferralBonus => "Referans Bonusu",
            PointTransactionType.WelcomeBonus => "Hoş Geldin Bonusu",
            PointTransactionType.ReviewBonus => "Yorum Bonusu",
            PointTransactionType.BirthdayBonus => "Doğum Günü Bonusu",
            PointTransactionType.SpecialPromotion => "Özel Kampanya",
            PointTransactionType.Expired => "Süresi Dolan Puan",
            PointTransactionType.AdminAdjustment => "Admin Düzeltmesi",
            _ => "Diğer"
        };
    }
}

public class SocialShareService : ISocialShareService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SocialShareService> _logger;

    public SocialShareService(ApplicationDbContext context, ILogger<SocialShareService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<SocialShareDto> GetProductShareLinksAsync(Guid productId, string baseUrl)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null)
        {
            throw new KeyNotFoundException("Ürün bulunamadı");
        }

        var productUrl = $"{baseUrl}/products/{productId}";
        var encodedUrl = HttpUtility.UrlEncode(productUrl);
        var encodedTitle = HttpUtility.UrlEncode(product.Name);
        var encodedDescription = HttpUtility.UrlEncode($"{product.Name} - {product.Price:C2}");

        return new SocialShareDto
        {
            ProductName = product.Name,
            ProductUrl = productUrl,
            ProductImage = product.ImageUrl ?? "",
            ProductPrice = product.Price,
            Description = product.Description ?? "",
            FacebookShareUrl = $"https://www.facebook.com/sharer/sharer.php?u={encodedUrl}",
            TwitterShareUrl = $"https://twitter.com/intent/tweet?url={encodedUrl}&text={encodedTitle}",
            WhatsAppShareUrl = $"https://wa.me/?text={encodedDescription}%20{encodedUrl}",
            TelegramShareUrl = $"https://t.me/share/url?url={encodedUrl}&text={encodedTitle}",
            LinkedInShareUrl = $"https://www.linkedin.com/shareArticle?mini=true&url={encodedUrl}&title={encodedTitle}",
            PinterestShareUrl = $"https://pinterest.com/pin/create/button/?url={encodedUrl}&description={encodedTitle}",
            EmailShareUrl = $"mailto:?subject={encodedTitle}&body={encodedDescription}%20{encodedUrl}"
        };
    }

    public async Task TrackShareAsync(string? userId, Guid productId, string platform)
    {
        // Paylaşım tracking için ViewHistory kullanabiliriz veya ayrı bir entity oluşturulabilir
        _logger.LogInformation("Product {ProductId} shared on {Platform} by user {UserId}", 
            productId, platform, userId ?? "anonymous");
        
        await Task.CompletedTask;
    }
}
