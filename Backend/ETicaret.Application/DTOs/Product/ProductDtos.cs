namespace ETicaret.Application.DTOs.Product;

public class ProductDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public Guid BrandId { get; set; }
    
    // Variants
    public bool HasVariants { get; set; }
    public List<ProductVariantDto> Variants { get; set; } = new();
    public List<VariantOptionDto> VariantOptions { get; set; } = new();
}

public class CreateProductDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public Guid BrandId { get; set; }
}

public class AutocompleteDto
{
    public string Text { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "product", "category", "brand"
    public Guid? Id { get; set; }
}
