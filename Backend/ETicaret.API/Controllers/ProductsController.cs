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

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        var result = await _catalogService.CreateProductAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
}
