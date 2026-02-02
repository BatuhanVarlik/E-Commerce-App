using ETicaret.Application.DTOs.Shipment;
using ETicaret.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ETicaret.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShippingController : ControllerBase
{
    private readonly IShippingService _shippingService;
    private readonly ILogger<ShippingController> _logger;

    public ShippingController(
        IShippingService shippingService,
        ILogger<ShippingController> logger)
    {
        _shippingService = shippingService;
        _logger = logger;
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShipmentDto>> CreateShipment([FromBody] CreateShipmentDto dto)
    {
        try
        {
            var shipment = await _shippingService.CreateShipmentAsync(dto);
            return Ok(shipment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating shipment for order {OrderId}", dto.OrderId);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("order/{orderId}")]
    [Authorize]
    public async Task<ActionResult<ShipmentDto>> GetShipmentByOrderId(Guid orderId)
    {
        try
        {
            var shipment = await _shippingService.GetShipmentByOrderIdAsync(orderId);
            
            if (shipment == null)
            {
                return NotFound(new { message = "Bu sipariş için kargo kaydı bulunamadı" });
            }

            return Ok(shipment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting shipment for order {OrderId}", orderId);
            return StatusCode(500, new { message = "Bir hata oluştu" });
        }
    }

    [HttpGet("track/{trackingNumber}")]
    public async Task<ActionResult<ShipmentDto>> GetShipmentByTrackingNumber(string trackingNumber)
    {
        try
        {
            var shipment = await _shippingService.GetShipmentByTrackingNumberAsync(trackingNumber);
            
            if (shipment == null)
            {
                return NotFound(new { message = "Kargo kaydı bulunamadı" });
            }

            return Ok(shipment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking shipment {TrackingNumber}", trackingNumber);
            return StatusCode(500, new { message = "Bir hata oluştu" });
        }
    }

    [HttpPut("{shipmentId}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShipmentDto>> UpdateShipmentStatus(
        Guid shipmentId,
        [FromBody] UpdateShipmentStatusDto dto)
    {
        try
        {
            var shipment = await _shippingService.UpdateShipmentStatusAsync(shipmentId, dto);
            return Ok(shipment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating shipment {ShipmentId} status", shipmentId);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("my-shipments")]
    [Authorize]
    public async Task<ActionResult<List<ShipmentDto>>> GetMyShipments()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Kullanıcı girişi gerekli" });
            }

            var shipments = await _shippingService.GetShipmentsByUserIdAsync(userId);
            return Ok(shipments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user shipments");
            return StatusCode(500, new { message = "Bir hata oluştu" });
        }
    }
}
