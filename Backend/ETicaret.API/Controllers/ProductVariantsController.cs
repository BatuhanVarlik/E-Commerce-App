using ETicaret.Application.DTOs.Product;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ETicaret.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProductVariantsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProductVariantsController> _logger;

    public ProductVariantsController(
        ApplicationDbContext context,
        ILogger<ProductVariantsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/ProductVariants/product/{productId}
    [HttpGet("product/{productId}")]
    public async Task<ActionResult<List<ProductVariantDto>>> GetProductVariants(Guid productId)
    {
        var variants = await _context.Set<ProductVariant>()
            .Where(v => v.ProductId == productId && v.IsActive)
            .OrderBy(v => v.IsDefault ? 0 : 1)
            .ThenBy(v => v.CreatedAt)
            .Select(v => new ProductVariantDto
            {
                Id = v.Id,
                ProductId = v.ProductId,
                Color = v.Color,
                Size = v.Size,
                Material = v.Material,
                Style = v.Style,
                Sku = v.Sku,
                PriceAdjustment = v.PriceAdjustment,
                FinalPrice = v.GetFinalPrice(),
                StockQuantity = v.StockQuantity,
                IsInStock = v.IsInStock(),
                IsLowStock = v.IsLowStock(),
                ImageUrl = v.ImageUrl,
                AdditionalImages = v.AdditionalImages,
                IsActive = v.IsActive,
                IsDefault = v.IsDefault
            })
            .ToListAsync();

        return Ok(variants);
    }

    // GET: api/ProductVariants/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductVariantDto>> GetVariant(Guid id)
    {
        var variant = await _context.Set<ProductVariant>()
            .Include(v => v.Product)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (variant == null)
        {
            return NotFound("Varyant bulunamadı");
        }

        return Ok(new ProductVariantDto
        {
            Id = variant.Id,
            ProductId = variant.ProductId,
            Color = variant.Color,
            Size = variant.Size,
            Material = variant.Material,
            Style = variant.Style,
            Sku = variant.Sku,
            PriceAdjustment = variant.PriceAdjustment,
            FinalPrice = variant.GetFinalPrice(),
            StockQuantity = variant.StockQuantity,
            IsInStock = variant.IsInStock(),
            IsLowStock = variant.IsLowStock(),
            ImageUrl = variant.ImageUrl,
            AdditionalImages = variant.AdditionalImages,
            IsActive = variant.IsActive,
            IsDefault = variant.IsDefault
        });
    }

    // POST: api/ProductVariants
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProductVariantDto>> CreateVariant([FromBody] CreateProductVariantDto dto)
    {
        // Check if product exists
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null)
        {
            return NotFound("Ürün bulunamadı");
        }

        // Check for duplicate SKU
        var existingSku = await _context.Set<ProductVariant>()
            .AnyAsync(v => v.Sku == dto.Sku);
        if (existingSku)
        {
            return BadRequest("Bu SKU zaten kullanımda");
        }

        var variant = new ProductVariant
        {
            ProductId = dto.ProductId,
            Color = dto.Color,
            Size = dto.Size,
            Material = dto.Material,
            Style = dto.Style,
            Sku = dto.Sku,
            PriceAdjustment = dto.PriceAdjustment,
            StockQuantity = dto.StockQuantity,
            ImageUrl = dto.ImageUrl,
            AdditionalImages = dto.AdditionalImages ?? new List<string>(),
            IsDefault = dto.IsDefault,
            IsActive = true
        };

        _context.Set<ProductVariant>().Add(variant);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Product variant created: {VariantId} for product {ProductId}", 
            variant.Id, dto.ProductId);

        return CreatedAtAction(nameof(GetVariant), new { id = variant.Id }, new ProductVariantDto
        {
            Id = variant.Id,
            ProductId = variant.ProductId,
            Color = variant.Color,
            Size = variant.Size,
            Material = variant.Material,
            Style = variant.Style,
            Sku = variant.Sku,
            PriceAdjustment = variant.PriceAdjustment,
            FinalPrice = variant.GetFinalPrice(),
            StockQuantity = variant.StockQuantity,
            IsInStock = variant.IsInStock(),
            IsLowStock = variant.IsLowStock(),
            ImageUrl = variant.ImageUrl,
            AdditionalImages = variant.AdditionalImages,
            IsActive = variant.IsActive,
            IsDefault = variant.IsDefault
        });
    }

    // PUT: api/ProductVariants/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateVariant(Guid id, [FromBody] UpdateProductVariantDto dto)
    {
        var variant = await _context.Set<ProductVariant>()
            .Include(v => v.Product)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (variant == null)
        {
            return NotFound("Varyant bulunamadı");
        }

        variant.Color = dto.Color;
        variant.Size = dto.Size;
        variant.Material = dto.Material;
        variant.Style = dto.Style;
        variant.PriceAdjustment = dto.PriceAdjustment;
        variant.StockQuantity = dto.StockQuantity;
        variant.ImageUrl = dto.ImageUrl;
        variant.AdditionalImages = dto.AdditionalImages ?? new List<string>();
        variant.IsActive = dto.IsActive;
        variant.IsDefault = dto.IsDefault;
        variant.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Product variant updated: {VariantId}", id);

        return NoContent();
    }

    // DELETE: api/ProductVariants/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteVariant(Guid id)
    {
        var variant = await _context.Set<ProductVariant>().FindAsync(id);
        if (variant == null)
        {
            return NotFound("Varyant bulunamadı");
        }

        // Soft delete
        variant.IsActive = false;
        variant.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Product variant deleted: {VariantId}", id);

        return NoContent();
    }

    // POST: api/ProductVariants/{id}/stock
    [HttpPost("{id}/stock")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStock(Guid id, [FromBody] int quantity)
    {
        var variant = await _context.Set<ProductVariant>().FindAsync(id);
        if (variant == null)
        {
            return NotFound("Varyant bulunamadı");
        }

        variant.StockQuantity = quantity;
        variant.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Stock updated for variant {VariantId}: {Quantity}", id, quantity);

        return Ok(new { StockQuantity = quantity, IsInStock = variant.IsInStock() });
    }
}
