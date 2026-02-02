using ETicaret.Domain.Common;

namespace ETicaret.Domain.Entities;

public class ProductVariant : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    // Variant Attributes
    public string? Color { get; set; }  // Renk (örn: "Kırmızı", "Mavi")
    public string? Size { get; set; }   // Beden (örn: "S", "M", "L", "XL", "42", "43")
    public string? Material { get; set; } // Malzeme (örn: "Pamuk", "Polyester")
    public string? Style { get; set; }  // Stil (örn: "Slim Fit", "Regular")
    
    // SKU (Stock Keeping Unit) - Her varyant için benzersiz
    public string Sku { get; set; } = string.Empty;
    
    // Pricing
    public decimal? PriceAdjustment { get; set; } // Ana ürün fiyatına eklenecek/çıkarılacak tutar
    
    // Stock
    public int StockQuantity { get; set; }
    public int LowStockThreshold { get; set; } = 5;
    
    // Images (varyanta özel görseller)
    public string? ImageUrl { get; set; }
    public List<string> AdditionalImages { get; set; } = new();
    
    // Status
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; } = false; // Varsayılan seçili varyant
    
    // Weight & Dimensions (optional)
    public decimal? Weight { get; set; }
    public string? Dimensions { get; set; } // "10x20x5 cm" formatında
    
    public decimal GetFinalPrice()
    {
        var basePrice = Product?.Price ?? 0;
        return basePrice + (PriceAdjustment ?? 0);
    }
    
    public bool IsLowStock()
    {
        return StockQuantity > 0 && StockQuantity <= LowStockThreshold;
    }
    
    public bool IsInStock()
    {
        return StockQuantity > 0;
    }
}
