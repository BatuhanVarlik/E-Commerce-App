using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;

namespace ETicaret.Infrastructure.Services;

public class DataSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public DataSeeder(ApplicationDbContext context, UserManager<User> userManager, RoleManager<IdentityRole> roleManager)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async Task SeedAsync()
    {
        await SeedRolesAndUsersAsync();

        // Seed products only if they don't exist
        if (!_context.Products.Any())
        {
            await SeedProductsAsync();
        }

        // Seed coupons separately (always check)
        if (!_context.Coupons.Any())
        {
            await SeedCouponsAsync();
        }
    }

    private async Task SeedProductsAsync()
    {
        // Brands
        var apple = new Brand { Name = "Apple", Logo = "https://placehold.co/100" };
        var samsung = new Brand { Name = "Samsung", Logo = "https://placehold.co/100" };
        var nike = new Brand { Name = "Nike", Logo = "https://placehold.co/100" };
        
        _context.Brands.AddRange(apple, samsung, nike);
        await _context.SaveChangesAsync();

        // Categories
        var electronics = new Category { Name = "Elektronik", Slug = "elektronik" };
        var fashion = new Category { Name = "Moda", Slug = "moda" };
        
        _context.Categories.AddRange(electronics, fashion);
        await _context.SaveChangesAsync();
        
        var phones = new Category { Name = "Telefon", Slug = "telefon", ParentId = electronics.Id };
        var laptops = new Category { Name = "Laptop", Slug = "laptop", ParentId = electronics.Id };
        
        _context.Categories.AddRange(phones, laptops);
        await _context.SaveChangesAsync();

        // Products
        var p1 = new Product
        {
            Name = "iPhone 15 Pro",
            Slug = "iphone-15-pro",
            Description = "En yeni iPhone.",
            Price = 75000,
            Stock = 100,
            BrandId = apple.Id,
            CategoryId = phones.Id,
            ImageUrl = "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium"
        };
        
        var p2 = new Product
        {
            Name = "Samsung Galaxy S24",
            Slug = "samsung-galaxy-s24",
            Description = "Yapay zeka destegi.",
            Price = 60000,
            Stock = 50,
            BrandId = samsung.Id,
            CategoryId = phones.Id,
            ImageUrl = "https://images.samsung.com/is/image/samsung/p6pim/tr/2401/gallery/tr-galaxy-s24-s921-sm-s921bzkwtur-thumb-539304724"
        };

        _context.Products.AddRange(p1, p2);
        await _context.SaveChangesAsync();
    }

    private async Task SeedCouponsAsync()
    {
        // Coupons - Test için örnek kuponlar
        var coupons = new List<Coupon>
        {
            new Coupon
            {
                Code = "INDIRIM10",
                Type = CouponType.Percentage,
                Value = 10,
                MinimumAmount = 1000,
                MaxUsage = 100,
                CurrentUsage = 0,
                StartDate = DateTime.UtcNow.AddDays(-1),
                ExpiryDate = DateTime.UtcNow.AddDays(30),
                IsActive = true
            },
            new Coupon
            {
                Code = "YENI50",
                Type = CouponType.FixedAmount,
                Value = 50,
                MinimumAmount = 500,
                MaxUsage = 50,
                CurrentUsage = 0,
                StartDate = DateTime.UtcNow.AddDays(-1),
                ExpiryDate = DateTime.UtcNow.AddDays(15),
                IsActive = true
            },
            new Coupon
            {
                Code = "WELCOME100",
                Type = CouponType.FixedAmount,
                Value = 100,
                MinimumAmount = 2000,
                MaxUsage = 200,
                CurrentUsage = 0,
                StartDate = DateTime.UtcNow.AddDays(-1),
                ExpiryDate = DateTime.UtcNow.AddDays(60),
                IsActive = true
            }
        };

        _context.Coupons.AddRange(coupons);
        await _context.SaveChangesAsync();
    }

    private async Task SeedRolesAndUsersAsync()
    {
        // 1. Roles
        string[] roleNames = { "Admin", "Customer" };
        foreach (var roleName in roleNames)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                await _roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }

        // 2. Admin User
        var adminEmail = "admin@admin.com";
        var adminUser = await _userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new User
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "Admin",
                LastName = "User",
                EmailConfirmed = true
            };
            var result = await _userManager.CreateAsync(adminUser, "Admin123!");
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }
    }
}
