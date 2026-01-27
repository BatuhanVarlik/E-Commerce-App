using ETicaret.Application.DTOs.Wishlist;

namespace ETicaret.Application.Interfaces;

public interface IWishlistService
{
    Task<WishlistResponse> GetUserWishlistAsync(string userId);
    Task<WishlistItemDto> AddToWishlistAsync(string userId, Guid productId);
    Task RemoveFromWishlistAsync(string userId, Guid productId);
    Task<bool> IsInWishlistAsync(string userId, Guid productId);
    Task ClearWishlistAsync(string userId);
}
