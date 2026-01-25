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
        // .env değişkenlerinden connection string al
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? $"Host={Environment.GetEnvironmentVariable("DB_HOST")};Port={Environment.GetEnvironmentVariable("DB_PORT")};Database={Environment.GetEnvironmentVariable("DB_NAME")};Username={Environment.GetEnvironmentVariable("DB_USER")};Password={Environment.GetEnvironmentVariable("DB_PASSWORD")}";

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
        services.AddTransient<Services.DataSeeder>();

        // Redis Configuration
        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var config = configuration.GetConnectionString("Redis") 
                ?? Environment.GetEnvironmentVariable("REDIS_CONNECTION") 
                ?? "localhost:6379";
            return ConnectionMultiplexer.Connect(config);
        });

        return services;
    }
}
