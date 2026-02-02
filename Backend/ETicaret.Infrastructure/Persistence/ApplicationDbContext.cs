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
    }
}
