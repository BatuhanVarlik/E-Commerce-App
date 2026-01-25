using ETicaret.Domain.Common;
using System.Text.Json.Serialization;

namespace ETicaret.Domain.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    
    public Guid? ParentId { get; set; }
    [JsonIgnore]
    public Category? Parent { get; set; }
    public ICollection<Category> SubCategories { get; set; } = new List<Category>();
    
    [JsonIgnore]
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
