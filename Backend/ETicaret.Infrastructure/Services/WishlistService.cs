using ETicaret.Application.DTOs.Wishlist;
using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ETicaret.Infrastructure.Services;

public class WishlistService : IWishlistService
{
    private readonly ApplicationDbContext _context;

    public WishlistService(ApplicationDbContext context)
    {
        _context = context;
    }

    private static WishlistItemDto MapToDto(Wishlist wishlist)
    {
        return new WishlistItemDto
        {
            Id = wishlist.Id,
            ProductId = wishlist.Product.Id,
            ProductName = wishlist.Product.Name,
            ProductSlug = wishlist.Product.Slug,
            ProductPrice = wishlist.Product.Price,
            ProductStock = wishlist.Product.Stock,
            ProductImageUrl = wishlist.Product.ImageUrl,
            BrandName = wishlist.Product.Brand.Name,
            AddedAt = wishlist.CreatedAt
        };
    }

    public async Task<WishlistResponse> GetUserWishlistAsync(string userId)
    {
        var wishlistItems = await _context.Wishlists
            .Include(w => w.Product)
                .ThenInclude(p => p.Brand)
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        return new WishlistResponse
        {
            Items = wishlistItems.Select(MapToDto).ToList(),
            TotalCount = wishlistItems.Count
        };
    }

    public async Task<WishlistItemDto> AddToWishlistAsync(string userId, Guid productId)
    {
        // Ürünün var olup olmadığını kontrol et
        var product = await _context.Products
            .Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
        {
            throw new KeyNotFoundException("Ürün bulunamadı.");
        }

        // Zaten wishlist'te var mı kontrol et
        var existingItem = await _context.Wishlists
            .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

        if (existingItem != null)
        {
            throw new InvalidOperationException("Bu ürün zaten favorilerinizde.");
        }

        var wishlistItem = new Wishlist
        {
            UserId = userId,
            ProductId = productId
        };

        _context.Wishlists.Add(wishlistItem);
        await _context.SaveChangesAsync();

        // Reload with includes for mapping
        await _context.Entry(wishlistItem)
            .Reference(w => w.Product)
            .Query()
            .Include(p => p.Brand)
            .LoadAsync();

        return MapToDto(wishlistItem);
    }

    public async Task RemoveFromWishlistAsync(string userId, Guid productId)
    {
        var wishlistItem = await _context.Wishlists
            .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

        if (wishlistItem == null)
        {
            throw new KeyNotFoundException("Ürün favorilerinizde bulunamadı.");
        }

        _context.Wishlists.Remove(wishlistItem);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> IsInWishlistAsync(string userId, Guid productId)
    {
        return await _context.Wishlists
            .AnyAsync(w => w.UserId == userId && w.ProductId == productId);
    }

    public async Task ClearWishlistAsync(string userId)
    {
        var wishlistItems = await _context.Wishlists
            .Where(w => w.UserId == userId)
            .ToListAsync();

        _context.Wishlists.RemoveRange(wishlistItems);
        await _context.SaveChangesAsync();
    }
}
