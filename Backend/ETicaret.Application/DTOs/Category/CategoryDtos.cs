namespace ETicaret.Application.DTOs.Category;

public class CategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public IEnumerable<CategoryDto> SubCategories { get; set; } = new List<CategoryDto>();
}

public class CreateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
}

public class UpdateCategoryDto
{
    public string Name { get; set; } = string.Empty;
}
