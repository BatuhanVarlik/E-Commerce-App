using ETicaret.Application.DTOs.Product;
using ETicaret.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ETicaret.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProductsController : ControllerBase
{
    private readonly ICatalogService _catalogService;

    public ProductsController(ICatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _catalogService.GetProductsAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _catalogService.GetProductByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        var result = await _catalogService.SearchProductsAsync(q);
        return Ok(result);
    }

    [HttpGet("filter")]
    public async Task<IActionResult> GetFiltered([FromQuery] ProductFilterDto filter)
    {
        var result = await _catalogService.GetFilteredProductsAsync(filter);
        return Ok(result);
    }

    [HttpGet("autocomplete")]
    public async Task<IActionResult> Autocomplete([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
        {
            return Ok(new { suggestions = new List<object>() });
        }

        var result = await _catalogService.GetAutocompleteAsync(q);
        return Ok(new { suggestions = result });
    }

    [HttpPost("compare")]
    public async Task<IActionResult> CompareProducts([FromBody] CompareProductsRequest request)
    {
        if (request.ProductIds == null || request.ProductIds.Count < 2 || request.ProductIds.Count > 4)
        {
            return BadRequest(new { message = "2-4 arası ürün seçmelisiniz" });
        }

        var result = await _catalogService.CompareProductsAsync(request.ProductIds);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        var result = await _catalogService.CreateProductAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
}

// Request DTOs
public record CompareProductsRequest(List<Guid> ProductIds);
