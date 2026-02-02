using ETicaret.Application.DTOs.Address;
using ETicaret.Application.DTOs.UserProfile;

namespace ETicaret.Application.Interfaces;

public interface IUserProfileService
{
    // Profile management
    Task<UserProfileDto> GetUserProfileAsync(string userId);
    Task<UserProfileDto> UpdateUserProfileAsync(string userId, UpdateProfileDto dto);
    Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto dto);
    Task<bool> DeleteAccountAsync(string userId, string password);
    Task<string> UploadProfilePhotoAsync(string userId, string base64Image);
    
    // Preferences management
    Task<UserPreferencesDto> GetUserPreferencesAsync(string userId);
    Task<UserPreferencesDto> UpdateUserPreferencesAsync(string userId, UpdatePreferencesDto dto);
    
    // Address management
    Task<List<AddressDto>> GetUserAddressesAsync(string userId);
    Task<AddressDto?> GetAddressAsync(string userId, Guid addressId);
    Task<AddressDto> CreateAddressAsync(string userId, CreateAddressDto dto);
    Task<AddressDto> UpdateAddressAsync(string userId, Guid addressId, UpdateAddressDto dto);
    Task<bool> DeleteAddressAsync(string userId, Guid addressId);
    Task<bool> SetDefaultAddressAsync(string userId, Guid addressId);
}
