using ETicaret.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ETicaret.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<User>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Category> Categories { get; set; }
    public DbSet<Brand> Brands { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<ReviewHelpfulness> ReviewHelpfulness { get; set; }
    public DbSet<PasswordReset> PasswordResets { get; set; }
    public DbSet<Wishlist> Wishlists { get; set; }
    public DbSet<Coupon> Coupons { get; set; }
    public DbSet<UserCoupon> UserCoupons { get; set; }
    public DbSet<PriceAlert> PriceAlerts { get; set; }
    public DbSet<StockAlert> StockAlerts { get; set; }
    public DbSet<Address> Addresses { get; set; }
    public DbSet<UserPreferences> UserPreferences { get; set; }
    public DbSet<Shipment> Shipments { get; set; }
    public DbSet<ShipmentTracking> ShipmentTrackings { get; set; }
    public DbSet<ProductVariant> ProductVariants { get; set; }
    public DbSet<VariantOption> VariantOptions { get; set; }
    public DbSet<VariantValue> VariantValues { get; set; }
    public DbSet<ViewHistory> ViewHistories { get; set; }
    
    // Security entities
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<TwoFactorAuth> TwoFactorAuths { get; set; }
    public DbSet<IpBlacklist> IpBlacklists { get; set; }
    public DbSet<IpWhitelist> IpWhitelists { get; set; }
    
    // Social entities
    public DbSet<Referral> Referrals { get; set; }
    public DbSet<UserPoints> UserPoints { get; set; }
    public DbSet<PointTransaction> PointTransactions { get; set; }
    
    // Chat entities
    public DbSet<ChatRoom> ChatRooms { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<ChatbotResponse> ChatbotResponses { get; set; }
    public DbSet<ChatAgent> ChatAgents { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ==================== INDEXES FOR PERFORMANCE ====================
        
        // Product indexes
        builder.Entity<Product>()
            .HasIndex(p => p.Name)
            .HasDatabaseName("IX_Products_Name");
        
        builder.Entity<Product>()
            .HasIndex(p => p.CategoryId)
            .HasDatabaseName("IX_Products_CategoryId");
        
        builder.Entity<Product>()
            .HasIndex(p => p.BrandId)
            .HasDatabaseName("IX_Products_BrandId");
        
        builder.Entity<Product>()
            .HasIndex(p => p.Price)
            .HasDatabaseName("IX_Products_Price");
        
        builder.Entity<Product>()
            .HasIndex(p => p.Stock)
            .HasDatabaseName("IX_Products_Stock");
        
        builder.Entity<Product>()
            .HasIndex(p => p.Slug)
            .IsUnique()
            .HasDatabaseName("IX_Products_Slug");
        
        // Composite index for filtering
        builder.Entity<Product>()
            .HasIndex(p => new { p.CategoryId, p.Price })
            .HasDatabaseName("IX_Products_Category_Price");

        // Order indexes
        builder.Entity<Order>()
            .HasIndex(o => o.UserId)
            .HasDatabaseName("IX_Orders_UserId");
        
        builder.Entity<Order>()
            .HasIndex(o => o.OrderDate)
            .HasDatabaseName("IX_Orders_OrderDate");
        
        builder.Entity<Order>()
            .HasIndex(o => o.Status)
            .HasDatabaseName("IX_Orders_Status");
        
        builder.Entity<Order>()
            .HasIndex(o => o.OrderNumber)
            .IsUnique()
            .HasDatabaseName("IX_Orders_OrderNumber");

        // OrderItem indexes
        builder.Entity<OrderItem>()
            .HasIndex(oi => oi.ProductId)
            .HasDatabaseName("IX_OrderItems_ProductId");
        
        builder.Entity<OrderItem>()
            .HasIndex(oi => oi.OrderId)
            .HasDatabaseName("IX_OrderItems_OrderId");

        // Review indexes
        builder.Entity<Review>()
            .HasIndex(r => r.ProductId)
            .HasDatabaseName("IX_Reviews_ProductId");
        
        builder.Entity<Review>()
            .HasIndex(r => r.UserId)
            .HasDatabaseName("IX_Reviews_UserId");
        
        builder.Entity<Review>()
            .HasIndex(r => r.IsApproved)
            .HasDatabaseName("IX_Reviews_IsApproved");
        
        builder.Entity<Review>()
            .HasIndex(r => new { r.ProductId, r.IsApproved })
            .HasDatabaseName("IX_Reviews_Product_Approved");

        // Wishlist indexes
        builder.Entity<Wishlist>()
            .HasIndex(w => w.UserId)
            .HasDatabaseName("IX_Wishlists_UserId");
        
        builder.Entity<Wishlist>()
            .HasIndex(w => new { w.UserId, w.ProductId })
            .IsUnique()
            .HasDatabaseName("IX_Wishlists_User_Product");

        // Coupon indexes
        builder.Entity<Coupon>()
            .HasIndex(c => c.Code)
            .IsUnique()
            .HasDatabaseName("IX_Coupons_Code");
        
        builder.Entity<Coupon>()
            .HasIndex(c => c.IsActive)
            .HasDatabaseName("IX_Coupons_IsActive");

        // User indexes
        builder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique()
            .HasDatabaseName("IX_Users_Email");
        
        builder.Entity<User>()
            .HasIndex(u => u.IsActive)
            .HasDatabaseName("IX_Users_IsActive");

        // Address indexes
        builder.Entity<Address>()
            .HasIndex(a => a.UserId)
            .HasDatabaseName("IX_Addresses_UserId");
        
        builder.Entity<Address>()
            .HasIndex(a => new { a.UserId, a.IsDefault })
            .HasDatabaseName("IX_Addresses_User_Default");

        // Shipment indexes
        builder.Entity<Shipment>()
            .HasIndex(s => s.OrderId)
            .HasDatabaseName("IX_Shipments_OrderId");
        
        builder.Entity<Shipment>()
            .HasIndex(s => s.TrackingNumber)
            .IsUnique()
            .HasDatabaseName("IX_Shipments_TrackingNumber");

        // ViewHistory indexes
        builder.Entity<ViewHistory>()
            .HasIndex(v => v.ProductId)
            .HasDatabaseName("IX_ViewHistories_ProductId");
        
        builder.Entity<ViewHistory>()
            .HasIndex(v => v.UserId)
            .HasDatabaseName("IX_ViewHistories_UserId");
        
        builder.Entity<ViewHistory>()
            .HasIndex(v => v.SessionId)
            .HasDatabaseName("IX_ViewHistories_SessionId");
        
        builder.Entity<ViewHistory>()
            .HasIndex(v => v.ViewedAt)
            .HasDatabaseName("IX_ViewHistories_ViewedAt");

        // Category and Brand indexes
        builder.Entity<Category>()
            .HasIndex(c => c.Name)
            .HasDatabaseName("IX_Categories_Name");
        
        builder.Entity<Brand>()
            .HasIndex(b => b.Name)
            .HasDatabaseName("IX_Brands_Name");

        // ProductVariant indexes
        builder.Entity<ProductVariant>()
            .HasIndex(pv => pv.ProductId)
            .HasDatabaseName("IX_ProductVariants_ProductId");
        
        builder.Entity<ProductVariant>()
            .HasIndex(pv => pv.Sku)
            .IsUnique()
            .HasDatabaseName("IX_ProductVariants_Sku");

        // ==================== SECURITY INDEXES ====================
        
        // AuditLog indexes
        builder.Entity<AuditLog>()
            .HasIndex(a => a.UserId)
            .HasDatabaseName("IX_AuditLogs_UserId");
        
        builder.Entity<AuditLog>()
            .HasIndex(a => a.Action)
            .HasDatabaseName("IX_AuditLogs_Action");
        
        builder.Entity<AuditLog>()
            .HasIndex(a => a.Category)
            .HasDatabaseName("IX_AuditLogs_Category");
        
        builder.Entity<AuditLog>()
            .HasIndex(a => a.CreatedAt)
            .HasDatabaseName("IX_AuditLogs_CreatedAt");
        
        builder.Entity<AuditLog>()
            .HasIndex(a => a.IpAddress)
            .HasDatabaseName("IX_AuditLogs_IpAddress");
        
        builder.Entity<AuditLog>()
            .HasIndex(a => a.RiskLevel)
            .HasDatabaseName("IX_AuditLogs_RiskLevel");
        
        builder.Entity<AuditLog>()
            .HasIndex(a => new { a.Category, a.CreatedAt })
            .HasDatabaseName("IX_AuditLogs_Category_CreatedAt");

        // TwoFactorAuth indexes
        builder.Entity<TwoFactorAuth>()
            .HasIndex(t => t.UserId)
            .IsUnique()
            .HasDatabaseName("IX_TwoFactorAuths_UserId");

        // IpBlacklist indexes
        builder.Entity<IpBlacklist>()
            .HasIndex(i => i.IpAddress)
            .HasDatabaseName("IX_IpBlacklists_IpAddress");
        
        builder.Entity<IpBlacklist>()
            .HasIndex(i => i.IsActive)
            .HasDatabaseName("IX_IpBlacklists_IsActive");
        
        builder.Entity<IpBlacklist>()
            .HasIndex(i => new { i.IpAddress, i.IsActive })
            .HasDatabaseName("IX_IpBlacklists_Ip_Active");

        // IpWhitelist indexes
        builder.Entity<IpWhitelist>()
            .HasIndex(i => i.IpAddress)
            .HasDatabaseName("IX_IpWhitelists_IpAddress");
        
        builder.Entity<IpWhitelist>()
            .HasIndex(i => i.IsActive)
            .HasDatabaseName("IX_IpWhitelists_IsActive");

        // ==================== RELATIONSHIPS ====================
        
        // AuditLog -> User (optional)
        builder.Entity<AuditLog>()
            .HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // TwoFactorAuth -> User
        builder.Entity<TwoFactorAuth>()
            .HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // IpBlacklist -> User (optional)
        builder.Entity<IpBlacklist>()
            .HasOne(i => i.BlockedByUser)
            .WithMany()
            .HasForeignKey(i => i.BlockedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // IpWhitelist -> User (optional)
        builder.Entity<IpWhitelist>()
            .HasOne(i => i.AddedByUser)
            .WithMany()
            .HasForeignKey(i => i.AddedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // ==================== SOCIAL INDEXES ====================
        
        // Referral indexes
        builder.Entity<Referral>()
            .HasIndex(r => r.ReferralCode)
            .IsUnique()
            .HasDatabaseName("IX_Referrals_Code");
        
        builder.Entity<Referral>()
            .HasIndex(r => r.ReferrerId)
            .HasDatabaseName("IX_Referrals_ReferrerId");
        
        builder.Entity<Referral>()
            .HasIndex(r => r.ReferredUserId)
            .HasDatabaseName("IX_Referrals_ReferredUserId");
        
        builder.Entity<Referral>()
            .HasIndex(r => new { r.ReferrerId, r.Status })
            .HasDatabaseName("IX_Referrals_Referrer_Status");

        // UserPoints indexes
        builder.Entity<UserPoints>()
            .HasIndex(up => up.UserId)
            .IsUnique()
            .HasDatabaseName("IX_UserPoints_UserId");
        
        builder.Entity<UserPoints>()
            .HasIndex(up => up.TotalEarned)
            .HasDatabaseName("IX_UserPoints_TotalEarned");
        
        builder.Entity<UserPoints>()
            .HasIndex(up => up.Tier)
            .HasDatabaseName("IX_UserPoints_Tier");

        // PointTransaction indexes
        builder.Entity<PointTransaction>()
            .HasIndex(pt => pt.UserId)
            .HasDatabaseName("IX_PointTransactions_UserId");
        
        builder.Entity<PointTransaction>()
            .HasIndex(pt => pt.CreatedAt)
            .HasDatabaseName("IX_PointTransactions_CreatedAt");
        
        builder.Entity<PointTransaction>()
            .HasIndex(pt => new { pt.UserId, pt.Type })
            .HasDatabaseName("IX_PointTransactions_User_Type");

        // ==================== CHAT INDEXES ====================
        
        // ChatRoom indexes
        builder.Entity<ChatRoom>()
            .HasIndex(cr => cr.UserId)
            .HasDatabaseName("IX_ChatRooms_UserId");
        
        builder.Entity<ChatRoom>()
            .HasIndex(cr => cr.AssignedToId)
            .HasDatabaseName("IX_ChatRooms_AssignedToId");
        
        builder.Entity<ChatRoom>()
            .HasIndex(cr => cr.Status)
            .HasDatabaseName("IX_ChatRooms_Status");
        
        builder.Entity<ChatRoom>()
            .HasIndex(cr => cr.SessionId)
            .HasDatabaseName("IX_ChatRooms_SessionId");
        
        builder.Entity<ChatRoom>()
            .HasIndex(cr => new { cr.Status, cr.Priority })
            .HasDatabaseName("IX_ChatRooms_Status_Priority");

        // ChatMessage indexes
        builder.Entity<ChatMessage>()
            .HasIndex(cm => cm.ChatRoomId)
            .HasDatabaseName("IX_ChatMessages_ChatRoomId");
        
        builder.Entity<ChatMessage>()
            .HasIndex(cm => cm.SenderId)
            .HasDatabaseName("IX_ChatMessages_SenderId");
        
        builder.Entity<ChatMessage>()
            .HasIndex(cm => new { cm.ChatRoomId, cm.CreatedAt })
            .HasDatabaseName("IX_ChatMessages_Room_CreatedAt");

        // ChatbotResponse indexes
        builder.Entity<ChatbotResponse>()
            .HasIndex(cbr => cbr.Category)
            .HasDatabaseName("IX_ChatbotResponses_Category");
        
        builder.Entity<ChatbotResponse>()
            .HasIndex(cbr => cbr.IsActive)
            .HasDatabaseName("IX_ChatbotResponses_IsActive");

        // ChatAgent indexes
        builder.Entity<ChatAgent>()
            .HasIndex(ca => ca.UserId)
            .IsUnique()
            .HasDatabaseName("IX_ChatAgents_UserId");
        
        builder.Entity<ChatAgent>()
            .HasIndex(ca => ca.IsOnline)
            .HasDatabaseName("IX_ChatAgents_IsOnline");

        // ==================== SOCIAL RELATIONSHIPS ====================
        
        // Referral -> Referrer User
        builder.Entity<Referral>()
            .HasOne(r => r.Referrer)
            .WithMany()
            .HasForeignKey(r => r.ReferrerId)
            .OnDelete(DeleteBehavior.Cascade);

        // Referral -> Referred User (optional)
        builder.Entity<Referral>()
            .HasOne(r => r.ReferredUser)
            .WithMany()
            .HasForeignKey(r => r.ReferredUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // UserPoints -> User
        builder.Entity<UserPoints>()
            .HasOne(up => up.User)
            .WithMany()
            .HasForeignKey(up => up.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // PointTransaction -> User
        builder.Entity<PointTransaction>()
            .HasOne(pt => pt.User)
            .WithMany()
            .HasForeignKey(pt => pt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ==================== CHAT RELATIONSHIPS ====================
        
        // ChatRoom -> User (Customer)
        builder.Entity<ChatRoom>()
            .HasOne(cr => cr.User)
            .WithMany()
            .HasForeignKey(cr => cr.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // ChatRoom -> User (Assigned Agent)
        builder.Entity<ChatRoom>()
            .HasOne(cr => cr.AssignedTo)
            .WithMany()
            .HasForeignKey(cr => cr.AssignedToId)
            .OnDelete(DeleteBehavior.SetNull);

        // ChatRoom -> Messages
        builder.Entity<ChatRoom>()
            .HasMany(cr => cr.Messages)
            .WithOne(cm => cm.ChatRoom)
            .HasForeignKey(cm => cm.ChatRoomId)
            .OnDelete(DeleteBehavior.Cascade);

        // ChatMessage -> Sender
        builder.Entity<ChatMessage>()
            .HasOne(cm => cm.Sender)
            .WithMany()
            .HasForeignKey(cm => cm.SenderId)
            .OnDelete(DeleteBehavior.SetNull);

        // ChatAgent -> User
        builder.Entity<ChatAgent>()
            .HasOne(ca => ca.User)
            .WithMany()
            .HasForeignKey(ca => ca.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
