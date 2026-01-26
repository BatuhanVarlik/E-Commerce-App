using ETicaret.Infrastructure;
using Microsoft.OpenApi.Models;
using DotNetEnv;

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
});

builder.Services.AddSwaggerGen(c =>
{
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
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Static files için wwwroot klasörünü aktifleştir
app.UseStaticFiles();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed Data
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<ETicaret.Infrastructure.Services.DataSeeder>();
    await seeder.SeedAsync();
}

app.Run();
