using ETicaret.Application.DTOs.Brand;
using ETicaret.Application.DTOs.Category;
using ETicaret.Application.DTOs.Product;
using ETicaret.Application.Interfaces;
using ETicaret.Domain.Entities;
using ETicaret.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ETicaret.Infrastructure.Services;

public class CatalogService : ICatalogService
{
    private readonly ApplicationDbContext _context;

    public CatalogService(ApplicationDbContext context)
    {
        _context = context;
    }

    // --- Categories ---
    public async Task<IEnumerable<CategoryDto>> GetCategoriesAsync()
    {
        var categories = await _context.Categories
            .Include(c => c.SubCategories)
                .ThenInclude(sc => sc.SubCategories)
                .ThenInclude(ssc => ssc.SubCategories) // 3. seviye kategoriler için
            .Where(c => c.ParentId == null) // Root categories
            .ToListAsync();

        return categories.Select(MapCategoryToDto);
    }

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto)
    {
        var category = new Category
        {
            Name = dto.Name,
            Slug = GenerateSlug(dto.Name),
            ParentId = dto.ParentId
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        // Yeni eklenen kategoriyi SubCategories ile birlikte yükle
        var createdCategory = await _context.Categories
            .Include(c => c.SubCategories)
                .ThenInclude(sc => sc.SubCategories)
                .ThenInclude(ssc => ssc.SubCategories) 
            .FirstOrDefaultAsync(c => c.Id == category.Id);

        return MapCategoryToDto(createdCategory ?? category);
    }

    public async Task<CategoryDto> UpdateCategoryAsync(Guid id, UpdateCategoryDto dto)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            throw new Exception("Kategori bulunamadı");

        category.Name = dto.Name;
        category.Slug = GenerateSlug(dto.Name);

        await _context.SaveChangesAsync();

        var updatedCategory = await _context.Categories
            .Include(c => c.SubCategories)
                .ThenInclude(sc => sc.SubCategories)
                .ThenInclude(ssc => ssc.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id);

        return MapCategoryToDto(updatedCategory ?? category);
    }

    public async Task DeleteCategoryAsync(Guid id)
    {
        var category = await _context.Categories
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            throw new Exception("Kategori bulunamadı");

        if (category.SubCategories.Any())
            throw new Exception("Alt kategorileri olan bir kategori silinemez");

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
    }

    private static CategoryDto MapCategoryToDto(Category c)
    {
        return new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            SubCategories = c.SubCategories.Select(MapCategoryToDto).ToList()
        };
    }

    // --- Brands ---
    public async Task<IEnumerable<BrandDto>> GetBrandsAsync()
    {
        return await _context.Brands
            .Select(b => new BrandDto { Id = b.Id, Name = b.Name })
            .ToListAsync();
    }

    public async Task<BrandDto> CreateBrandAsync(CreateBrandDto dto)
    {
        var brand = new Brand { Name = dto.Name };
        _context.Brands.Add(brand);
        await _context.SaveChangesAsync();

        return new BrandDto { Id = brand.Id, Name = brand.Name };
    }


    // --- Products ---
    public async Task<IEnumerable<ProductDto>> GetProductsAsync()
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .ToListAsync();

        return products.Select(MapProductToDto);
    }

    public async Task<ProductDto?> GetProductByIdAsync(Guid id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == id);

        return product == null ? null : MapProductToDto(product);
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductDto dto)
    {
        var product = new Product
        {
            Name = dto.Name,
            Slug = GenerateSlug(dto.Name),
            Description = dto.Description,
            Price = dto.Price,
            Stock = dto.Stock,
            ImageUrl = dto.ImageUrl,
            CategoryId = dto.CategoryId,
            BrandId = dto.BrandId
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        
        // Reload to get navigation properties if needed, or just return basic
        return await GetProductByIdAsync(product.Id) ?? throw new Exception("Error creating product");
    }

    public async Task<IEnumerable<ProductDto>> SearchProductsAsync(string query)
    {
        var lowerQuery = query.ToLower();
        var products = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Where(p => p.Name.ToLower().Contains(lowerQuery) || p.Description.ToLower().Contains(lowerQuery))
            .ToListAsync();

        return products.Select(MapProductToDto);
    }

    public async Task UpdateProductAsync(Guid id, CreateProductDto dto)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) throw new Exception("Ürün bulunamadı.");

        product.Name = dto.Name;
        // Optionally update slug if name changed, but be careful with URLs
        // product.Slug = GenerateSlug(dto.Name); 
        product.Description = dto.Description;
        product.Price = dto.Price;
        product.Stock = dto.Stock;
        product.ImageUrl = dto.ImageUrl;
        product.CategoryId = dto.CategoryId;
        product.BrandId = dto.BrandId;

        await _context.SaveChangesAsync();
    }

    public async Task DeleteProductAsync(Guid id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product != null)
        {
            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
        }
    }

    private static ProductDto MapProductToDto(Product p)
    {
        return new ProductDto
        {
            Id = p.Id,
            Name = p.Name,
            Slug = p.Slug,
            Description = p.Description,
            Price = p.Price,
            Stock = p.Stock,
            ImageUrl = p.ImageUrl,
            CategoryName = p.Category?.Name ?? "Unknown",
            CategoryId = p.CategoryId,
            BrandName = p.Brand?.Name ?? "Unknown",
            BrandId = p.BrandId
        };
    }

    private string GenerateSlug(string name)
    {
        return name.ToLower().Replace(" ", "-").Replace("ç", "c").Replace("ğ", "g").Replace("ı", "i").Replace("ö", "o").Replace("ş", "s").Replace("ü", "u");
    }
}
