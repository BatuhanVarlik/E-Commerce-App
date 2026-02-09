using ETicaret.Infrastructure;
using ETicaret.Infrastructure.Middleware;
using Microsoft.OpenApi.Models;
using DotNetEnv;
using FluentValidation;
using FluentValidation.AspNetCore;

// .env dosyasını yükle (Backend klasöründen)
var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env");
if (File.Exists(envPath))
{
    Env.Load(envPath);
}

var builder = WebApplication.CreateBuilder(args);

// Environment variables'ı configuration'a ekle
builder.Configuration.AddEnvironmentVariables();

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // camelCase property names için (frontend ile uyumlu)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        // Case-insensitive deserialization
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<ETicaret.Application.Validators.Auth.RegisterRequestValidator>();
builder.Services.AddFluentValidationAutoValidation();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Infrastructure Layer
builder.Services.AddInfrastructure(builder.Configuration);

// Add Authentication & JWT
var jwtSettings = builder.Configuration.GetSection("JwtSettings");

// appsettings.json'dan environment variable isimlerini al
var secretKeyVar = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JwtSettings:SecretKey not found in appsettings.json");
var issuerVar = jwtSettings["Issuer"] ?? throw new InvalidOperationException("JwtSettings:Issuer not found in appsettings.json");
var audienceVar = jwtSettings["Audience"] ?? throw new InvalidOperationException("JwtSettings:Audience not found in appsettings.json");

// .env dosyasından gerçek değerleri al
var secretKey = Environment.GetEnvironmentVariable(secretKeyVar)
    ?? throw new InvalidOperationException($"{secretKeyVar} environment variable is required. Please check your .env file.");
var issuer = Environment.GetEnvironmentVariable(issuerVar)
    ?? throw new InvalidOperationException($"{issuerVar} environment variable is required. Please check your .env file.");
var audience = Environment.GetEnvironmentVariable(audienceVar)
    ?? throw new InvalidOperationException($"{audienceVar} environment variable is required. Please check your .env file.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(secretKey))
    };
    
    // HTTP-Only cookie'den token okuma
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // Önce Authorization header'ı kontrol et
            if (string.IsNullOrEmpty(context.Token))
            {
                // Header'da yoksa cookie'den oku
                context.Token = context.Request.Cookies["auth_token"];
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Version = "v1",
        Title = "E-Ticaret API",
        Description = "E-Ticaret uygulaması için RESTful API. Bu API, ürün yönetimi, sipariş işlemleri, kullanıcı kimlik doğrulama ve ödeme entegrasyonu gibi tüm e-ticaret işlemlerini destekler.",
        Contact = new OpenApiContact
        {
            Name = "API Destek",
            Email = "api@eticaret.com"
        },
        License = new OpenApiLicense
        {
            Name = "MIT License",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });

    c.EnableAnnotations();

    // API gruplarını tanımla
    c.TagActionsBy(api => new[] { api.GroupName ?? api.ActionDescriptor.RouteValues["controller"] });
    c.DocInclusionPredicate((name, api) => true);

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. \r\n\r\n Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: 'Bearer 12345abcdef'",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder
            .WithOrigins("http://localhost:3000", "https://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Global exception handler - en başta olmalı
app.UseGlobalExceptionHandler();

// CORS should be early in pipeline
app.UseCors("AllowAll");

app.UseHttpsRedirection();

// Security middleware'leri
app.UseSecurityHeaders(); // XSS, CSRF protection, security headers
app.UseRateLimiting();    // Rate limiting

// Static files için wwwroot klasörünü aktifleştir
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

// Audit logging (auth'dan sonra user bilgisi alınabilir)
app.UseAuditLogging();

app.MapControllers();

// Seed Data
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<ETicaret.Infrastructure.Services.DataSeeder>();
    await seeder.SeedAsync();
}

app.Run();
