using System;
using System.Collections.Generic;

namespace ETicaret.Application.DTOs.Social;

// ===== Referral DTOs =====

public class ReferralDto
{
    public Guid Id { get; set; }
    public string ReferralCode { get; set; } = string.Empty;
    public string ReferralLink { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int ClickCount { get; set; }
    public string? ReferredUserName { get; set; }
    public string? ReferredUserEmail { get; set; }
    public int ReferrerPoints { get; set; }
    public int ReferredPoints { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class CreateReferralResponse
{
    public string ReferralCode { get; set; } = string.Empty;
    public string ReferralLink { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

public class ReferralStatsDto
{
    public int TotalReferrals { get; set; }
    public int PendingReferrals { get; set; }
    public int CompletedReferrals { get; set; }
    public int TotalPointsEarned { get; set; }
    public int TotalClicks { get; set; }
    public decimal ConversionRate { get; set; }
    public List<ReferralDto> RecentReferrals { get; set; } = new();
}

public class ApplyReferralRequest
{
    public string ReferralCode { get; set; } = string.Empty;
}

// ===== Points DTOs =====

public class UserPointsDto
{
    public int TotalEarned { get; set; }
    public int TotalSpent { get; set; }
    public int CurrentBalance { get; set; }
    public string Tier { get; set; } = string.Empty;
    public string TierDisplayName { get; set; } = string.Empty;
    public decimal TierDiscount { get; set; }
    public int PointsToNextTier { get; set; }
    public string NextTier { get; set; } = string.Empty;
    public decimal PointsValue { get; set; } // TL cinsinden değer
    public List<PointTransactionDto> RecentTransactions { get; set; } = new();
}

public class PointTransactionDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string TypeDisplayName { get; set; } = string.Empty;
    public int Points { get; set; }
    public string Description { get; set; } = string.Empty;
    public Guid? OrderId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RedeemPointsRequest
{
    public int Points { get; set; }
}

public class RedeemPointsResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
    public int RemainingPoints { get; set; }
}

public class EarnPointsRequest
{
    public decimal OrderTotal { get; set; }
    public Guid OrderId { get; set; }
}

// ===== Social Share DTOs =====

public class SocialShareDto
{
    public string ProductName { get; set; } = string.Empty;
    public string ProductUrl { get; set; } = string.Empty;
    public string ProductImage { get; set; } = string.Empty;
    public decimal ProductPrice { get; set; }
    public string Description { get; set; } = string.Empty;
    
    // Share URLs
    public string FacebookShareUrl { get; set; } = string.Empty;
    public string TwitterShareUrl { get; set; } = string.Empty;
    public string WhatsAppShareUrl { get; set; } = string.Empty;
    public string TelegramShareUrl { get; set; } = string.Empty;
    public string LinkedInShareUrl { get; set; } = string.Empty;
    public string PinterestShareUrl { get; set; } = string.Empty;
    public string EmailShareUrl { get; set; } = string.Empty;
}

public class ShareProductRequest
{
    public Guid ProductId { get; set; }
    public string Platform { get; set; } = string.Empty; // facebook, twitter, whatsapp, etc.
}

// ===== Leaderboard DTOs =====

public class LeaderboardEntryDto
{
    public int Rank { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? ProfilePhotoUrl { get; set; }
    public int TotalPoints { get; set; }
    public string Tier { get; set; } = string.Empty;
    public int ReferralCount { get; set; }
    public bool IsCurrentUser { get; set; }
}

public class LeaderboardDto
{
    public List<LeaderboardEntryDto> TopUsers { get; set; } = new();
    public LeaderboardEntryDto? CurrentUserRank { get; set; }
    public int TotalParticipants { get; set; }
}
