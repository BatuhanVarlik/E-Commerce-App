using ETicaret.Domain.Common;

namespace ETicaret.Domain.Entities;

public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    
    // Main Image
    public string ImageUrl { get; set; } = string.Empty;

    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public Guid BrandId { get; set; }
    public Brand Brand { get; set; } = null!;
    
    // Product Variants
    public List<ProductVariant> Variants { get; set; } = new();
    public List<VariantOption> VariantOptions { get; set; } = new();
    public bool HasVariants => Variants.Any();
    
    // Reviews
    public List<Review> Reviews { get; set; } = new();
}
