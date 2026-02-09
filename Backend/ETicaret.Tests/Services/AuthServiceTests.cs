using ETicaret.Application.DTOs.Auth;
using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using ETicaret.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ETicaret.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly Mock<SignInManager<User>> _signInManagerMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<ILogger<AuthService>> _loggerMock;
    private readonly ApplicationDbContext _context;

    public AuthServiceTests()
    {
        // Setup UserManager mock
        var userStoreMock = new Mock<IUserStore<User>>();
        _userManagerMock = new Mock<UserManager<User>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        // Setup SignInManager mock
        var contextAccessorMock = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        var claimsFactoryMock = new Mock<IUserClaimsPrincipalFactory<User>>();
        _signInManagerMock = new Mock<SignInManager<User>>(
            _userManagerMock.Object, contextAccessorMock.Object, claimsFactoryMock.Object, null!, null!, null!, null!);

        // Setup Configuration mock
        _configurationMock = new Mock<IConfiguration>();
        var jwtSection = new Mock<IConfigurationSection>();
        jwtSection.Setup(s => s["SecretKey"]).Returns("JWT_SECRET_KEY");
        jwtSection.Setup(s => s["Issuer"]).Returns("JWT_ISSUER");
        jwtSection.Setup(s => s["Audience"]).Returns("JWT_AUDIENCE");
        jwtSection.Setup(s => s["DurationInMinutes"]).Returns("JWT_DURATION");
        _configurationMock.Setup(c => c.GetSection("JwtSettings")).Returns(jwtSection.Object);

        // Set environment variables for testing
        Environment.SetEnvironmentVariable("JWT_SECRET_KEY", "test-secret-key-that-is-at-least-32-characters-long");
        Environment.SetEnvironmentVariable("JWT_ISSUER", "test-issuer");
        Environment.SetEnvironmentVariable("JWT_AUDIENCE", "test-audience");
        Environment.SetEnvironmentVariable("JWT_DURATION", "60");

        // Setup InMemory database
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);

        _emailServiceMock = new Mock<IEmailService>();
        _loggerMock = new Mock<ILogger<AuthService>>();
    }

    private AuthService CreateService()
    {
        return new AuthService(
            _userManagerMock.Object,
            _signInManagerMock.Object,
            _configurationMock.Object,
            _context,
            _emailServiceMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsAuthResponse()
    {
        // Arrange
        var user = new User
        {
            Id = "test-user-id",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User"
        };

        _userManagerMock.Setup(m => m.FindByEmailAsync("test@example.com"))
            .ReturnsAsync(user);

        _signInManagerMock.Setup(m => m.CheckPasswordSignInAsync(user, "password123", false))
            .ReturnsAsync(SignInResult.Success);

        _userManagerMock.Setup(m => m.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "Customer" });

        var service = CreateService();

        // Act
        var result = await service.LoginAsync(new LoginRequest
        {
            Email = "test@example.com",
            Password = "password123"
        });

        // Assert
        Assert.NotNull(result);
        Assert.Equal("test@example.com", result.Email);
        Assert.Equal("Test", result.FirstName);
        Assert.Equal("Customer", result.Role);
        Assert.NotEmpty(result.Token);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidEmail_ThrowsException()
    {
        // Arrange
        _userManagerMock.Setup(m => m.FindByEmailAsync("invalid@example.com"))
            .ReturnsAsync((User?)null);

        var service = CreateService();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<Exception>(() =>
            service.LoginAsync(new LoginRequest
            {
                Email = "invalid@example.com",
                Password = "password123"
            }));

        Assert.Contains("bulunamadı", exception.Message);
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ThrowsException()
    {
        // Arrange
        var user = new User { Id = "test-id", Email = "test@example.com" };

        _userManagerMock.Setup(m => m.FindByEmailAsync("test@example.com"))
            .ReturnsAsync(user);

        _signInManagerMock.Setup(m => m.CheckPasswordSignInAsync(user, "wrongpassword", false))
            .ReturnsAsync(SignInResult.Failed);

        var service = CreateService();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<Exception>(() =>
            service.LoginAsync(new LoginRequest
            {
                Email = "test@example.com",
                Password = "wrongpassword"
            }));

        Assert.Contains("bulunamadı", exception.Message);
    }

    [Fact]
    public async Task RegisterAsync_WithNewEmail_CreatesUserSuccessfully()
    {
        // Arrange
        _userManagerMock.Setup(m => m.FindByEmailAsync("newuser@example.com"))
            .ReturnsAsync((User?)null);

        _userManagerMock.Setup(m => m.CreateAsync(It.IsAny<User>(), "Password123!"))
            .ReturnsAsync(IdentityResult.Success);

        _userManagerMock.Setup(m => m.AddToRoleAsync(It.IsAny<User>(), "Customer"))
            .ReturnsAsync(IdentityResult.Success);

        _userManagerMock.Setup(m => m.GetRolesAsync(It.IsAny<User>()))
            .ReturnsAsync(new List<string> { "Customer" });

        _emailServiceMock.Setup(m => m.SendWelcomeEmailAsync(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        var service = CreateService();

        // Act
        var result = await service.RegisterAsync(new RegisterRequest
        {
            Email = "newuser@example.com",
            Password = "Password123!",
            FirstName = "New",
            LastName = "User"
        });

        // Assert
        Assert.NotNull(result);
        Assert.Equal("newuser@example.com", result.Email);
        Assert.Equal("New", result.FirstName);
        Assert.Equal("Customer", result.Role);
    }

    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ThrowsException()
    {
        // Arrange
        var existingUser = new User { Email = "existing@example.com" };

        _userManagerMock.Setup(m => m.FindByEmailAsync("existing@example.com"))
            .ReturnsAsync(existingUser);

        var service = CreateService();

        // Act & Assert
        var exception = await Assert.ThrowsAsync<Exception>(() =>
            service.RegisterAsync(new RegisterRequest
            {
                Email = "existing@example.com",
                Password = "Password123!",
                FirstName = "Test",
                LastName = "User"
            }));

        Assert.Contains("zaten kullanımda", exception.Message);
    }
}
