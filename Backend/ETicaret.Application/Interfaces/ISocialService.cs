using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ETicaret.Application.DTOs.Social;

namespace ETicaret.Application.Interfaces;

public interface IReferralService
{
    // Referral işlemleri
    Task<CreateReferralResponse> CreateReferralCodeAsync(string userId);
    Task<ReferralDto?> GetReferralByCodeAsync(string code);
    Task<bool> TrackReferralClickAsync(string code);
    Task<bool> ApplyReferralAsync(string newUserId, string code);
    Task<bool> CompleteReferralAsync(string userId, Guid orderId);
    Task<ReferralStatsDto> GetUserReferralStatsAsync(string userId);
    Task<List<ReferralDto>> GetUserReferralsAsync(string userId);
    Task<string?> GetUserReferralCodeAsync(string userId);
}

public interface IPointsService
{
    // Puan sorgulama
    Task<UserPointsDto> GetUserPointsAsync(string userId);
    Task<List<PointTransactionDto>> GetPointTransactionsAsync(string userId, int page = 1, int pageSize = 20);
    
    // Puan kazanma
    Task<int> EarnPointsFromOrderAsync(string userId, Guid orderId, decimal orderTotal);
    Task<int> EarnPointsFromReferralAsync(string userId, Guid referralId, bool isReferrer);
    Task<int> EarnWelcomeBonusAsync(string userId);
    Task<int> EarnReviewBonusAsync(string userId, Guid reviewId);
    Task<int> EarnBirthdayBonusAsync(string userId);
    Task<int> AddBonusPointsAsync(string userId, int points, string description);
    
    // Puan harcama
    Task<RedeemPointsResponse> RedeemPointsAsync(string userId, int points);
    Task<bool> UsePointsForOrderAsync(string userId, Guid orderId, int points);
    
    // Tier işlemleri
    Task UpdateUserTierAsync(string userId);
    Task<decimal> GetTierDiscountAsync(string userId);
    
    // Leaderboard
    Task<LeaderboardDto> GetLeaderboardAsync(string? currentUserId = null, int limit = 10);
}

public interface ISocialShareService
{
    Task<SocialShareDto> GetProductShareLinksAsync(Guid productId, string baseUrl);
    Task TrackShareAsync(string? userId, Guid productId, string platform);
}
