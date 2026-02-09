using ETicaret.Application.DTOs.Category;
using ETicaret.Application.Interfaces;
using ETicaret.Infrastructure.Attributes;
using Microsoft.AspNetCore.Mvc;

namespace ETicaret.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CategoriesController : ControllerBase
{
    private readonly ICatalogService _catalogService;

    public CategoriesController(ICatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    [HttpGet]
    [CacheResponse(DurationSeconds = 3600, KeyPrefix = "categories")] // 1 saat cache (kategoriler nadiren değişir)
    public async Task<IActionResult> GetAll()
    {
        var result = await _catalogService.GetCategoriesAsync();
        return Ok(result);
    }
}
