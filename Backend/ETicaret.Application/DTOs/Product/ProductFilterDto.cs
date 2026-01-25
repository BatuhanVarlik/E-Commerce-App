namespace ETicaret.Application.DTOs.Product;

public class ProductFilterDto
{
    public string? SearchQuery { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? BrandId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? InStock { get; set; }
    public string? SortBy { get; set; } // price_asc, price_desc, name_asc, name_desc, newest
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class FilteredProductsResponseDto
{
    public IEnumerable<ProductDto> Products { get; set; } = new List<ProductDto>();
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public int CurrentPage { get; set; }
    public FilterOptionsDto FilterOptions { get; set; } = new FilterOptionsDto();
}

public class FilterOptionsDto
{
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public IEnumerable<BrandOptionDto> Brands { get; set; } = new List<BrandOptionDto>();
    public IEnumerable<CategoryOptionDto> Categories { get; set; } = new List<CategoryOptionDto>();
}

public class BrandOptionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int ProductCount { get; set; }
}

public class CategoryOptionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int ProductCount { get; set; }
    public IEnumerable<CategoryOptionDto> SubCategories { get; set; } = new List<CategoryOptionDto>();
}
