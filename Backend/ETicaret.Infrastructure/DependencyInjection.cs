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
        var connectionString = configuration.GetConnectionString("DefaultConnection");

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
        services.AddTransient<Services.DataSeeder>();

        // Redis Configuration
        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var config = configuration.GetConnectionString("Redis") ?? "localhost:6379";
            return ConnectionMultiplexer.Connect(config);
        });

        return services;
    }
}
