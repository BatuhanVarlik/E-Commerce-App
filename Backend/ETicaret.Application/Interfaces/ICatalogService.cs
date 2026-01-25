using ETicaret.Application.DTOs.Brand;
using ETicaret.Application.DTOs.Category;
using ETicaret.Application.DTOs.Product;

namespace ETicaret.Application.Interfaces;

public interface ICatalogService
{
    // Categories
    Task<IEnumerable<CategoryDto>> GetCategoriesAsync();
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto);
    Task<CategoryDto> UpdateCategoryAsync(Guid id, UpdateCategoryDto dto);
    Task DeleteCategoryAsync(Guid id);

    // Brands
    Task<IEnumerable<BrandDto>> GetBrandsAsync();
    Task<BrandDto> CreateBrandAsync(CreateBrandDto dto);

    // Products
    Task<IEnumerable<ProductDto>> GetProductsAsync();
    Task<ProductDto?> GetProductByIdAsync(Guid id);
    Task<ProductDto> CreateProductAsync(CreateProductDto dto);
    Task<IEnumerable<ProductDto>> SearchProductsAsync(string query);
    Task UpdateProductAsync(Guid id, CreateProductDto dto);
    Task DeleteProductAsync(Guid id);
}
