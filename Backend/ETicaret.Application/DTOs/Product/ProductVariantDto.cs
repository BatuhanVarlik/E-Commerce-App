namespace ETicaret.Application.DTOs.Product;

public class ProductVariantDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    
    // Attributes
    public string? Color { get; set; }
    public string? Size { get; set; }
    public string? Material { get; set; }
    public string? Style { get; set; }
    
    public string Sku { get; set; } = string.Empty;
    public decimal? PriceAdjustment { get; set; }
    public decimal FinalPrice { get; set; }
    
    public int StockQuantity { get; set; }
    public bool IsInStock { get; set; }
    public bool IsLowStock { get; set; }
    
    public string? ImageUrl { get; set; }
    public List<string> AdditionalImages { get; set; } = new();
    
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
}

public class CreateProductVariantDto
{
    public Guid ProductId { get; set; }
    
    public string? Color { get; set; }
    public string? Size { get; set; }
    public string? Material { get; set; }
    public string? Style { get; set; }
    
    public string Sku { get; set; } = string.Empty;
    public decimal? PriceAdjustment { get; set; }
    public int StockQuantity { get; set; }
    
    public string? ImageUrl { get; set; }
    public List<string>? AdditionalImages { get; set; }
    
    public bool IsDefault { get; set; }
}

public class UpdateProductVariantDto
{
    public string? Color { get; set; }
    public string? Size { get; set; }
    public string? Material { get; set; }
    public string? Style { get; set; }
    
    public decimal? PriceAdjustment { get; set; }
    public int StockQuantity { get; set; }
    
    public string? ImageUrl { get; set; }
    public List<string>? AdditionalImages { get; set; }
    
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
}

public class VariantOptionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public List<VariantValueDto> Values { get; set; } = new();
}

public class VariantValueDto
{
    public Guid Id { get; set; }
    public string Value { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? ColorCode { get; set; }
    public bool IsActive { get; set; }
}
