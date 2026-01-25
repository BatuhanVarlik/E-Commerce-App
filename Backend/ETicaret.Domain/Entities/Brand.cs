using ETicaret.Domain.Common;
using System.Text.Json.Serialization;

namespace ETicaret.Domain.Entities;

public class Brand : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Logo { get; set; } = string.Empty; // URL to logo

    [JsonIgnore]
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
