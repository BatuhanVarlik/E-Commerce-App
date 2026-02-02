using ETicaret.Application.DTOs.Alert;
using ETicaret.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ETicaret.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AlertsController : ControllerBase
{
    private readonly IAlertService _alertService;

    public AlertsController(IAlertService alertService)
    {
        _alertService = alertService;
    }

    private string GetCurrentUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            throw new UnauthorizedAccessException("Kullanıcı girişi gerekli");
        }
        return userId;
    }

    // Price Alerts
    [HttpPost("price")]
    public async Task<ActionResult<PriceAlertDto>> CreatePriceAlert([FromBody] CreatePriceAlertDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var alert = await _alertService.CreatePriceAlertAsync(userId, dto);
            return CreatedAtAction(nameof(GetMyPriceAlerts), alert);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("price")]
    public async Task<ActionResult<IEnumerable<PriceAlertDto>>> GetMyPriceAlerts()
    {
        try
        {
            var userId = GetCurrentUserId();
            var alerts = await _alertService.GetMyPriceAlertsAsync(userId);
            return Ok(alerts);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("price/{id}")]
    public async Task<ActionResult> DeletePriceAlert(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _alertService.DeletePriceAlertAsync(id, userId);
            if (!result)
            {
                return NotFound(new { message = "Uyarı bulunamadı" });
            }
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("price/check/{productId}")]
    public async Task<ActionResult<bool>> HasPriceAlert(Guid productId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var hasAlert = await _alertService.HasPriceAlertForProductAsync(userId, productId);
            return Ok(hasAlert);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // Stock Alerts
    [HttpPost("stock")]
    public async Task<ActionResult<StockAlertDto>> CreateStockAlert([FromBody] CreateStockAlertDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var alert = await _alertService.CreateStockAlertAsync(userId, dto);
            return CreatedAtAction(nameof(GetMyStockAlerts), alert);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("stock")]
    public async Task<ActionResult<IEnumerable<StockAlertDto>>> GetMyStockAlerts()
    {
        try
        {
            var userId = GetCurrentUserId();
            var alerts = await _alertService.GetMyStockAlertsAsync(userId);
            return Ok(alerts);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("stock/{id}")]
    public async Task<ActionResult> DeleteStockAlert(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _alertService.DeleteStockAlertAsync(id, userId);
            if (!result)
            {
                return NotFound(new { message = "Uyarı bulunamadı" });
            }
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("stock/check/{productId}")]
    public async Task<ActionResult<bool>> HasStockAlert(Guid productId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var hasAlert = await _alertService.HasStockAlertForProductAsync(userId, productId);
            return Ok(hasAlert);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
