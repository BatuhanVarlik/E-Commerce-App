using ETicaret.Application.Interfaces;
using ETicaret.Infrastructure.Persistence;
using ETicaret.Infrastructure.Services;
using ETicaret.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace ETicaret.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // appsettings.json'dan environment variable isimlerini al
        var dbHostKey = configuration["Database:Host"] ?? throw new InvalidOperationException("Database:Host key not found in appsettings.json");
        var dbPortKey = configuration["Database:Port"] ?? throw new InvalidOperationException("Database:Port key not found in appsettings.json");
        var dbNameKey = configuration["Database:Name"] ?? throw new InvalidOperationException("Database:Name key not found in appsettings.json");
        var dbUserKey = configuration["Database:User"] ?? throw new InvalidOperationException("Database:User key not found in appsettings.json");
        var dbPasswordKey = configuration["Database:Password"] ?? throw new InvalidOperationException("Database:Password key not found in appsettings.json");

        // .env dosyasından gerçek değerleri al
        var dbHost = Environment.GetEnvironmentVariable(dbHostKey) 
            ?? throw new InvalidOperationException($"{dbHostKey} environment variable is required. Please check your .env file.");
        var dbPort = Environment.GetEnvironmentVariable(dbPortKey) 
            ?? throw new InvalidOperationException($"{dbPortKey} environment variable is required. Please check your .env file.");
        var dbName = Environment.GetEnvironmentVariable(dbNameKey) 
            ?? throw new InvalidOperationException($"{dbNameKey} environment variable is required. Please check your .env file.");
        var dbUser = Environment.GetEnvironmentVariable(dbUserKey) 
            ?? throw new InvalidOperationException($"{dbUserKey} environment variable is required. Please check your .env file.");
        var dbPassword = Environment.GetEnvironmentVariable(dbPasswordKey) 
            ?? throw new InvalidOperationException($"{dbPasswordKey} environment variable is required. Please check your .env file.");
        
        var connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword}";

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddIdentity<User, IdentityRole>(options =>
        {
            options.Password.RequireDigit = false;
            options.Password.RequireLowercase = false;
            options.Password.RequireUppercase = false;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequiredLength = 6;
            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        services.AddScoped<IAuthService, Services.AuthService>();
        services.AddScoped<ICatalogService, Services.CatalogService>();
        services.AddScoped<ICartService, Services.CartService>();
        services.AddScoped<IPaymentService, Services.PaymentService>();
        services.AddScoped<IOrderService, Services.OrderService>();
        services.AddScoped<IDashboardService, Services.DashboardService>();
        services.AddScoped<IReviewService, Services.ReviewService>();
        services.AddScoped<IWishlistService, Services.WishlistService>();
        services.AddScoped<ICouponService, Services.CouponService>();
        services.AddScoped<IAlertService, Services.AlertService>();
        services.AddScoped<IUserProfileService, Services.UserProfileService>();
        services.AddScoped<IShippingService, Services.ShippingService>();
        services.AddScoped<IEmailService, Services.EmailService>();
        services.AddScoped<IRecommendationService, Services.RecommendationService>();
        services.AddScoped<IAnalyticsService, Services.AnalyticsService>();
        services.AddScoped<ICacheService, Services.CacheService>();
        services.AddScoped<ISecurityService, Services.SecurityService>();
        services.AddScoped<ITwoFactorAuthService, Services.TwoFactorAuthService>();
        services.AddScoped<IReferralService, Services.ReferralService>();
        services.AddScoped<IPointsService, Services.PointsService>();
        services.AddScoped<ISocialShareService, Services.SocialShareService>();
        services.AddScoped<IChatService, Services.ChatService>();
        services.AddScoped<IChatbotService, Services.ChatbotService>();
        services.AddScoped<IChatAgentService, Services.ChatAgentService>();
        services.AddScoped<IAuditService, Services.AuditService>();
        services.AddTransient<Services.DataSeeder>();

        // Redis Configuration
        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var redisKey = configuration["Redis:Connection"] ?? throw new InvalidOperationException("Redis:Connection key not found in appsettings.json");
            var redisConnection = Environment.GetEnvironmentVariable(redisKey) 
                ?? throw new InvalidOperationException($"{redisKey} environment variable is required. Please check your .env file.");
            return ConnectionMultiplexer.Connect(redisConnection);
        });

        return services;
    }
}
