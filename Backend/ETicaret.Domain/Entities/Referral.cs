using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ETicaret.Domain.Entities;

namespace ETicaret.Domain.Entities;

/// <summary>
/// Referans sistemi - kullanıcıların arkadaşlarını davet etmesi
/// </summary>
public class Referral
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Referans kodu (örn: "ABC123")
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string ReferralCode { get; set; } = string.Empty;

    /// <summary>
    /// Referans veren kullanıcı
    /// </summary>
    [Required]
    public string ReferrerId { get; set; } = string.Empty;

    [ForeignKey(nameof(ReferrerId))]
    public virtual User Referrer { get; set; } = null!;

    /// <summary>
    /// Referans ile kayıt olan kullanıcı
    /// </summary>
    public string? ReferredUserId { get; set; }

    [ForeignKey(nameof(ReferredUserId))]
    public virtual User? ReferredUser { get; set; }

    /// <summary>
    /// Referans durumu
    /// </summary>
    public ReferralStatus Status { get; set; } = ReferralStatus.Pending;

    /// <summary>
    /// Referans veren için kazanılan puan
    /// </summary>
    public int ReferrerPoints { get; set; } = 0;

    /// <summary>
    /// Referans ile gelen için kazanılan puan
    /// </summary>
    public int ReferredPoints { get; set; } = 0;

    /// <summary>
    /// Referans linki tıklanma sayısı
    /// </summary>
    public int ClickCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public enum ReferralStatus
{
    Pending = 0,      // Davet gönderildi, bekliyor
    Clicked = 1,      // Link tıklandı
    Registered = 2,   // Kayıt oldu
    Completed = 3,    // İlk siparişi verdi (puan kazanıldı)
    Expired = 4       // Süresi doldu
}

/// <summary>
/// Kullanıcı puan sistemi
/// </summary>
public class UserPoints
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = string.Empty;

    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// Toplam kazanılan puan
    /// </summary>
    public int TotalEarned { get; set; } = 0;

    /// <summary>
    /// Toplam harcanan puan
    /// </summary>
    public int TotalSpent { get; set; } = 0;

    /// <summary>
    /// Mevcut kullanılabilir puan
    /// </summary>
    public int CurrentBalance => TotalEarned - TotalSpent;

    /// <summary>
    /// Üyelik seviyesi
    /// </summary>
    public MembershipTier Tier { get; set; } = MembershipTier.Bronze;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum MembershipTier
{
    Bronze = 0,    // 0 - 999 puan
    Silver = 1,    // 1000 - 4999 puan
    Gold = 2,      // 5000 - 9999 puan
    Platinum = 3   // 10000+ puan
}

/// <summary>
/// Puan işlem geçmişi
/// </summary>
public class PointTransaction
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = string.Empty;

    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;

    /// <summary>
    /// İşlem tipi
    /// </summary>
    public PointTransactionType Type { get; set; }

    /// <summary>
    /// Puan miktarı (pozitif: kazanç, negatif: harcama)
    /// </summary>
    public int Points { get; set; }

    /// <summary>
    /// İşlem açıklaması
    /// </summary>
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// İlgili sipariş (varsa)
    /// </summary>
    public Guid? OrderId { get; set; }

    /// <summary>
    /// İlgili referans (varsa)
    /// </summary>
    public Guid? ReferralId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum PointTransactionType
{
    OrderPurchase = 0,     // Sipariş ile puan kazanma
    OrderRedemption = 1,   // Sipariş ile puan harcama
    ReferralBonus = 2,     // Referans bonusu
    WelcomeBonus = 3,      // Hoşgeldin bonusu
    ReviewBonus = 4,       // Yorum yazma bonusu
    BirthdayBonus = 5,     // Doğum günü bonusu
    SpecialPromotion = 6,  // Özel kampanya
    Expired = 7,           // Süresi dolan puanlar
    AdminAdjustment = 8    // Admin düzeltmesi
}

/// <summary>
/// Puan sistemi ayarları
/// </summary>
public static class PointsConfig
{
    // Puan kazanma oranları
    public const decimal PointsPerTL = 1m;           // Her 1 TL = 1 puan
    public const int ReferrerBonus = 100;            // Referans veren için bonus
    public const int ReferredBonus = 50;             // Referans ile gelen için bonus
    public const int WelcomeBonus = 25;              // Hoşgeldin bonusu
    public const int ReviewBonus = 10;               // Yorum yazma bonusu
    public const int BirthdayBonus = 50;             // Doğum günü bonusu

    // Puan harcama
    public const decimal TLPerPoint = 0.1m;          // Her 1 puan = 0.10 TL
    public const int MinRedeemPoints = 100;          // Minimum harcama puanı

    // Tier eşikleri
    public const int SilverThreshold = 1000;
    public const int GoldThreshold = 5000;
    public const int PlatinumThreshold = 10000;

    // Tier indirimleri
    public const decimal BronzeDiscount = 0m;
    public const decimal SilverDiscount = 0.02m;     // %2
    public const decimal GoldDiscount = 0.05m;       // %5
    public const decimal PlatinumDiscount = 0.10m;   // %10

    public static MembershipTier CalculateTier(int totalEarned)
    {
        return totalEarned switch
        {
            >= PlatinumThreshold => MembershipTier.Platinum,
            >= GoldThreshold => MembershipTier.Gold,
            >= SilverThreshold => MembershipTier.Silver,
            _ => MembershipTier.Bronze
        };
    }

    public static decimal GetTierDiscount(MembershipTier tier)
    {
        return tier switch
        {
            MembershipTier.Platinum => PlatinumDiscount,
            MembershipTier.Gold => GoldDiscount,
            MembershipTier.Silver => SilverDiscount,
            _ => BronzeDiscount
        };
    }
}
