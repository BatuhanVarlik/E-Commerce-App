using ETicaret.Application.DTOs.Alert;

namespace ETicaret.Application.Interfaces;

public interface IAlertService
{
    // Price Alerts
    Task<PriceAlertDto> CreatePriceAlertAsync(string userId, CreatePriceAlertDto dto);
    Task<IEnumerable<PriceAlertDto>> GetMyPriceAlertsAsync(string userId);
    Task<bool> DeletePriceAlertAsync(Guid id, string userId);
    
    // Stock Alerts
    Task<StockAlertDto> CreateStockAlertAsync(string userId, CreateStockAlertDto dto);
    Task<IEnumerable<StockAlertDto>> GetMyStockAlertsAsync(string userId);
    Task<bool> DeleteStockAlertAsync(Guid id, string userId);
    
    // Check if user has alert for product
    Task<bool> HasPriceAlertForProductAsync(string userId, Guid productId);
    Task<bool> HasStockAlertForProductAsync(string userId, Guid productId);
}
