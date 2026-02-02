using ETicaret.Application.DTOs.Address;
using ETicaret.Application.DTOs.UserProfile;
using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ETicaret.Infrastructure.Services;

public class UserProfileService : IUserProfileService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly ILogger<UserProfileService> _logger;

    public UserProfileService(
        ApplicationDbContext context,
        UserManager<User> userManager,
        ILogger<UserProfileService> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    // Profile Management
    public async Task<UserProfileDto> GetUserProfileAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new Exception("Kullanıcı bulunamadı");
        }

        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber ?? string.Empty,
            ProfilePhotoUrl = user.ProfilePhotoUrl,
            EmailConfirmed = user.EmailConfirmed,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<UserProfileDto> UpdateUserProfileAsync(string userId, UpdateProfileDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new Exception("Kullanıcı bulunamadı");
        }

        user.FirstName = dto.FirstName;
        user.LastName = dto.LastName;
        user.PhoneNumber = dto.PhoneNumber;

        if (!string.IsNullOrEmpty(dto.Email) && dto.Email != user.Email)
        {
            user.Email = dto.Email;
            user.UserName = dto.Email;
            user.EmailConfirmed = false;
            // TODO: Send email verification
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new Exception($"Profil güncellenemedi: {errors}");
        }

        return await GetUserProfileAsync(userId);
    }

    public async Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto dto)
    {
        if (dto.NewPassword != dto.ConfirmPassword)
        {
            throw new Exception("Yeni şifre ve onay şifresi eşleşmiyor");
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new Exception("Kullanıcı bulunamadı");
        }

        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new Exception($"Şifre değiştirilemedi: {errors}");
        }

        return true;
    }

    public async Task<bool> DeleteAccountAsync(string userId, string password)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new Exception("Kullanıcı bulunamadı");
        }

        // Verify password
        var passwordCheck = await _userManager.CheckPasswordAsync(user, password);
        if (!passwordCheck)
        {
            throw new Exception("Şifre yanlış");
        }

        // Soft delete
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }

    public async Task<string> UploadProfilePhotoAsync(string userId, string base64Image)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new Exception("Kullanıcı bulunamadı");
        }

        // Simple base64 storage (for production, use cloud storage like Azure Blob)
        // Validate base64 format
        if (string.IsNullOrEmpty(base64Image) || !base64Image.StartsWith("data:image/"))
        {
            throw new Exception("Geçersiz resim formatı");
        }

        // Store the base64 string (in production, save to blob storage and store URL)
        user.ProfilePhotoUrl = base64Image;
        user.UpdatedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            throw new Exception("Profil fotoğrafı güncellenemedi");
        }

        _logger.LogInformation("Profile photo updated for user {UserId}", userId);
        return user.ProfilePhotoUrl;
    }

    // Preferences Management
    public async Task<UserPreferencesDto> GetUserPreferencesAsync(string userId)
    {
        var preferences = await _context.UserPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (preferences == null)
        {
            // Create default preferences
            preferences = new UserPreferences
            {
                UserId = userId
            };
            _context.UserPreferences.Add(preferences);
            await _context.SaveChangesAsync();
        }

        return new UserPreferencesDto
        {
            EmailNotifications = preferences.EmailNotifications,
            SmsNotifications = preferences.SmsNotifications,
            PushNotifications = preferences.PushNotifications,
            MarketingEmails = preferences.MarketingEmails,
            OrderUpdates = preferences.OrderUpdates,
            PriceAlerts = preferences.PriceAlerts,
            NewsletterSubscription = preferences.NewsletterSubscription
        };
    }

    public async Task<UserPreferencesDto> UpdateUserPreferencesAsync(string userId, UpdatePreferencesDto dto)
    {
        var preferences = await _context.UserPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (preferences == null)
        {
            preferences = new UserPreferences { UserId = userId };
            _context.UserPreferences.Add(preferences);
        }

        if (dto.EmailNotifications.HasValue) preferences.EmailNotifications = dto.EmailNotifications.Value;
        if (dto.SmsNotifications.HasValue) preferences.SmsNotifications = dto.SmsNotifications.Value;
        if (dto.PushNotifications.HasValue) preferences.PushNotifications = dto.PushNotifications.Value;
        if (dto.MarketingEmails.HasValue) preferences.MarketingEmails = dto.MarketingEmails.Value;
        if (dto.OrderUpdates.HasValue) preferences.OrderUpdates = dto.OrderUpdates.Value;
        if (dto.PriceAlerts.HasValue) preferences.PriceAlerts = dto.PriceAlerts.Value;
        if (dto.NewsletterSubscription.HasValue) preferences.NewsletterSubscription = dto.NewsletterSubscription.Value;

        preferences.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetUserPreferencesAsync(userId);
    }

    // Address Management
    public async Task<List<AddressDto>> GetUserAddressesAsync(string userId)
    {
        var addresses = await _context.Addresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync();

        return addresses.Select(MapToDto).ToList();
    }

    public async Task<AddressDto?> GetAddressAsync(string userId, Guid addressId)
    {
        var address = await _context.Addresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

        return address != null ? MapToDto(address) : null;
    }

    public async Task<AddressDto> CreateAddressAsync(string userId, CreateAddressDto dto)
    {
        // If this is set as default, unset other default addresses
        if (dto.IsDefault)
        {
            var userAddresses = await _context.Addresses
                .Where(a => a.UserId == userId && a.IsDefault)
                .ToListAsync();

            foreach (var addr in userAddresses)
            {
                addr.IsDefault = false;
            }
        }

        var address = new Address
        {
            UserId = userId,
            Title = dto.Title,
            FullName = dto.FullName,
            PhoneNumber = dto.PhoneNumber,
            City = dto.City,
            District = dto.District,
            Neighborhood = dto.Neighborhood,
            Street = dto.Street,
            BuildingNo = dto.BuildingNo,
            ApartmentNo = dto.ApartmentNo,
            PostalCode = dto.PostalCode,
            IsDefault = dto.IsDefault,
            Type = (AddressType)dto.Type
        };

        _context.Addresses.Add(address);
        await _context.SaveChangesAsync();

        return MapToDto(address);
    }

    public async Task<AddressDto> UpdateAddressAsync(string userId, Guid addressId, UpdateAddressDto dto)
    {
        var address = await _context.Addresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

        if (address == null)
        {
            throw new Exception("Adres bulunamadı");
        }

        // If this is set as default, unset other default addresses
        if (dto.IsDefault && !address.IsDefault)
        {
            var userAddresses = await _context.Addresses
                .Where(a => a.UserId == userId && a.IsDefault && a.Id != addressId)
                .ToListAsync();

            foreach (var addr in userAddresses)
            {
                addr.IsDefault = false;
            }
        }

        address.Title = dto.Title;
        address.FullName = dto.FullName;
        address.PhoneNumber = dto.PhoneNumber;
        address.City = dto.City;
        address.District = dto.District;
        address.Neighborhood = dto.Neighborhood;
        address.Street = dto.Street;
        address.BuildingNo = dto.BuildingNo;
        address.ApartmentNo = dto.ApartmentNo;
        address.PostalCode = dto.PostalCode;
        address.IsDefault = dto.IsDefault;
        address.Type = (AddressType)dto.Type;
        address.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(address);
    }

    public async Task<bool> DeleteAddressAsync(string userId, Guid addressId)
    {
        var address = await _context.Addresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

        if (address == null)
        {
            return false;
        }

        _context.Addresses.Remove(address);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> SetDefaultAddressAsync(string userId, Guid addressId)
    {
        var address = await _context.Addresses
            .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

        if (address == null)
        {
            throw new Exception("Adres bulunamadı");
        }

        // Unset other default addresses
        var userAddresses = await _context.Addresses
            .Where(a => a.UserId == userId && a.IsDefault && a.Id != addressId)
            .ToListAsync();

        foreach (var addr in userAddresses)
        {
            addr.IsDefault = false;
        }

        address.IsDefault = true;
        address.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }

    // Helper Methods
    private static AddressDto MapToDto(Address address)
    {
        return new AddressDto
        {
            Id = address.Id,
            Title = address.Title,
            FullName = address.FullName,
            PhoneNumber = address.PhoneNumber,
            City = address.City,
            District = address.District,
            Neighborhood = address.Neighborhood,
            Street = address.Street,
            BuildingNo = address.BuildingNo,
            ApartmentNo = address.ApartmentNo,
            PostalCode = address.PostalCode,
            IsDefault = address.IsDefault,
            Type = address.Type.ToString()
        };
    }
}
