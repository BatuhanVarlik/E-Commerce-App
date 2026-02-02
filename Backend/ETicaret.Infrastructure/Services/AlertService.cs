using ETicaret.Application.DTOs.Alert;
using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ETicaret.Infrastructure.Services;

public class AlertService : IAlertService
{
    private readonly ApplicationDbContext _context;

    public AlertService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PriceAlertDto> CreatePriceAlertAsync(string userId, CreatePriceAlertDto dto)
    {
        // Check if alert already exists
        var existing = await _context.PriceAlerts
            .FirstOrDefaultAsync(pa => pa.UserId == userId && pa.ProductId == dto.ProductId && pa.IsActive);

        if (existing != null)
        {
            throw new Exception("Bu ürün için zaten aktif bir fiyat uyarınız var");
        }

        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null)
        {
            throw new Exception("Ürün bulunamadı");
        }

        var alert = new PriceAlert
        {
            UserId = userId,
            ProductId = dto.ProductId,
            TargetPrice = dto.TargetPrice,
            IsActive = true
        };

        _context.PriceAlerts.Add(alert);
        await _context.SaveChangesAsync();

        return await MapToPriceAlertDto(alert);
    }

    public async Task<IEnumerable<PriceAlertDto>> GetMyPriceAlertsAsync(string userId)
    {
        var alerts = await _context.PriceAlerts
            .Include(pa => pa.Product)
            .Where(pa => pa.UserId == userId && pa.IsActive)
            .OrderByDescending(pa => pa.CreatedAt)
            .ToListAsync();

        var dtos = new List<PriceAlertDto>();
        foreach (var alert in alerts)
        {
            dtos.Add(await MapToPriceAlertDto(alert));
        }

        return dtos;
    }

    public async Task<bool> DeletePriceAlertAsync(Guid id, string userId)
    {
        var alert = await _context.PriceAlerts
            .FirstOrDefaultAsync(pa => pa.Id == id && pa.UserId == userId);

        if (alert == null)
        {
            return false;
        }

        _context.PriceAlerts.Remove(alert);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<StockAlertDto> CreateStockAlertAsync(string userId, CreateStockAlertDto dto)
    {
        // Check if alert already exists
        var existing = await _context.StockAlerts
            .FirstOrDefaultAsync(sa => sa.UserId == userId && sa.ProductId == dto.ProductId && sa.IsActive);

        if (existing != null)
        {
            throw new Exception("Bu ürün için zaten aktif bir stok uyarınız var");
        }

        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null)
        {
            throw new Exception("Ürün bulunamadı");
        }

        var alert = new StockAlert
        {
            UserId = userId,
            ProductId = dto.ProductId,
            IsActive = true
        };

        _context.StockAlerts.Add(alert);
        await _context.SaveChangesAsync();

        return await MapToStockAlertDto(alert);
    }

    public async Task<IEnumerable<StockAlertDto>> GetMyStockAlertsAsync(string userId)
    {
        var alerts = await _context.StockAlerts
            .Include(sa => sa.Product)
            .Where(sa => sa.UserId == userId && sa.IsActive)
            .OrderByDescending(sa => sa.CreatedAt)
            .ToListAsync();

        var dtos = new List<StockAlertDto>();
        foreach (var alert in alerts)
        {
            dtos.Add(await MapToStockAlertDto(alert));
        }

        return dtos;
    }

    public async Task<bool> DeleteStockAlertAsync(Guid id, string userId)
    {
        var alert = await _context.StockAlerts
            .FirstOrDefaultAsync(sa => sa.Id == id && sa.UserId == userId);

        if (alert == null)
        {
            return false;
        }

        _context.StockAlerts.Remove(alert);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> HasPriceAlertForProductAsync(string userId, Guid productId)
    {
        return await _context.PriceAlerts
            .AnyAsync(pa => pa.UserId == userId && pa.ProductId == productId && pa.IsActive);
    }

    public async Task<bool> HasStockAlertForProductAsync(string userId, Guid productId)
    {
        return await _context.StockAlerts
            .AnyAsync(sa => sa.UserId == userId && sa.ProductId == productId && sa.IsActive);
    }

    private async Task<PriceAlertDto> MapToPriceAlertDto(PriceAlert alert)
    {
        var product = alert.Product ?? await _context.Products.FindAsync(alert.ProductId);
        
        return new PriceAlertDto
        {
            Id = alert.Id,
            UserId = alert.UserId,
            ProductId = alert.ProductId,
            ProductName = product?.Name ?? "",
            CurrentPrice = product?.Price ?? 0,
            TargetPrice = alert.TargetPrice,
            IsActive = alert.IsActive,
            NotifiedAt = alert.NotifiedAt,
            CreatedAt = alert.CreatedAt
        };
    }

    private async Task<StockAlertDto> MapToStockAlertDto(StockAlert alert)
    {
        var product = alert.Product ?? await _context.Products.FindAsync(alert.ProductId);
        
        return new StockAlertDto
        {
            Id = alert.Id,
            UserId = alert.UserId,
            ProductId = alert.ProductId,
            ProductName = product?.Name ?? "",
            CurrentStock = product?.Stock ?? 0,
            IsActive = alert.IsActive,
            NotifiedAt = alert.NotifiedAt,
            CreatedAt = alert.CreatedAt
        };
    }
}
