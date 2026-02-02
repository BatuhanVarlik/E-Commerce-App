using ETicaret.Domain.Common;

namespace ETicaret.Domain.Entities;

// Ürün varyant seçeneklerini tanımlar (Renk, Beden, vb.)
public class VariantOption : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    
    // Option Type (örn: "Color", "Size", "Material")
    public string Name { get; set; } = string.Empty; // "Renk", "Beden"
    public VariantType Type { get; set; }
    
    // Display Order
    public int DisplayOrder { get; set; }
    
    // Values (örn: ["Kırmızı", "Mavi", "Yeşil"] veya ["S", "M", "L", "XL"])
    public List<VariantValue> Values { get; set; } = new();
}

public class VariantValue : BaseEntity
{
    public Guid VariantOptionId { get; set; }
    public VariantOption VariantOption { get; set; } = null!;
    
    public string Value { get; set; } = string.Empty; // "Kırmızı", "S", vb.
    public string? DisplayName { get; set; } // Görüntüleme adı (opsiyonel)
    
    // For colors: hex code or color name
    public string? ColorCode { get; set; } // "#FF0000" for red
    
    // Stock and pricing can be handled at ProductVariant level
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public enum VariantType
{
    Color = 0,      // Renk
    Size = 1,       // Beden
    Material = 2,   // Malzeme
    Style = 3,      // Stil
    Custom = 99     // Özel
}
